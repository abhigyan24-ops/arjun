import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_briefing(emails: list, events: list, slack_messages: list = None):
    if slack_messages is None:
        slack_messages = []
    try:
        emails_text = ""
        for i, email in enumerate(emails, 1):
            emails_text += f"{i}. From: {email.get('sender', 'Unknown')}\n"
            emails_text += f"   Subject: {email.get('subject', 'No subject')}\n"
            emails_text += f"   Preview: {email.get('snippet', '')}\n\n"

        events_text = ""
        for i, event in enumerate(events, 1):
            events_text += f"{i}. {event.get('title', 'No title')}\n"
            events_text += f"   Time: {event.get('start_time', '')} - {event.get('end_time', '')}\n"
            events_text += f"   Attendees: {', '.join(event.get('attendees', []))}\n\n"

        slack_text = ""
        for msg in slack_messages:
            slack_text += f"[{msg.get('channel', 'Unknown')}] {msg.get('user', 'Unknown')}: {msg.get('text', '')}\n"

        prompt = f"""
You are a smart work assistant. Analyze these emails, calendar 
events, and slack messages and return a morning briefing.

EMAILS FROM LAST 24 HOURS:
{emails_text if emails_text else "No emails found"}

TODAY'S CALENDAR EVENTS:
{events_text if events_text else "No events today"}

SLACK MESSAGES:
{slack_text if slack_text else "No slack messages"}

Return ONLY a valid JSON object with NO markdown, NO backticks, 
NO explanation. Just raw JSON exactly like this:
{{
  "summary": "2-3 sentence morning briefing overview",
  "slack_summary": "2-3 sentence summary of what's happening in Slack channels",
  "urgent_emails": [
    {{"subject": "", "sender": "", "reason": "", "snippet": ""}}
  ],
  "meetings": [
    {{"title": "", "start_time": "", "end_time": "", "attendees": []}}
  ],
  "priorities": ["priority 1", "priority 2", "priority 3"],
  "email_count": {len(emails)},
  "meeting_count": {len(events)}
}}
"""
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a work assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=400,
        )

        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)

    except Exception as e:
        print(f"Error generating briefing: {e}")
        return {
            "summary": "Unable to generate briefing at this time.",
            "slack_summary": "Unable to generate slack summary at this time.",
            "urgent_emails": [],
            "meetings": [],
            "priorities": [],
            "email_count": len(emails),
            "meeting_count": len(events)
        }


def generate_standup(prs: list, issues: list, commits: list):
    try:
        prs_text = ""
        for i, pr in enumerate(prs, 1):
            prs_text += f"{i}. {pr.get('title', '')} ({pr.get('repo', '')})\n"

        issues_text = ""
        for i, issue in enumerate(issues, 1):
            issues_text += f"{i}. {issue.get('title', '')} ({issue.get('repo', '')})\n"

        commits_text = ""
        for i, commit in enumerate(commits, 1):
            commits_text += f"{i}. {commit.get('message', '')} ({commit.get('repo', '')})\n"

        prompt = f"""
Based on this GitHub activity, generate a short standup update in 2-3 sentences.

OPEN PULL REQUESTS:
{prs_text if prs_text else "None"}

ASSIGNED ISSUES:
{issues_text if issues_text else "None"}

RECENT COMMITS:
{commits_text if commits_text else "None"}

Format: "Yesterday I worked on [summary of commits/PRs]. Today I plan to [next steps based on open issues/PRs]. No blockers."
Keep it under 3 sentences. Return ONLY the standup text, no quotes, no markdown.
"""
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a developer assistant. Generate concise standup updates. Return plain text only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=400,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error generating standup: {e}")
        return "Unable to generate standup at this time."
