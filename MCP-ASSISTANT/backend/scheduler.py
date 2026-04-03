from apscheduler.schedulers.asyncio import AsyncIOScheduler
import alerts_service

# Store the latest Google token for scheduled runs
last_google_token = None


def set_google_token(token):
    """Update the stored Google token for scheduled alert checks."""
    global last_google_token
    last_google_token = token


def _run_scheduled_check():
    """Scheduled job: run alert check if we have a token."""
    if last_google_token is not None:
        print("[Scheduler] Running scheduled alert check...")
        alerts_service.run_alert_check(last_google_token)
    else:
        print("[Scheduler] Skipping alert check — no Google token available.")


# Create scheduler instance
scheduler = AsyncIOScheduler()
scheduler.add_job(_run_scheduled_check, "interval", minutes=30, id="alert_check")
