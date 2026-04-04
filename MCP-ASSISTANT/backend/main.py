from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os
import httpx
import oauth_service
from chat_service import process_chat
import alerts_service
import supabase_service
from scheduler import scheduler, set_google_token
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from gmail_service import fetch_recent_emails
from calendar_service import fetch_today_events
from gemini_service import generate_briefing, generate_standup
from github_service import get_open_prs, get_assigned_issues, get_recent_commits, get_github_data
from slack_service import get_channels, get_all_unread_messages, send_message, get_slack_data
from jira_service import get_jira_summary
from smart_actions_service import draft_email_reply, generate_meeting_prep

# Load .env variables
load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")
JIRA_CLIENT_ID = os.getenv("JIRA_CLIENT_ID")
JIRA_CLIENT_SECRET = os.getenv("JIRA_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://work-mind-ai.vercel.app")

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://work-mind-ai.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BriefingRequest(BaseModel):
    google_token: str

class SlackSendRequest(BaseModel):
    channel_id: str
    message: str
    user_email: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    google_token: str
    context: Optional[Dict[str, Any]] = {}
    user_email: Optional[str] = None

class EmailDraftRequest(BaseModel):
    email: dict
    instruction: str = ""
    user_email: Optional[str] = None

class MeetingPrepRequest(BaseModel):
    meeting: dict
    emails: list = []
    slack_messages: list = []
    user_email: Optional[str] = None

class GithubRequest(BaseModel):
    user_email: Optional[str] = None

class AlertCheckRequest(BaseModel):
    google_token: str
    user_email: str

class AlertUserRequest(BaseModel):
    user_email: str

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    print("[Startup] APScheduler started.")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/briefing")
def get_briefing(request: BriefingRequest):
    try:
        # Get user email
        credentials = Credentials(token=request.google_token)
        oauth2_service = build('oauth2', 'v2', credentials=credentials)
        user_info = oauth2_service.userinfo().get().execute()
        user_email = user_info.get("email", "")

        # Fetch data
        emails = fetch_recent_emails(request.google_token)
        events = fetch_today_events(request.google_token)
        slack_messages = get_all_unread_messages(user_email)
        jira_summary = get_jira_summary(user_email)
        
        # Generate briefing
        briefing = generate_briefing(emails, events, slack_messages)
        
        if isinstance(briefing, dict):
            briefing["jira_summary"] = {
                "total_assigned": jira_summary.get("total_assigned", 0),
                "total_overdue": jira_summary.get("total_overdue", 0),
                "top_tickets": jira_summary.get("assigned", [])[:3]
            }
            briefing["user_email"] = user_email
            
            # Save to supabase
            if user_email:
                supabase_service.save_briefing(user_email, briefing)
                supabase_service.update_last_login(user_email)
        
        return briefing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/briefing/history")
def get_briefing_history(user_email: str):
    try:
        history = supabase_service.get_briefing_history(user_email)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/slack/channels")
def fetch_slack_channels(user_email: Optional[str] = None):
    try:
        channels = get_channels(user_email)
        return channels
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/slack/messages")
def fetch_slack_messages(user_email: Optional[str] = None):
    try:
        check = get_slack_data(user_email)
        if check and check.get("not_connected"):
            return {"not_connected": True, "messages": [], "channels": []}

        messages = get_all_unread_messages(user_email)
        if user_email:
            supabase_service.save_slack_history(user_email, "general", messages)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/slack/send")
def post_slack_message(request: SlackSendRequest):
    try:
        response = send_message(request.channel_id, request.message, request.user_email)
        if not response.get("ok"):
            raise HTTPException(status_code=500, detail=response.get("message"))
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/github")
def get_github_summary(request: GithubRequest = None):
    try:
        user_email = request.user_email if request else None

        check = get_github_data(user_email)
        if check and check.get("not_connected"):
            return {"not_connected": True, "prs": [], "issues": [], "commits": [], "standup": ""}

        prs = get_open_prs(user_email)
        issues = get_assigned_issues(user_email)
        commits = get_recent_commits(user_email)

        standup = generate_standup(prs, issues, commits)

        github_data = {
            "prs": prs,
            "issues": issues,
            "commits": commits,
            "standup": standup
        }

        user_email = request.user_email if request else None
        if user_email:
            supabase_service.save_github_history(user_email, github_data)

        return github_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def post_chat(request: ChatRequest):
    try:
        response_text = process_chat(request.message, request.google_token, request.context)
        if request.user_email:
            supabase_service.save_chat_message(request.user_email, request.message, response_text, request.context)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jira")
def get_jira(user_email: Optional[str] = None):
    try:
        if user_email:
            from oauth_service import get_jira_credentials
            creds = get_jira_credentials(user_email)
            if not creds.get("jira_token") and not creds.get("jira_domain"):
                return {"not_connected": True, "assigned": [], "sprint": [], "overdue": []}

        jira_data = get_jira_summary(user_email)
        if user_email:
            supabase_service.save_jira_history(user_email, jira_data)
        return jira_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/smart/draft-email")
async def draft_email(request: dict):
    try:
        email = request.get("email", {})
        instruction = request.get("instruction", "")
        user_email = request.get("user_email", "")
        draft = draft_email_reply(email, instruction)
        
        if user_email:
            supabase_service.save_draft_email(user_email, email, instruction, draft)
            
        return {"draft": draft}
    except Exception as e:
        return {"error": str(e), "draft": ""}

@app.post("/smart/meeting-prep")
def post_meeting_prep(request: MeetingPrepRequest):
    try:
        prep = generate_meeting_prep(request.meeting, request.emails, request.slack_messages)
        
        if request.user_email:
            supabase_service.save_meeting_prep(request.user_email, request.meeting, prep)
            
        return {"prep": prep}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/tools")
def get_mcp_tools():
    try:
        return [
            {"name": "get_emails", "description": "Fetch recent emails from Gmail"},
            {"name": "get_calendar_events", "description": "Fetch today's calendar events"},
            {"name": "get_github_prs", "description": "Get open pull requests from GitHub"},
            {"name": "get_github_issues", "description": "Get assigned GitHub issues"},
            {"name": "get_slack_messages", "description": "Get recent Slack messages from all channels"},
            {"name": "send_slack_message", "description": "Send a message to a Slack channel"},
            {"name": "get_work_summary", "description": "Get a complete summary of all work activity"}
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- OAuth Endpoints ----------

@app.get("/auth/github")
def github_auth(user_email: str):
    url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&scope=repo,user&state={user_email}"
    return RedirectResponse(url=url)

@app.get("/auth/github/callback")
async def github_auth_callback(code: str, state: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code
            },
            headers={"Accept": "application/json"}
        )
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        if access_token:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_data = user_response.json()
            login = user_data.get("login")
            
            oauth_service.save_github_integration(
                user_email=state,
                token=access_token,
                username=login
            )
            
    return RedirectResponse(url=f"{FRONTEND_URL}/connections?github=success")

@app.get("/auth/slack")
def slack_auth(user_email: str):
    url = f"https://slack.com/oauth/v2/authorize?client_id={SLACK_CLIENT_ID}&scope=channels:read,channels:history,chat:write,users:read&state={user_email}&redirect_uri=https://workmind-ai-production.up.railway.app/auth/slack/callback"
    return RedirectResponse(url=url)

@app.get("/auth/slack/callback")
async def slack_auth_callback(code: str, state: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": SLACK_CLIENT_ID,
                "client_secret": SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": "https://workmind-ai-production.up.railway.app/auth/slack/callback"
            }
        )
        data = response.json()
        access_token = data.get("access_token")
        workspace = data.get("team", {}).get("name") if data.get("team") else None
        
        if access_token:
            oauth_service.save_slack_integration(
                user_email=state,
                token=access_token,
                workspace=workspace
            )
            
    return RedirectResponse(url=f"{FRONTEND_URL}/connections?slack=success")

@app.get("/auth/jira")
def jira_auth(user_email: str):
    url = f"https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id={JIRA_CLIENT_ID}&scope=read:jira-work%20read:jira-user%20offline_access&redirect_uri=https://workmind-ai-production.up.railway.app/auth/jira/callback&state={user_email}&response_type=code&prompt=consent"
    return RedirectResponse(url=url)

@app.get("/auth/jira/callback")
async def jira_auth_callback(code: str, state: str):
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://auth.atlassian.com/oauth/token",
            json={
                "grant_type": "authorization_code",
                "client_id": JIRA_CLIENT_ID,
                "client_secret": JIRA_CLIENT_SECRET,
                "code": code,
                "redirect_uri": "https://workmind-ai-production.up.railway.app/auth/jira/callback"
            }
        )
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        if access_token:
            resources_res = await client.get(
                "https://api.atlassian.com/oauth/token/accessible-resources",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            resources = resources_res.json()
            if resources:
                cloud_id = resources[0].get("id")
                site_name = resources[0].get("name")
                domain = f"{site_name}.atlassian.net"
                
                user_res = await client.get(
                    f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                user_data = user_res.json()
                emailAddress = user_data.get("emailAddress")
                
                oauth_service.save_jira_integration(
                    user_email=state,
                    token=access_token,
                    refresh_token=refresh_token,
                    domain=domain,
                    jira_email=emailAddress
                )
                
    return RedirectResponse(url=f"{FRONTEND_URL}/connections?jira=success")

@app.get("/integrations")
def get_integrations(user_email: str):
    try:
        integrations = oauth_service.get_user_integrations(user_email)
        if not integrations:
            return {
                "github": False,
                "slack": False,
                "jira": False,
                "github_username": None,
                "slack_workspace": None,
                "jira_domain": None
            }
            
        return {
            "github": bool(integrations.get("github_token")),
            "slack": bool(integrations.get("slack_token")),
            "jira": bool(integrations.get("jira_token")),
            "github_username": integrations.get("github_username"),
            "slack_workspace": integrations.get("slack_workspace"),
            "jira_domain": integrations.get("jira_domain")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Alert Endpoints ----------

@app.get("/alerts")
def get_alerts(user_email: str):
    try:
        return {
            "alerts": supabase_service.get_alerts(user_email),
            "unread_count": supabase_service.get_unread_count(user_email),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/read")
def mark_alerts_read(request: AlertUserRequest):
    try:
        supabase_service.mark_alerts_read(request.user_email)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/clear")
def clear_all_alerts(request: AlertUserRequest):
    try:
        supabase_service.clear_alerts(request.user_email)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/check")
def check_alerts_now(request: AlertCheckRequest):
    try:
        set_google_token(request.google_token)
        new_alerts = alerts_service.run_alert_check(request.google_token)
        
        # Deduplicate before saving
        saved_count = 0
        for alert in new_alerts:
            if not supabase_service.alert_exists(request.user_email, alert["source"], alert["title"]):
                supabase_service.save_alert(request.user_email, alert)
                saved_count += 1
                
        return {"success": True, "alerts_added": saved_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- History & Preferences Endpoints ----------

@app.get("/history/github")
def get_github_history(user_email: str):
    try:
        return {"history": supabase_service.get_github_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/slack")
def get_slack_history(user_email: str):
    try:
        return {"history": supabase_service.get_slack_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/jira")
def get_jira_history(user_email: str):
    try:
        return {"history": supabase_service.get_jira_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/chat")
def get_chat_history(user_email: str):
    try:
        return {"history": supabase_service.get_chat_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/drafts")
def get_drafts_history(user_email: str):
    try:
        return {"history": supabase_service.get_draft_emails_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/meetings")
def get_meetings_history(user_email: str):
    try:
        return {"history": supabase_service.get_meeting_prep_history(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/preferences")
def get_user_preferences(user_email: str):
    try:
        return {"preferences": supabase_service.get_user_preferences(user_email)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
