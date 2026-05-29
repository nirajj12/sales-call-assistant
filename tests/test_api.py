from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_analyze_queues_job():
    with patch("app.main.job_repo.create", new_callable=AsyncMock), patch(
        "app.worker.run_analysis_task.apply_async"
    ) as apply_async:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/analyze",
                json={
                    "transcript": (
                        "Rep: What is your biggest challenge?\n"
                        "Customer: We lose 20 hours a week to manual reporting and need help."
                    ),
                    "source_name": "Test Call",
                },
            )
    assert response.status_code == 202
    assert response.json()["status"] == "pending"
    apply_async.assert_called_once()


@pytest.mark.asyncio
async def test_job_status_lookup():
    row = MagicMock()
    row.job_id = "job-123"
    row.analysis_id = 99
    row.status = "completed"
    row.error = None
    with patch("app.main.job_repo.get", new_callable=AsyncMock, return_value=row):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/jobs/job-123")
    assert response.status_code == 200
    assert response.json()["analysis_id"] == 99
