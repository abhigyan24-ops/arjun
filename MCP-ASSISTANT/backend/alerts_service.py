import uuid
from datetime import datetime, timezone

from gmail_service import fetch_recent_emails
from github_service import get_open_prs
from jira_service import get_assigned_tickets

# In-memory alert store
_alerts = []

URGENT_KEYWORDS = ["urgent", "asap", "action required", "immediately", "critical", "important"]


def check_gmail_alerts(google_token):
    """Flag emails with urgent keywords in the subject."""
    alerts = []
    try:
        emails = fetch_recent_emails(google_token)
        for email in emails:
            subject = email.get("subject", "")
            if any(kw in subject.lower() for kw in URGENT_KEYWORDS):
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "source": "gmail",
                    "type": "urgent_email",
                    "title": subject,
                    "detail": f"From {email.get('sender', 'Unknown')} — {email.get('snippet', '')[:120]}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "read": False,
                })
    except Exception as e:
        print(f"Error checking Gmail alerts: {e}")
    return alerts


def check_github_alerts():
    """Flag PRs where review has been requested."""
    alerts = []
    try:
        prs = get_open_prs()
        for pr in prs:
            # The get_open_prs returns search results; check for requested_reviewers
            # Since the search API doesn't return requested_reviewers directly,
            # we flag all open PRs as potential review items
            if pr.get("requested_reviewers") or pr.get("status") == "open":
                alerts.append({
                    "id": str(uuid.uuid4()),
                    "source": "github",
                    "type": "pr_review_requested",
                    "title": f"PR: {pr.get('title', 'Untitled')}",
                    "detail": f"Repository: {pr.get('repo', 'Unknown')}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "read": False,
                })
    except Exception as e:
        print(f"Error checking GitHub alerts: {e}")
    return alerts


def check_jira_alerts():
    """Flag overdue Jira tickets."""
    alerts = []
    try:
        tickets = get_assigned_tickets()
        today = datetime.now(timezone.utc).date()
        for ticket in tickets:
            duedate_str = ticket.get("duedate")
            status = ticket.get("status", "")
            if duedate_str and status not in ("Done", "Closed"):
                try:
                    due = datetime.strptime(duedate_str, "%Y-%m-%d").date()
                    if due < today:
                        alerts.append({
                            "id": str(uuid.uuid4()),
                            "source": "jira",
                            "type": "overdue_ticket",
                            "title": f"{ticket.get('key', '')} — {ticket.get('summary', 'Untitled')}",
                            "detail": f"Due: {duedate_str} | Status: {status}",
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "read": False,
                        })
                except ValueError:
                    pass
    except Exception as e:
        print(f"Error checking Jira alerts: {e}")
    return alerts


def run_alert_check(google_token):
    """Run all checks, deduplicate, append new alerts, and send Slack DMs."""
    global _alerts

    new_alerts = []
    existing_keys = {(a["source"], a["title"]) for a in _alerts}

    # Collect from all sources
    all_found = []
    if google_token:
        all_found.extend(check_gmail_alerts(google_token))
    all_found.extend(check_github_alerts())
    all_found.extend(check_jira_alerts())

    for alert in all_found:
        key = (alert["source"], alert["title"])
        if key not in existing_keys:
            _alerts.append(alert)
            new_alerts.append(alert)
            existing_keys.add(key)

    # Send Slack DMs for each new alert
    try:
        from slack_dm_service import send_alert_dm
        for alert in new_alerts:
            send_alert_dm(alert)
    except Exception as e:
        print(f"Error sending Slack DMs: {e}")

    return new_alerts


def get_all_alerts():
    """Return all alerts sorted by timestamp descending."""
    return sorted(_alerts, key=lambda a: a["timestamp"], reverse=True)


def get_unread_count():
    """Return count of unread alerts."""
    return sum(1 for a in _alerts if not a["read"])


def mark_all_read():
    """Mark every alert as read."""
    for a in _alerts:
        a["read"] = True


def clear_alerts():
    """Clear all alerts."""
    global _alerts
    _alerts = []
