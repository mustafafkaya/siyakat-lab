import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.api.v1.router import api_router

setup_logging()
logger = get_logger("siyakat.api")

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # V1 geliştirme aşaması; production'da kısıtlanmalı
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Her isteğe bir id verir, süresini ve sonucunu loglar."""
    request_id = uuid.uuid4().hex[:8]
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed = (time.perf_counter() - start) * 1000
        logger.exception(
            "[%s] %s %s -> 500 (%.1fms)", request_id, request.method, request.url.path, elapsed
        )
        raise
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "[%s] %s %s -> %s (%.1fms)",
        request_id, request.method, request.url.path, response.status_code, elapsed,
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Beklenmeyen hatalar: ham traceback sızdırmadan tek tip JSON dön, sunucuda logla."""
    logger.exception("Beklenmeyen hata: %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucuda beklenmeyen bir hata oluştu."},
    )


app.mount("/static", StaticFiles(directory=settings.STORAGE_ROOT), name="static")

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
def on_startup():
    logger.info(
        "%s başlatıldı (AI=%s, storage=%s)",
        settings.PROJECT_NAME, settings.AI_SERVICE_MODE, settings.STORAGE_BACKEND,
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
