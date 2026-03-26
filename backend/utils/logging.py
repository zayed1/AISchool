# B11 — Structured logging
import logging
import sys

_configured = False


def get_logger(name: str = "app") -> logging.Logger:
    global _configured
    logger = logging.getLogger(name)

    if not _configured:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        fmt = logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
        _configured = True

    return logger
