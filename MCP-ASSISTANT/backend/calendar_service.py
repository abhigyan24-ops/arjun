from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timezone, timedelta

def fetch_today_events(access_token: str):
    try:
        credentials = Credentials(token=access_token)
        # Build service
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get start and end of today in UTC
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1, microseconds=-1)
        
        # Format for API
        time_min = start_of_day.isoformat()
        time_max = end_of_day.isoformat()
        
        # Fetch all events for today
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        event_list = []
        for event in events:
            title = event.get('summary', 'No Title')
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            attendees = [a.get('email') for a in event.get('attendees', []) if 'email' in a]
            
            event_list.append({
                "title": title,
                "start_time": start,
                "end_time": end,
                "attendees": attendees
            })
            
        return event_list
    except HttpError as error:
        print(f"An error occurred: {error}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []
