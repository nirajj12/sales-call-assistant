from contextlib import asynccontextmanager
import pathlib
import uuid

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.core.exceptions import (
    AnalysisNotFoundException,
    ExtractionException,
    LLMException,
    TranscriptParseException,
)
from app.core.logging_config import configure_logging, get_logger
from app.db.database import AnalysisRepository, JobRepository, init_db
from app.schemas.analysis import AnalyzeRequest, JobResponse
from app.schemas.common import AnalysisStatus


configure_logging()
settings = get_settings()
logger = get_logger("app.main")
analysis_repo = AnalysisRepository()
job_repo = JobRepository()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("application_startup env=%s", settings.environment)
    await init_db()
    yield
    logger.info("application_shutdown")


app = FastAPI(
    title="Intellify — Sales Call Intelligence",
    version="2.0.0",
    description="LangGraph-orchestrated MEDDIC pipeline.",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(TranscriptParseException)
async def transcript_handler(_, exc: TranscriptParseException):
    return _json_error(422, "TranscriptParseException", exc.message)


@app.exception_handler(ExtractionException)
async def extraction_handler(_, exc: ExtractionException):
    return _json_error(502, "ExtractionException", exc.message)


@app.exception_handler(LLMException)
async def llm_handler(_, exc: LLMException):
    return _json_error(503, "LLMException", exc.message)


@app.exception_handler(AnalysisNotFoundException)
async def not_found_handler(_, exc: AnalysisNotFoundException):
    return _json_error(404, "AnalysisNotFoundException", exc.message)


@app.exception_handler(Exception)
async def global_handler(_, exc: Exception):
    logger.exception("unhandled_exception error=%s", exc)
    return _json_error(500, "InternalServerError", "An unexpected error occurred.")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "intellify", "version": "2.0.0"}


@app.get("/")
async def root():
    return RedirectResponse(url=settings.frontend_dev_url, status_code=307)


@app.post(f"{settings.api_v1_prefix}/analyze", response_model=JobResponse, status_code=202)
async def analyze(body: AnalyzeRequest):
    from app.worker import run_analysis_task

    job_id = str(uuid.uuid4())
    await job_repo.create(job_id=job_id)
    run_analysis_task.apply_async(
        kwargs={
            "job_id": job_id,
            "raw_text": body.transcript,
            "source_name": body.source_name,
        },
        task_id=job_id,
    )
    logger.info("analysis_job_queued job_id=%s chars=%s", job_id, len(body.transcript))
    return JobResponse(
        job_id=job_id,
        status=AnalysisStatus.PENDING,
        message=f"Analysis queued. Poll {settings.api_v1_prefix}/jobs/{job_id}.",
    )


@app.post(f"{settings.api_v1_prefix}/analyze/upload", response_model=JobResponse, status_code=202)
async def analyze_upload(file: UploadFile = File(...)):
    from app.worker import run_analysis_task

    content = await file.read()
    filename = file.filename or "upload.txt"
    if not filename.endswith(".txt"):
        raise TranscriptParseException("Unsupported file type. Upload a .txt file.")
    if len(content) > 1_000_000:
        raise TranscriptParseException("File too large. Maximum 1MB.")
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    job_id = str(uuid.uuid4())
    source_name = pathlib.Path(filename).stem
    await job_repo.create(job_id=job_id)
    run_analysis_task.apply_async(
        kwargs={"job_id": job_id, "raw_text": text, "source_name": source_name},
        task_id=job_id,
    )
    logger.info("upload_job_queued job_id=%s filename=%s", job_id, filename)
    return JobResponse(
        job_id=job_id,
        status=AnalysisStatus.PENDING,
        message="File queued for analysis.",
    )


@app.get(f"{settings.api_v1_prefix}/jobs/{{job_id}}", response_model=JobResponse)
async def get_job(job_id: str):
    row = await job_repo.get(job_id)
    if not row:
        raise AnalysisNotFoundException(f"Job {job_id} not found.")
    return JobResponse(
        job_id=row.job_id,
        analysis_id=row.analysis_id,
        status=AnalysisStatus(row.status),
        message=row.error or f"Status: {row.status}",
    )


@app.get(f"{settings.api_v1_prefix}/analysis/{{analysis_id}}")
async def get_analysis(analysis_id: int):
    row = await analysis_repo.get(analysis_id)
    if not row:
        raise AnalysisNotFoundException(f"Analysis {analysis_id} not found.")
    return {
        "success": True,
        "data": {
            "id": row.id,
            "job_id": row.job_id,
            "source_name": row.source_name,
            "transcript_text": row.transcript_text,
            "normalized_turns": row.normalized_turns,
            "meddic": row.meddic,
            "completeness": row.completeness,
            "objections": row.objections,
            "deal_intelligence": row.deal_intelligence,
            "coaching": row.coaching,
            "verified_evidence": row.verified_evidence,
            "judge_result": row.judge_result,
            "metrics": row.metrics,
            "provider_used": row.provider_used,
            "errors": row.errors,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        },
    }


@app.get(f"{settings.api_v1_prefix}/analyses")
async def list_analyses(limit: int = 20):
    rows = await analysis_repo.list_recent(limit=limit)
    return {
        "success": True,
        "data": [
            {
                "id": row.id,
                "job_id": row.job_id,
                "source_name": row.source_name,
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "provider_used": row.provider_used,
                "completeness_score": row.completeness.get("score", 0) if row.completeness else 0,
            }
            for row in rows
        ],
    }


@app.get("/{frontend_path:path}", include_in_schema=False)
async def frontend_redirect(frontend_path: str):
    frontend_path = frontend_path.lstrip("/")
    target = settings.frontend_dev_url.rstrip("/")
    if frontend_path:
        target = f"{target}/{frontend_path}"
    return RedirectResponse(url=target, status_code=307)


def _json_error(status_code: int, error_type: str, message: str):
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": {"type": error_type, "message": message}},
    )
