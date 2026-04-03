import mcp
from mcp.server.fastmcp import FastMCP

from gmail_service import fetch_recent_emails
from calendar_service import fetch_today_events
from github_service import get_open_prs, get_assigned_issues, get_recent_commits
from slack_service import get_all_unread_messages, send_message, get_channels

mcp = FastMCP("WorkMind AI")

@mcp.tool()
def get_emails(google_token: str):
    """Fetch recent emails from Gmail"""
    return fetch_recent_emails(google_token)

@mcp.tool()
def get_calendar_events(google_token: str):
    """Fetch today's calendar events"""
    return fetch_today_events(google_token)

@mcp.tool()
def get_github_prs():
    """Get open pull requests from GitHub"""
    return get_open_prs()

@mcp.tool()
def get_github_issues():
    """Get assigned GitHub issues"""
    return get_assigned_issues()

@mcp.tool()
def get_slack_messages():
    """Get recent Slack messages from all channels"""
    return get_all_unread_messages()

@mcp.tool()
def send_slack_message(channel_id: str, message: str):
    """Send a message to a Slack channel"""
    return send_message(channel_id, message)

@mcp.tool()
def get_work_summary(google_token: str):
    """Get a complete summary of all work activity"""
    return {
        "emails": fetch_recent_emails(google_token),
        "events": fetch_today_events(google_token),
        "prs": get_open_prs(),
        "issues": get_assigned_issues(),
        "slack_messages": get_all_unread_messages()
    }
