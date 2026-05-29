from dataclasses import dataclass


@dataclass
class ErrorDetail:
    type: str
    message: str


class AppException(Exception):
    status_code = 400
    public_message = "Application error."

    def __init__(self, message: str | None = None):
        self.message = message or self.public_message
        super().__init__(self.message)

    def to_error_detail(self) -> ErrorDetail:
        return ErrorDetail(type=self.__class__.__name__, message=self.message)


class ValidationException(AppException):
    status_code = 422
    public_message = "Request validation failed."


class TranscriptParseException(AppException):
    status_code = 422
    public_message = "Could not parse the transcript into speaker-labelled turns."


class ExtractionException(AppException):
    status_code = 502
    public_message = "Insight extraction failed. Please retry with a cleaner transcript."


class LLMException(AppException):
    status_code = 503
    public_message = "The language model service is temporarily unavailable."


class QuoteVerificationException(AppException):
    status_code = 500
    public_message = "Evidence verification failed."


class PersistenceException(AppException):
    status_code = 500
    public_message = "Failed to persist analysis result."


class NotFoundException(AppException):
    status_code = 404
    public_message = "Requested resource was not found."


class AnalysisNotFoundException(NotFoundException):
    public_message = "Analysis was not found."
