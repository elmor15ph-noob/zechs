"""Brain App backend entry point."""

import sys
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from config import BACKEND_HOST, BACKEND_PORT, BACKEND_RELOAD, LOG_DIR, LOG_LEVEL

LOG_FILE = LOG_DIR / "brain_app.log"


def setup_logging() -> None:
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)
    handlers: list[logging.Handler] = [
        logging.StreamHandler(sys.stdout),
        RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"),
    ]
    logging.basicConfig(level=level, format=fmt, handlers=handlers, force=True)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


setup_logging()

from api.routes import app  # noqa: E402  (import after logging setup)

if __name__ == "__main__":
    import uvicorn

    log = logging.getLogger("brain_app")
    log.info("Starting Brain API on %s:%s", BACKEND_HOST, BACKEND_PORT)
    log.info("API docs: http://%s:%s/docs", BACKEND_HOST, BACKEND_PORT)
    log.info("Log file: %s", LOG_FILE)
    log.info("Total routes ready: %d", len([r for r in app.routes if hasattr(r, "path")]))

    uvicorn.run(
        app,
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=False,
    )
