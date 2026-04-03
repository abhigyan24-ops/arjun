from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# --- Briefing Functions ---

def save_briefing(user_email, briefing_data):
    try:
        data = {
            "user_email": user_email,
            "summary": briefing_data.get("summary", ""),
            "urgent_emails": briefing_data.get("urgent_emails", []),
            "meetings": briefing_data.get("meetings", []),
            "github_data": briefing_data.get("github_data", {}),
            "slack_data": briefing_data.get("slack_data", []),
            "jira_data": briefing_data.get("jira_data", []),
            "priorities": briefing_data.get("priorities", [])
        }
        result = supabase.table("briefings").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving briefing: {e}")
        return None

def get_briefing_history(user_email, limit=10):
    try:
        result = supabase.table("briefings").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting briefing history: {e}")
        return []

def get_latest_briefing(user_email):
    try:
        result = supabase.table("briefings").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(1).execute()
        data = result.data
        return data[0] if data else None
    except Exception as e:
        print(f"Error getting latest briefing: {e}")
        return None

# --- Alert Functions ---

def save_alert(user_email, alert):
    try:
        data = {
            "user_email": user_email,
            "source": alert["source"],
            "type": alert["type"],
            "title": alert["title"],
            "detail": alert.get("detail", ""),
            "read": False
        }
        result = supabase.table("alerts").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving alert: {e}")
        return None

def get_alerts(user_email):
    try:
        result = supabase.table("alerts").select("*").eq("user_email", user_email).order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        print(f"Error getting alerts: {e}")
        return []

def mark_alerts_read(user_email):
    try:
        result = supabase.table("alerts").update({"read": True}).eq("user_email", user_email).eq("read", False).execute()
        return result.data
    except Exception as e:
        print(f"Error marking alerts read: {e}")
        return None

def clear_alerts(user_email):
    try:
        result = supabase.table("alerts").delete().eq("user_email", user_email).execute()
        return result.data
    except Exception as e:
        print(f"Error clearing alerts: {e}")
        return None

def get_unread_count(user_email):
    try:
        result = supabase.table("alerts").select("*", count="exact").eq("user_email", user_email).eq("read", False).execute()
        return result.count or 0
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return 0

def alert_exists(user_email, source, title):
    try:
        result = supabase.table("alerts").select("id").eq("user_email", user_email).eq("source", source).eq("title", title).execute()
        return len(result.data) > 0
    except Exception as e:
        print(f"Error checking if alert exists: {e}")
        return False

# --- GitHub History Functions ---

def save_github_history(user_email, github_data):
    if not user_email: return None
    try:
        print("GitHub data being saved:", github_data)
        data = {
            "user_email": user_email,
            "open_prs": github_data.get("open_prs", []),
            "assigned_issues": github_data.get("assigned_issues", []),
            "recent_commits": github_data.get("recent_commits", []),
            "standup_message": str(github_data.get("standup_message", github_data.get("standup", github_data.get("ai_standup", "")))) 
        }
        result = supabase.table("github_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving GitHub history: {e}")
        return None

def get_github_history(user_email, limit=10):
    try:
        result = supabase.table("github_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting GitHub history: {e}")
        return []

# --- Slack History Functions ---

def save_slack_history(user_email, channel, messages):
    if not user_email: return None
    try:
        data = {
            "user_email": user_email,
            "channel": channel,
            "messages": messages
        }
        result = supabase.table("slack_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving Slack history: {e}")
        return None

def get_slack_history(user_email, limit=10):
    try:
        result = supabase.table("slack_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting Slack history: {e}")
        return []

# --- Jira History Functions ---

def save_jira_history(user_email, jira_data):
    if not user_email: return None
    try:
        print("Saving jira history:", jira_data)
        data = {
            "user_email": user_email,
            "assigned_tickets": jira_data.get("assigned_tickets") or jira_data.get("assigned") or jira_data.get("issues") or [],
            "overdue_tickets": jira_data.get("overdue_tickets") or jira_data.get("overdue") or [],
            "sprint_tickets": jira_data.get("sprint_tickets") or jira_data.get("sprint") or []
        }
        result = supabase.table("jira_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving Jira history: {e}")
        return None

def get_jira_history(user_email, limit=10):
    try:
        result = supabase.table("jira_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting Jira history: {e}")
        return []

# --- Chat History Functions ---

def save_chat_message(user_email, message, response, context_used):
    if not user_email: return None
    try:
        data = {
            "user_email": user_email,
            "message": message,
            "response": response,
            "context_used": context_used
        }
        result = supabase.table("chat_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving chat message: {e}")
        return None

def get_chat_history(user_email, limit=20):
    try:
        result = supabase.table("chat_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return []

# --- Draft Emails History Functions ---

def save_draft_email(user_email, original_email, instruction, drafted_reply):
    if not user_email: return None
    try:
        data = {
            "user_email": user_email,
            "original_email": original_email,
            "instruction": instruction,
            "drafted_reply": drafted_reply
        }
        result = supabase.table("draft_emails_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving draft email: {e}")
        return None

def get_draft_emails_history(user_email, limit=10):
    try:
        result = supabase.table("draft_emails_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting draft emails history: {e}")
        return []

# --- Meeting Prep History Functions ---

def save_meeting_prep(user_email, meeting, prep_notes):
    if not user_email: return None
    try:
        data = {
            "user_email": user_email,
            "meeting": meeting,
            "prep_notes": prep_notes
        }
        result = supabase.table("meeting_prep_history").insert(data).execute()
        return result.data
    except Exception as e:
        print(f"Error saving meeting prep: {e}")
        return None

def get_meeting_prep_history(user_email, limit=10):
    try:
        result = supabase.table("meeting_prep_history").select("*").eq("user_email", user_email).order("created_at", desc=True).limit(limit).execute()
        return result.data
    except Exception as e:
        print(f"Error getting meeting prep history: {e}")
        return []

# --- User Preferences Functions ---

from datetime import datetime, timezone

def save_user_preferences(user_email, preferences):
    if not user_email: return None
    try:
        data = {
            "user_email": user_email,
            "last_login": datetime.now(timezone.utc).isoformat(),
            "timezone": preferences.get("timezone", "Asia/Kolkata"),
            "notification_settings": preferences.get("notification_settings", {}),
            "theme": preferences.get("theme", "dark")
        }
        result = supabase.table("user_preferences").upsert(data, on_conflict="user_email").execute()
        return result.data
    except Exception as e:
        print(f"Error saving user preferences: {e}")
        return None

def get_user_preferences(user_email):
    try:
        result = supabase.table("user_preferences").select("*").eq("user_email", user_email).execute()
        data = result.data
        return data[0] if data else None
    except Exception as e:
        print(f"Error getting user preferences: {e}")
        return None

def update_last_login(user_email):
    if not user_email: return None
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        
        result = supabase.table("user_preferences").select("*").eq("user_email", user_email).execute()
        
        if len(result.data) > 0:
            update_result = supabase.table("user_preferences").update({"last_login": current_time}).eq("user_email", user_email).execute()
            return update_result.data
        else:
            data = {
                "user_email": user_email,
                "last_login": current_time,
                "timezone": "Asia/Kolkata",
                "notification_settings": {},
                "theme": "dark"
            }
            insert_result = supabase.table("user_preferences").insert(data).execute()
            return insert_result.data
    except Exception as e:
        print(f"Error updating last login: {e}")
        return None
