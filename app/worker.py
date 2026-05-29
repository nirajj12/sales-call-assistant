import asyncio
import uuid

from celery import Celery

from app.core.config import get_settings
from app.core.logging_config import configure_logging, get_logger


configure_logging()
settings = get_settings()
logger = get_logger("app.worker")

celery_app = Celery(
    "intellify",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(
    name="tasks.run_analysis",
    bind=True,
    max_retries=2,
    default_retry_delay=10,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def run_analysis_task(self, job_id: str, raw_text: str, source_name: str | None = None) -> dict:
    analysis_id = str(uuid.uuid4())[:8]

    async def _run() -> dict:
        from app.db.database import JobRepository
        from app.graph.state import AnalysisState
        from app.graph.workflow import compiled_graph
        from app.schemas.common import AnalysisStatus

        repo = JobRepository()
        await repo.update(job_id=job_id, status=AnalysisStatus.RUNNING.value)
        initial_state: AnalysisState = {
            "analysis_id": analysis_id,
            "job_id": job_id,
            "raw_text": raw_text,
            "source_name": source_name,
            "status": AnalysisStatus.RUNNING,
            "errors": [],
        }
        final_state = await compiled_graph.ainvoke(initial_state)
        status = final_state.get("status", AnalysisStatus.FAILED)
        status_value = status.value if hasattr(status, "value") else str(status)
        await repo.update(
            job_id=job_id,
            status=status_value,
            analysis_id=final_state.get("db_id"),
            error="; ".join(final_state.get("errors", [])) or None,
        )
        return {
            "job_id": job_id,
            "analysis_id": final_state.get("db_id"),
            "status": status_value,
        }

    logger.info("worker_task_started job_id=%s task_id=%s", job_id, self.request.id)
    return asyncio.run(_run())
