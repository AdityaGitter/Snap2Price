import sys
import time
import logging
from app.config import settings
from app.database import SessionLocal, Base, engine
import app.models  # noqa: F401
from app.services.price_alert_service import price_alert_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("snap2price.worker")


def run_once() -> dict:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = price_alert_service.check_all_active_alerts(db)
        logger.info(
            "Price check cycle finished: checked=%d triggered=%d notifications=%d",
            result["checked_alerts"],
            result["triggered_count"],
            result["notifications_sent"],
        )
        return result
    except Exception as e:
        logger.exception("Error during price check cycle: %s", e)
        return {"checked_alerts": 0, "triggered_count": 0, "error": str(e)}
    finally:
        db.close()


def main():
    once_mode = "--once" in sys.argv
    interval = max(10, settings.PRICE_CHECK_INTERVAL_SECONDS)
    logger.info("Snap2Price Background Price Monitor started (interval=%ds)", interval)

    if once_mode:
        run_once()
        return

    while True:
        run_once()
        time.sleep(interval)


if __name__ == "__main__":
    main()
