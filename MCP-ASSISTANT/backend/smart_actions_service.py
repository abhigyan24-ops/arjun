import os
import json
from groq import Groq
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.message import EmailMessage
import base64

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def draft_email_reply(original_email: dict, instruction: str = "", google_token: str = ""):
    try:
        sender = original_email.get("sender", "Unknown")
        subject = original_email.get("subject", "No subject")
        snippet = original_email.get("snippet", "")
        
        instruction_text = instruction if instruction else \
            "reply professionally and helpfully"
        
        prompt = f"""Draft a professional email reply.

Original email:
From: {sender}
Subject: {subject}
Content: {snippet}

Instruction: {instruction_text}

Write only the email body text. 
No subject line. No "Dear" prefix needed.
Keep it concise and professional."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional email assistant. Write clear, concise email replies."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        draft_text = response.choices[0].message.content.strip()
        
        gmail_draft_id = None
        gmail_error = None
        if google_token and sender != "Unknown":
            try:
                creds = Credentials(
                    token=google_token,
                    token_uri="https://oauth2.googleapis.com/token"
                )
                service = build('gmail', 'v1', credentials=creds)
                
                message = EmailMessage()
                message.set_content(draft_text)
                message['To'] = sender
                
                new_subject = subject if subject.lower().startswith('re:') else f"Re: {subject}"
                message['Subject'] = new_subject
                
                encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
                create_message = {'message': {'raw': encoded_message}}
                
                draft = service.users().drafts().create(userId='me', body=create_message).execute()
                gmail_draft_id = draft.get('id')
            except Exception as e:
                import traceback
                print(f"Error saving draft to Gmail: {e}")
                traceback.print_exc()
                gmail_error = str(e)
        
        return {
            "draft_text": draft_text,
            "draft_id": gmail_draft_id,
            "draft_url": f"https://mail.google.com/mail/u/0/#drafts?compose={gmail_draft_id}" if gmail_draft_id else None,
            "gmail_error": gmail_error
        }
        
    except Exception as e:
        print(f"Error drafting email: {e}")
        raise Exception(f"Failed to generate draft: {str(e)}")

def generate_meeting_prep(meeting: dict, 
                          emails: list = [], 
                          slack_messages: list = []):
    try:
        title = meeting.get("title", "Meeting")
        start_time = meeting.get("start_time", "")
        attendees = meeting.get("attendees", [])
        
        email_context = ""
        for email in emails[:3]:
            email_context += f"- {email.get('subject', '')} from {email.get('sender', '')}\n"
        
        slack_context = ""
        for msg in slack_messages[:5]:
            slack_context += f"- {msg.get('text', '')}\n"
        
        prompt = f"""Generate a meeting prep summary.

Meeting: {title}
Time: {start_time}
Attendees: {', '.join(attendees) if attendees else 'Not specified'}

Recent email context:
{email_context if email_context else 'No recent emails'}

Recent Slack context:
{slack_context if slack_context else 'No recent Slack messages'}

Provide:
1. Key topics to discuss (2-3 points)
2. Relevant context from emails/slack
3. Suggested talking points
Keep it concise and actionable."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a meeting preparation assistant. Be concise and actionable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=600
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"Error generating meeting prep: {e}")
        raise Exception(f"Failed to generate prep: {str(e)}")
