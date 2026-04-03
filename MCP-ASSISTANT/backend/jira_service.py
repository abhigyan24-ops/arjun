import os
import requests
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth

load_dotenv()

JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_DOMAIN = os.getenv("JIRA_DOMAIN")
BASE_URL = f"https://{JIRA_DOMAIN}/rest/api/2"
AUTH = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
HEADERS = {"Accept": "application/json"}


def get_current_user_account_id():
    try:
        response = requests.get(
            f"{BASE_URL}/myself",
            auth=AUTH,
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json().get("accountId")
    except Exception as e:
        print(f"Error fetching Jira user: {e}")
        return None


def get_assigned_tickets():
    account_id = get_current_user_account_id()
    if not account_id:
        return []

    try:
        response = requests.post(
            f"{BASE_URL}/search/jql",
            auth=AUTH,
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
                "url": f"https://{JIRA_DOMAIN}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching assigned tickets: {e}")
        return []


def get_overdue_tickets():
    account_id = get_current_user_account_id()
    if not account_id:
        return []

    try:
        response = requests.post(
            f"{BASE_URL}/search/jql",
            auth=AUTH,
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
                "url": f"https://{JIRA_DOMAIN}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching overdue tickets: {e}")
        return []


def get_sprint_tickets():
    account_id = get_current_user_account_id()
    if not account_id:
        return []

    try:
        response = requests.post(
            f"{BASE_URL}/search/jql",
            auth=AUTH,
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
                "url": f"https://{JIRA_DOMAIN}/browse/{key}"
            })
        return tickets

    except Exception as e:
        print(f"Error fetching sprint tickets: {e}")
        return []


def get_jira_summary():
    assigned = get_assigned_tickets()
    overdue = get_overdue_tickets()
    sprint = get_sprint_tickets()

    return {
        "assigned": assigned,
        "overdue": overdue,
        "sprint": sprint,
        "total_assigned": len(assigned),
        "total_overdue": len(overdue)
    }
