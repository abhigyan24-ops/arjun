import os
from datetime import datetime, timezone
from supabase_service import supabase

def save_github_integration(user_email, token, username):
    try:
        data = {
            "user_email": user_email,
            "github_token": token,
            "github_username": username,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("user_integrations").upsert(data, on_conflict="user_email").execute()
        return result.data
    except Exception as e:
        print(f"Error saving GitHub integration: {e}")
        return None

def save_slack_integration(user_email, token, workspace):
    try:
        data = {
            "user_email": user_email,
            "slack_token": token,
            "slack_workspace": workspace,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("user_integrations").upsert(data, on_conflict="user_email").execute()
        return result.data
    except Exception as e:
        print(f"Error saving Slack integration: {e}")
        return None

def save_jira_integration(user_email, token, refresh_token, domain, jira_email):
    try:
        data = {
            "user_email": user_email,
            "jira_token": token,
            "jira_refresh_token": refresh_token,
            "jira_domain": domain,
            "jira_email": jira_email,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        result = supabase.table("user_integrations").upsert(data, on_conflict="user_email").execute()
        return result.data
    except Exception as e:
        print(f"Error saving Jira integration: {e}")
        return None

def get_user_integrations(user_email):
    if not user_email: return None
    try:
        result = supabase.table("user_integrations").select("*").eq("user_email", user_email).execute()
        data = result.data
        return data[0] if data else None
    except Exception as e:
        print(f"Error getting user integrations: {e}")
        return None

def get_github_token(user_email):
    integration = get_user_integrations(user_email)
    if integration and integration.get("github_token"):
        return integration["github_token"]
    return os.getenv("GITHUB_TOKEN")

def get_slack_token(user_email):
    integration = get_user_integrations(user_email)
    if integration and integration.get("slack_token"):
        return integration["slack_token"]
    return os.getenv("SLACK_BOT_TOKEN")

def get_jira_credentials(user_email):
    integration = get_user_integrations(user_email)
    if integration and integration.get("jira_token"):
        return {
            "jira_token": integration["jira_token"],
            "jira_domain": integration["jira_domain"],
            "jira_email": integration["jira_email"]
        }
    return {
        "jira_token": None,
        "jira_domain": os.getenv("JIRA_DOMAIN"),
        "jira_email": os.getenv("JIRA_EMAIL")
    }
