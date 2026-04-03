from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def fetch_recent_emails(access_token: str):
    try:
        credentials = Credentials(token=access_token)
        # Build service
        service = build('gmail', 'v1', credentials=credentials)
        
        # Fetch emails from last 24 hours using query: "newer_than:1d"
        results = service.users().messages().list(userId='me', q="newer_than:1d").execute()
        messages = results.get('messages', [])
        
        email_list = []
        for msg in messages[:10]:
            msg_data = service.users().messages().get(
                userId='me', id=msg['id'], format='metadata', metadataHeaders=['Subject', 'From', 'Date']
            ).execute()
            
            headers = msg_data.get('payload', {}).get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
            sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown Sender")
            date = next((h['value'] for h in headers if h['name'] == 'Date'), "Unknown Date")
            snippet = msg_data.get('snippet', "")
            
            email_list.append({
                "subject": subject,
                "sender": sender,
                "snippet": snippet,
                "date": date
            })
            
        return email_list
    except HttpError as error:
        print(f"An error occurred: {error}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []
