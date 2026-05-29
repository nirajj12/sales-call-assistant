from app.core.config import get_settings


settings = get_settings()

broker_url = settings.celery_broker_url
result_backend = settings.celery_result_backend
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
timezone = "UTC"
