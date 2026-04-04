import os
import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

from oauth_service import get_jira_credentials

def _get_jira_config(user_email):
    creds = get_jira_credentials(user_email)
    domain = creds.get("jira_domain")
    return {
        "base_url": f"https://{domain}/rest/api/2" if domain else "",
        "domain": domain,
        "auth": HTTPBasicAuth(creds.get("jira_email"), creds.get("jira_token"))
    }

HEADERS = {"Accept": "application/json"}


def get_current_user_account_id(user_email=None):
    config = _get_jira_config(user_email)
    if not config["base_url"]: return None
    try:
        response = requests.get(
            f"{config['base_url']}/myself",
            auth=config['auth'],
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json().get("accountId")
    except Exception as e:
        print(f"Error fetching Jira user: {e}")
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
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json={
                "jql": f"assignee={account_id} AND statusCategory != Done ORDER BY priority DESC",
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
            headers={"Accept": "application/json", "Content-Type": "application/json"},
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
            headers={"Accept": "application/json", "Content-Type": "application/json"},
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
