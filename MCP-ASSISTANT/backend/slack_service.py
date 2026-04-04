import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from oauth_service import get_slack_token

def _get_headers(user_email):
    token = get_slack_token(user_email)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_channels(user_email=None):
    try:
        url = "https://slack.com/api/conversations.list"
        response = requests.get(url, headers=_get_headers(user_email))
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            print(f"Slack API error: {data.get('error')}")
            return []
            
        channels = []
        for channel in data.get("channels", []):
            if channel.get("is_channel") and not channel.get("is_archived"):
                channels.append({
                    "id": channel.get("id", ""),
                    "name": channel.get("name", ""),
                    "num_members": channel.get("num_members", 0)
                })
        return channels
    except Exception as e:
        print(f"Error fetching channels: {e}")
        return []

def get_channel_messages(channel_id, limit=10, user_email=None):
    try:
        url = "https://slack.com/api/conversations.history"
        params = {"channel": channel_id, "limit": limit}
        response = requests.get(url, headers=_get_headers(user_email), params=params)
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            print(f"Slack API error: {data.get('error')}")
            return []
            
        messages = []
        for msg in data.get("messages", []):
            ts_str = msg.get("ts", "")
            time_str = ""
            if ts_str:
                ts = float(ts_str)
                time_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
                
            messages.append({
                "text": msg.get("text", ""),
                "user": msg.get("user", ""),
                "time": time_str,
                "timestamp": ts_str
            })
        return messages
    except Exception as e:
        print(f"Error fetching messages for channel {channel_id}: {e}")
        return []

def get_all_unread_messages(user_email=None):
    try:
        channels = get_channels(user_email)
        all_messages = []
        for channel in channels:
            channel_id = channel["id"]
            channel_name = channel["name"]
            messages = get_channel_messages(channel_id, limit=5, user_email=user_email)
            for msg in messages:
                all_messages.append({
                    "channel": channel_name,
                    "text": msg["text"],
                    "user": msg["user"],
                    "time": msg["time"]
                })
        return all_messages
    except Exception as e:
        print(f"Error fetching all unread messages: {e}")
        return []

def send_message(channel_id, message, user_email=None):
    try:
        url = "https://slack.com/api/chat.postMessage"
        payload = {"channel": channel_id, "text": message}
        response = requests.post(url, headers=_get_headers(user_email), json=payload)
        response.raise_for_status()
        data = response.json()
        return {
            "ok": data.get("ok", False),
            "message": data.get("error") if not data.get("ok") else "Message sent"
        }
    except Exception as e:
        print(f"Error sending message to {channel_id}: {e}")
        return {"ok": False, "message": str(e)}
