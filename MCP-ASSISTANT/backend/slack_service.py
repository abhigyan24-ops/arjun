import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from supabase_service import supabase

def get_user_integration(user_email):
    if not user_email:
        return None
    try:
        result = supabase.table('user_integrations').select('*').eq('user_email', user_email).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except:
        return None

def _get_headers(user_email):
    token = None
    if user_email:
        integration = get_user_integration(user_email)
        if integration:
            token = integration.get('slack_token')
    if not token:
        return None
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_slack_data(user_email=None):
    """Top-level function that returns not_connected if no token found."""
    if user_email:
        integration = get_user_integration(user_email)
        if not integration or not integration.get('slack_token'):
            return {"not_connected": True, "recent_messages": [], "channels": []}
    headers = _get_headers(user_email)
    if headers is None:
        return {"not_connected": True, "recent_messages": [], "channels": []}
    return None

def resolve_usernames(user_ids, headers):
    """
    Given a list of Slack user IDs and auth headers, return a dict
    { user_id: display_name } by calling users.info for each unique ID.
    Results are cached within the call to avoid duplicate API requests.
    """
    cache = {}
    for uid in set(user_ids):
        if not uid:
            continue
        try:
            res = requests.get(
                "https://slack.com/api/users.info",
                headers=headers,
                params={"user": uid}
            )
            data = res.json()
            if data.get("ok") and data.get("user"):
                profile = data["user"].get("profile", {})
                display_name = (
                    profile.get("display_name")
                    or profile.get("real_name")
                    or data["user"].get("real_name")
                    or uid
                )
                cache[uid] = display_name
            else:
                cache[uid] = uid  # fallback to raw ID
        except Exception as e:
            print(f"[slack_service] Could not resolve user {uid}: {e}")
            cache[uid] = uid
    return cache

def get_channels(user_email=None):
    try:
        headers = _get_headers(user_email)
        if not headers:
            return []
        url = "https://slack.com/api/conversations.list"
        response = requests.get(url, headers=headers)
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

def get_channel_messages(channel_id, limit=20, user_email=None):
    try:
        headers = _get_headers(user_email)
        if not headers:
            return []
        url = "https://slack.com/api/conversations.history"
        params = {"channel": channel_id, "limit": limit}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        if not data.get("ok"):
            print(f"Slack API error: {data.get('error')}")
            return []

        raw_messages = data.get("messages", [])

        messages = []
        for msg in raw_messages:
            ts_str = msg.get("ts", "")
            time_str = ""
            if ts_str:
                ts = float(ts_str)
                time_str = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')

            uid = msg.get("user", "")
            messages.append({
                "text": msg.get("text", ""),
                "user": uid,
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
            messages = get_channel_messages(channel_id, limit=20, user_email=user_email)
            for msg in messages:
                all_messages.append({
                    "channel": channel_id,
                    "channel_name": channel_name,
                    "text": msg["text"],
                    "user": msg["user"],
                    "time": msg["time"],
                    "timestamp": msg.get("timestamp", "0")
                })
        
        # Sort all messages by timestamp (newest first) and limit to 20 total
        all_messages.sort(key=lambda x: float(x["timestamp"]), reverse=True)
        all_messages = all_messages[:20]

        # Collect all unique user IDs from messages
        unique_user_ids = list(set(msg.get('user', '') for msg in all_messages if msg.get('user')))

        # Batch resolve all users at once
        user_map = {}
        headers = _get_headers(user_email)
        for uid in unique_user_ids:
            try:
                user_resp = requests.get(
                    'https://slack.com/api/users.info',
                    headers=headers,
                    params={'user': uid}
                )
                user_data = user_resp.json()
                if user_data.get('ok') and user_data.get('user'):
                    profile = user_data['user'].get('profile', {})
                    user_map[uid] = (
                        profile.get('display_name') or 
                        profile.get('real_name') or 
                        user_data['user'].get('name') or 
                        uid
                    )
                else:
                    user_map[uid] = uid
            except:
                user_map[uid] = uid

        # Populate usernames and overwrite 'user' field with real name so briefings show names, not IDs
        for msg in all_messages:
            resolved_name = user_map.get(msg.get('user', ''), msg.get('user', 'Unknown'))
            msg['username'] = resolved_name
            msg['user'] = resolved_name  # Replace raw user_id with the real name

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
