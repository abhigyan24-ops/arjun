import os
import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

from oauth_service import get_jira_credentials

def _get_jira_config(user_email):
    creds = get_jira_credentials(user_email)
    jira_token = creds.get("jira_token")
    jira_domain = creds.get("jira_domain")
    jira_email = creds.get("jira_email")

    if jira_token:
        # OAuth mode
        headers = {
            "Authorization": f"Bearer {jira_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        try:
            resp = requests.get("https://api.atlassian.com/oauth/token/accessible-resources", headers={"Authorization": f"Bearer {jira_token}"})
            resp.raise_for_status()
            resources = resp.json()
            print(f"Jira accessible-resources for {user_email}: {resources}")
            if not resources:
                print(f"No Jira resources found for {user_email}")
                return {"base_url": "", "domain": jira_domain, "auth": None, "headers": headers}
            
            cloud_id = resources[0]["id"]
            base_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"
            print(f"Using Jira cloud_id: {cloud_id}, base_url: {base_url}")
        except Exception as e:
            print(f"Error fetching Jira cloud_id for {user_email}: {e}")
            cloud_id = None
            base_url = ""
            
        return {
            "base_url": base_url,
            "domain": jira_domain,
            "auth": None,
            "headers": headers
        }
    else:
        # If user_email is present, we should NOT fall back to global .env
        # Only fall back if user_email is None or empty (legacy/shared call)
        if user_email:
            print(f"No Jira token found for {user_email} in Supabase.")
            return {
                "base_url": "",
                "domain": None,
                "auth": None,
                "headers": {"Accept": "application/json", "Content-Type": "application/json"}
            }
            
        # Fallback to .env mode for legacy/unauthenticated calls
        return {
            "base_url": f"https://{jira_domain}/rest/api/2" if jira_domain else "",
            "domain": jira_domain,
            "auth": HTTPBasicAuth(jira_email, os.getenv("JIRA_API_TOKEN")),
            "headers": {"Accept": "application/json", "Content-Type": "application/json"}
        }

HEADERS = {"Accept": "application/json"}


def get_current_user_account_id(user_email=None):
    config = _get_jira_config(user_email)
    if not config["base_url"]: return None
    try:
        response = requests.get(
            f"{config['base_url']}/myself",
            auth=config['auth'],
            headers=config['headers']
        )
        response.raise_for_status()
        account_id = response.json().get("accountId")
        print(f"Jira accountId for {user_email}: {account_id}")
        return account_id
    except Exception as e:
        print(f"Error fetching Jira accountId for {user_email}: {e}")
        return None


def get_assigned_tickets(user_email=None):
    account_id = get_current_user_account_id(user_email)
    if not account_id:
        return []
    
    config = _get_jira_config(user_email)

    try:
        response = requests.post(
            f"{config['base_url']}/search/jql",
            auth=config['auth'],
            headers=config['headers'],
            json={
                "jql": f"assignee={account_id} AND statusCategory != Done ORDER BY priority DESC",
                "maxResults": 10,
                "fields": ["summary", "status", "priority", "issuetype"]
            }
        )
        response.raise_for_status()
        issues = response.json().get("issues", [])
        print(f"Fetched {len(issues)} assigned Jira tickets for {user_email}")

        tickets = []
        for issue in issues[:10]:
            key = issue.get("key", "")
            fields = issue.get("fields", {})
            tickets.append({
                "id": issue.get("id"),
                "key": key,
                "summary": fields.get("summary", ""),
                "status": fields.get("status", {}).get("name", ""),
                "priority": fields.get("priority", {}).get("name", ""),
                "type": fields.get("issuetype", {}).get("name", ""),
                "url": f"https://{config['domain']}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching assigned tickets: {e}")
        return []


def get_overdue_tickets(user_email=None):
    account_id = get_current_user_account_id(user_email)
    if not account_id:
        return []
        
    config = _get_jira_config(user_email)

    try:
        response = requests.post(
            f"{config['base_url']}/search/jql",
            auth=config['auth'],
            headers=config['headers'],
            json={
                "jql": f"assignee={account_id} AND due <= now() AND statusCategory != Done",
                "maxResults": 10,
                "fields": ["summary", "status", "priority", "issuetype", "duedate"]
            }
        )
        response.raise_for_status()
        issues = response.json().get("issues", [])

        tickets = []
        for issue in issues[:10]:
            key = issue.get("key", "")
            fields = issue.get("fields", {})
            tickets.append({
                "id": issue.get("id"),
                "key": key,
                "summary": fields.get("summary", ""),
                "status": fields.get("status", {}).get("name", ""),
                "priority": fields.get("priority", {}).get("name", ""),
                "type": fields.get("issuetype", {}).get("name", ""),
                "url": f"https://{config['domain']}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching overdue tickets: {e}")
        return []


def get_sprint_tickets(user_email=None):
    account_id = get_current_user_account_id(user_email)
    if not account_id:
        return []
        
    config = _get_jira_config(user_email)

    try:
        response = requests.post(
            f"{config['base_url']}/search/jql",
            auth=config['auth'],
            headers=config['headers'],
            json={
                "jql": f"assignee={account_id} AND sprint in openSprints()",
                "maxResults": 10,
                "fields": ["summary", "status", "priority", "issuetype"]
            }
        )
        response.raise_for_status()
        issues = response.json().get("issues", [])

        tickets = []
        for issue in issues[:10]:
            key = issue.get("key", "")
            fields = issue.get("fields", {})
            tickets.append({
                "id": issue.get("id"),
                "key": key,
                "summary": fields.get("summary", ""),
                "status": fields.get("status", {}).get("name", ""),
                "priority": fields.get("priority", {}).get("name", ""),
                "type": fields.get("issuetype", {}).get("name", ""),
                "url": f"https://{config['domain']}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching sprint tickets: {e}")
        return []


def get_jira_summary(user_email=None):
    assigned = get_assigned_tickets(user_email)
    overdue = get_overdue_tickets(user_email)
    sprint = get_sprint_tickets(user_email)

    return {
        "assigned": assigned,
        "overdue": overdue,
        "sprint": sprint,
        "total_assigned": len(assigned),
        "total_overdue": len(overdue)
    }
