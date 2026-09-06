"""
Merkezi loglama yapılandırması.

Tek yerden log seviyesi ve format ayarlanır. İleride JSON log / dosyaya yazma
gibi ihtiyaçlar doğduğunda SADECE bu dosya değişir.
"""
import logging

from app.core.config import settings

_CONFIGURED = False


def setup_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    )
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
