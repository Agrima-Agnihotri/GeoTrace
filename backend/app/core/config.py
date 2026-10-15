from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os


def parse_comma_list(v: Union[str, List[str]]) -> List[str]:
    if isinstance(v, str):
        return [item.strip() for item in v.split(",") if item.strip()]
    return v


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./geotrace.db"
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    APP_NAME: str = "GeoTrace GIS"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_VIDEO_TYPES_RAW: str = "video/mp4,video/quicktime,video/x-msvideo"
    ALLOWED_IMAGE_TYPES_RAW: str = "image/jpeg,image/png,image/tiff"
    AI_MODEL_ENDPOINT: str = ""
    AI_MODEL_API_KEY: str = ""
    AI_MODEL_VERSION: str = "placeholder-v1"
    CORS_ORIGINS_RAW: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def ALLOWED_VIDEO_TYPES(self) -> List[str]:
        return parse_comma_list(self.ALLOWED_VIDEO_TYPES_RAW)

    @property
    def ALLOWED_IMAGE_TYPES(self) -> List[str]:
        return parse_comma_list(self.ALLOWED_IMAGE_TYPES_RAW)

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return parse_comma_list(self.CORS_ORIGINS_RAW)

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)