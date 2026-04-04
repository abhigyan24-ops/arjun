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
    if user_email:
        integration = get_user_integrations(user_email)
        if integration and integration.get("github_token"):
            return integration["github_token"]
        return None
    return os.getenv("GITHUB_TOKEN")

def get_slack_token(user_email):
    if user_email:
        integration = get_user_integrations(user_email)
        if integration and integration.get("slack_token"):
            return integration["slack_token"]
        return None
    return os.getenv("SLACK_BOT_TOKEN")

def get_jira_credentials(user_email):
    if user_email:
        integration = get_user_integrations(user_email)
        if integration and integration.get("jira_token"):
            return {
                "jira_token": integration["jira_token"],
                "jira_domain": integration.get("jira_domain"),
                "jira_email": integration.get("jira_email")
            }
        return {
            "jira_token": None,
            "jira_domain": None,
            "jira_email": None
        }
    return {
        "jira_token": None,
        "jira_domain": os.getenv("JIRA_DOMAIN"),
        "jira_email": os.getenv("JIRA_EMAIL")
    }

def refresh_jira_token(user_email):
    """
    Uses the stored jira_refresh_token to get a new access token from Atlassian.
    Saves the new token to Supabase and returns it.
    Returns None if refresh fails.
    """
    import requests
    import os
    
    try:
        integration = get_user_integrations(user_email)
        if not integration:
            print(f"No integration found for {user_email}")
            return None
            
        refresh_token = integration.get('jira_refresh_token')
        if not refresh_token:
            print(f"No jira_refresh_token found for {user_email}")
            return None
        
        JIRA_CLIENT_ID = os.getenv('JIRA_CLIENT_ID')
        JIRA_CLIENT_SECRET = os.getenv('JIRA_CLIENT_SECRET')
        
        response = requests.post(
            'https://auth.atlassian.com/oauth/token',
            json={
                'grant_type': 'refresh_token',
                'client_id': JIRA_CLIENT_ID,
                'client_secret': JIRA_CLIENT_SECRET,
                'refresh_token': refresh_token
            },
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Jira token refresh response status: {response.status_code}")
        print(f"Jira token refresh response: {response.text}")
        
        if response.status_code != 200:
            print(f"Failed to refresh Jira token for {user_email}: {response.text}")
            return None
        
        data = response.json()
        new_access_token = data.get('access_token')
        new_refresh_token = data.get('refresh_token', refresh_token)  # Atlassian rotates refresh tokens
        
        if not new_access_token:
            print(f"No access_token in refresh response for {user_email}")
            return None
        
        # Save new tokens to Supabase
        from datetime import datetime, timezone
        update_data = {
            'jira_token': new_access_token,
            'jira_refresh_token': new_refresh_token,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        supabase.table('user_integrations').update(update_data).eq('user_email', user_email).execute()
        print(f"Jira token refreshed and saved for {user_email}")
        
        return new_access_token
        
    except Exception as e:
        print(f"Error refreshing Jira token for {user_email}: {e}")
        return None
