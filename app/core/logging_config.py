import logging
from logging.config import dictConfig

from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "standard",
                    "level": settings.app_log_level,
                }
            },
            "loggers": {
                "app": {
                    "handlers": ["console"],
                    "level": settings.app_log_level,
                    "propagate": False,
                },
                "app.api": {
                    "handlers": ["console"],
                    "level": settings.app_log_level,
                    "propagate": False,
                },
                "app.pipeline": {
                    "handlers": ["console"],
                    "level": settings.app_log_level,
                    "propagate": False,
                },
                "uvicorn": {"handlers": ["console"], "level": "INFO"},
            },
            "root": {"handlers": ["console"], "level": settings.app_log_level},
        }
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
