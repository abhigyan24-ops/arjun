import os
import requests
from datetime import datetime, timedelta
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
            token = integration.get('github_token')
    if not token:
        return None
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

def get_github_data(user_email=None):
    """Top-level function that returns not_connected if no token found."""
    if user_email:
        integration = get_user_integration(user_email)
        if not integration or not integration.get('github_token'):
            return {"not_connected": True}
    headers = _get_headers(user_email)
    if headers is None:
        return {"not_connected": True}
    return None

def get_github_user(user_email=None):
    try:
        res = requests.get("https://api.github.com/user", headers=_get_headers(user_email))
        res.raise_for_status()
        data = res.json()
        return {
            "username": data.get("login", ""),
            "name": data.get("name", ""),
            "avatar_url": data.get("avatar_url", "")
        }
    except Exception as e:
        print(f"Error fetching GitHub user: {e}")
        return {"username": "", "name": "", "avatar_url": ""}


def get_open_prs(user_email=None):
    try:
        user = get_github_user(user_email)
        username = user.get("username", "")
        if not username:
            return []

        res = requests.get(
            f"https://api.github.com/search/issues?q=is:pr+is:open+author:{username}",
            headers=_get_headers(user_email)
        )
        res.raise_for_status()
        items = res.json().get("items", [])

        prs = []
        for pr in items[:5]:
            repo_url = pr.get("repository_url", "")
            repo_name = "/".join(repo_url.split("/")[-2:]) if repo_url else ""
            prs.append({
                "title": pr.get("title", ""),
                "repo": repo_name,
                "url": pr.get("html_url", ""),
                "created_at": pr.get("created_at", ""),
                "status": "open"
            })
        return prs
    except Exception as e:
        print(f"Error fetching open PRs: {e}")
        return []


def get_assigned_issues(user_email=None):
    try:
        res = requests.get(
            "https://api.github.com/issues?state=open&filter=assigned",
            headers=_get_headers(user_email)
        )
        res.raise_for_status()
        items = res.json()

        issues = []
        for issue in items[:5]:
            repo_url = issue.get("repository_url", "")
            repo_name = "/".join(repo_url.split("/")[-2:]) if repo_url else ""
            labels = [label.get("name", "") for label in issue.get("labels", [])]
            issues.append({
                "title": issue.get("title", ""),
                "repo": repo_name,
                "url": issue.get("html_url", ""),
                "created_at": issue.get("created_at", ""),
                "labels": labels
            })
        return issues
    except Exception as e:
        print(f"Error fetching assigned issues: {e}")
        return []


def get_recent_commits(user_email=None):
    try:
        user = get_github_user(user_email)
        username = user.get("username", "")
        if not username:
            return []

        yesterday = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")

        res = requests.get(
            f"https://api.github.com/search/commits?q=author:{username}+author-date:>={yesterday}",
            headers={**_get_headers(user_email), "Accept": "application/vnd.github.cloak-preview+json"}
        )
        res.raise_for_status()
        items = res.json().get("items", [])

        commits = []
        for item in items[:5]:
            commit_data = item.get("commit", {})
            repo_name = item.get("repository", {}).get("full_name", "")
            commits.append({
                "message": commit_data.get("message", "").split("\n")[0],
                "repo": repo_name,
                "date": commit_data.get("author", {}).get("date", ""),
                "url": item.get("html_url", "")
            })
        return commits
    except Exception as e:
        print(f"Error fetching recent commits: {e}")
        return []
