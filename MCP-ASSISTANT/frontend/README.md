# WorkMind AI — MCP-Based AI Work Assistant

## What is WorkMind AI?
WorkMind AI is an intelligent work assistant that connects your Gmail, Google Calendar, GitHub, Slack, and Jira into a single dashboard. It uses AI to generate daily briefings, surface urgent emails, track PRs and tickets, and help you draft email replies and prepare for meetings.

## Live Demo
- Frontend: https://work-mind-ai.vercel.app
- Backend: https://workmind-ai-production.up.railway.app

## Team
- Siddhant Jain (Team Lead)
- Divyansh Singh
- Manaswi Raj
- Shubh Jain

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion + Three.js
- **Backend:** Python + FastAPI + Uvicorn
- **AI:** Groq API (llama-3.1-8b-instant)
- **Database:** Supabase (PostgreSQL)
- **Deployed:** Vercel (frontend) + Railway (backend)

## Features
- AI Daily Briefing — summarizes your emails, meetings, PRs and Slack
- GitHub Integration — view open PRs, assigned issues, AI standup generator
- Slack Integration — read recent messages across channels
- Jira Integration — track assigned tickets and overdue items
- Gmail Integration — surface urgent emails with priority feed
- Google Calendar — view today's meetings
- Smart Actions — AI draft email replies and meeting prep notes
- AI Chat — ask WorkMind anything about your workday
- Alerts — real-time notifications for urgent items
- History — full log of briefings, drafts, and meeting preps

## How to Run Locally

### Backend
cd src/backend
pip install -r requirements.txt
uvicorn main:app --reload

### Frontend
cd src/frontend
npm install
npm run dev

## Environment Variables Required

### Backend (.env)
- GROQ_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- SLACK_CLIENT_ID
- SLACK_CLIENT_SECRET
- JIRA_CLIENT_ID
- JIRA_CLIENT_SECRET
- SUPABASE_URL
- SUPABASE_ANON_KEY

### Frontend (.env)
- VITE_GOOGLE_CLIENT_ID
- VITE_BACKEND_URL

## Architecture
The app uses an MCP (Model Context Protocol) server pattern where the FastAPI backend acts as the MCP server, aggregating data from all integrations and serving it to the React frontend. The AI layer uses Groq to generate briefings, standups, email drafts, and meeting prep notes.