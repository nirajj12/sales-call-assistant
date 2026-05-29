from datetime import datetime
import os

from sqlalchemy import DateTime, Float, Integer, JSON, String, Text, desc, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.schemas.analysis import AnalysisResult


settings = get_settings()
logger = get_logger("app.db.database")
_ENGINE_PID: int | None = None
_ENGINE = None
_SESSION_FACTORY = None


def _normalize_async_database_url(database_url: str) -> str:
    url = make_url(database_url)
    backend = url.get_backend_name()
    driver = url.get_driver_name()
    if backend == "sqlite" and driver == "pysqlite":
        return database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if backend == "postgresql" and driver in {"psycopg2", "psycopg", "default"}:
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return database_url


def get_engine():
    global _ENGINE_PID, _ENGINE
    pid = os.getpid()
    if _ENGINE is None or _ENGINE_PID != pid:
        _ENGINE = create_async_engine(
            _normalize_async_database_url(settings.database_url),
            future=True,
            poolclass=NullPool,
        )
        _ENGINE_PID = pid
    return _ENGINE


def get_session_factory():
    global _SESSION_FACTORY
    engine = get_engine()
    if _SESSION_FACTORY is None or _SESSION_FACTORY.kw["bind"] is not engine:
        _SESSION_FACTORY = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _SESSION_FACTORY


class Base(DeclarativeBase):
    pass


class JobRow(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    analysis_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class AnalysisRow(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_turns: Mapped[list | None] = mapped_column(JSON, nullable=True)
    meddic: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    completeness: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    objections: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    deal_intelligence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    coaching: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    verified_evidence: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    judge_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    provider_used: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="completed")
    errors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


async def init_db() -> None:
    async with get_engine().begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    logger.info("database_initialized")


class AnalysisRepository:
    async def save(self, result: AnalysisResult) -> AnalysisRow:
        async with get_session_factory()() as session:
            row = AnalysisRow(
                job_id=result.job_id,
                source_name=result.request.transcript_name or result.transcript.source_name,
                transcript_text=result.transcript.raw_text,
                normalized_turns=[turn.model_dump() for turn in result.transcript.turns],
                meddic=result.meddic.model_dump() if result.meddic else None,
                completeness=result.completeness.model_dump() if result.completeness else None,
                objections=result.objections.model_dump() if result.objections else None,
                deal_intelligence=result.deal_intelligence.model_dump()
                if result.deal_intelligence
                else None,
                coaching=result.coaching.model_dump() if result.coaching else None,
                verified_evidence=[item.model_dump() for item in result.verified_evidence],
                judge_result=result.judge_result.model_dump() if result.judge_result else None,
                metrics=result.metrics.model_dump() if result.metrics else None,
                provider_used=result.provider_used,
                status=result.status.value,
                errors=result.errors,
            )
            session.add(row)
            await session.commit()
            await session.refresh(row)
            logger.info("analysis_persisted db_id=%s", row.id)
            return row

    async def get(self, analysis_id: int) -> AnalysisRow | None:
        async with get_session_factory()() as session:
            result = await session.execute(select(AnalysisRow).where(AnalysisRow.id == analysis_id))
            return result.scalar_one_or_none()

    async def list_recent(self, limit: int = 20) -> list[AnalysisRow]:
        async with get_session_factory()() as session:
            result = await session.execute(
                select(AnalysisRow).order_by(desc(AnalysisRow.created_at)).limit(limit)
            )
            return list(result.scalars().all())


class JobRepository:
    async def create(self, job_id: str) -> JobRow:
        async with get_session_factory()() as session:
            row = JobRow(job_id=job_id, status="pending")
            session.add(row)
            await session.commit()
            await session.refresh(row)
            return row

    async def update(
        self,
        job_id: str,
        status: str,
        analysis_id: int | None = None,
        error: str | None = None,
    ) -> None:
        async with get_session_factory()() as session:
            result = await session.execute(select(JobRow).where(JobRow.job_id == job_id))
            row = result.scalar_one_or_none()
            if not row:
                return
            row.status = status
            row.analysis_id = analysis_id or row.analysis_id
            row.error = error
            await session.commit()

    async def get(self, job_id: str) -> JobRow | None:
        async with get_session_factory()() as session:
            result = await session.execute(select(JobRow).where(JobRow.job_id == job_id))
            return result.scalar_one_or_none()
