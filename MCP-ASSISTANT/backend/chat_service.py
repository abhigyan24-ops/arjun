import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Setup Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def process_chat(message: str, google_token: str, context: dict = {}):
    try:
        system_prompt = (
            "You are WorkMind AI, a smart work assistant. "
            "You have access to the user's Gmail, Calendar, "
            "GitHub and Slack data provided in the context. "
            "Answer questions about their work, help them "
            "prioritize, draft messages, and give insights. "
            "Be concise and actionable."
        )
        
        user_content = f"User Message: {message}\n\nContext:\n{json.dumps(context, indent=2)}"
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_content,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"
