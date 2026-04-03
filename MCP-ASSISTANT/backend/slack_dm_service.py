import os
from datetime import datetime
from dotenv import load_dotenv
from slack_sdk import WebClient

load_dotenv()

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
client = WebClient(token=SLACK_BOT_TOKEN)


def send_alert_dm(alert):
    """Send a self-DM to the bot user with the alert details."""
    try:
        # Get bot's own user ID
        auth_response = client.auth_test()
        bot_user_id = auth_response["user_id"]

        # Open DM with self
        dm_response = client.conversations_open(users=[bot_user_id])
        channel_id = dm_response["channel"]["id"]

        # Format timestamp
        try:
            dt = datetime.fromisoformat(alert["timestamp"].replace("Z", "+00:00"))
            time_str = dt.strftime("%-I:%M %p")
        except Exception:
            time_str = alert.get("timestamp", "Unknown")

        # Build message
        source = alert.get("source", "unknown").upper()
        alert_type = alert.get("type", "unknown").replace("_", " ").title()
        title = alert.get("title", "No title")

        message = (
            f"[WorkMind Alert]\n"
            f"Source: {source}\n"
            f"Type: {alert_type}\n"
            f"Title: {title}\n"
            f"Time: {time_str}"
        )

        client.chat_postMessage(channel=channel_id, text=message)
        print(f"[Slack DM] Alert sent: {title}")

    except Exception as e:
        print(f"[Slack DM] Error sending alert: {e}")
