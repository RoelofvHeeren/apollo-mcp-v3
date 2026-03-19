---
name: google-calendar-integration
description: "Integrate with Google Calendar for scheduling and appointment management. Use when: creating events, managing availability, sending invites, or syncing calendars."
metadata:
  openclaw:
    emoji: "📅"
---

# Google Calendar Integration

## Overview
Google Calendar API v3 provides full event management with support for recurring events, reminders, and attendees.

## Authentication
OAuth 2.0 scopes:
- `https://www.googleapis.com/auth/calendar` - Full access
- `https://www.googleapis.com/auth/calendar.events` - Events only

## Core Operations

### Create Event
```python
from googleapiclient.discovery import build

service = build('calendar', 'v3', credentials=creds)

event = {
    'summary': 'Website Review Call',
    'location': 'Zoom',
    'description': 'Review the new website design',
    'start': {
        'dateTime': '2026-03-20T14:00:00',
        'timeZone': 'Europe/London',
    },
    'end': {
        'dateTime': '2026-03-20T15:00:00',
        'timeZone': 'Europe/London',
    },
    'attendees': [
        {'email': 'client@example.com'},
    ],
    'reminders': {
        'useDefault': False,
        'overrides': [
            {'method': 'email', 'minutes': 24 * 60},
            {'method': 'popup', 'minutes': 10},
        ],
    },
}

event = service.events().insert(calendarId='primary', body=event).execute()
print(f'Event created: {event.get("htmlLink")}')
```

### List Events
```python
# Get upcoming events
events_result = service.events().list(
    calendarId='primary',
    timeMin=now,
    maxResults=10,
    singleEvents=True,
    orderBy='startTime'
).execute()

events = events_result.get('items', [])
```

### Check Availability
```python
# Free/busy query
body = {
    "timeMin": "2026-03-20T09:00:00Z",
    "timeMax": "2026-03-20T17:00:00Z",
    "timeZone": "Europe/London",
    "items": [{"id": "primary"}]
}

freebusy = service.freebusy().query(body=body).execute()
```

### Create Calendar (for clients)
```python
calendar = {
    'summary': 'Sarah Real Estate - Website Project',
    'timeZone': 'Europe/London'
}

created_calendar = service.calendars().insert(body=calendar).execute()
```

## Integration with GoHighLevel
```python
# When appointment booked in GoHighLevel
def sync_to_google_calendar(ghl_appointment):
    event = {
        'summary': ghl_appointment['title'],
        'start': {'dateTime': ghl_appointment['startTime']},
        'end': {'dateTime': ghl_appointment['endTime']},
        'attendees': [{'email': ghl_appointment['contact']['email']}],
    }
    
    service.events().insert(calendarId='primary', body=event).execute()
```

## Webhooks
Subscribe to calendar changes:
```bash
POST /calendar/v3/calendars/{calendarId}/events/watch
```

## Rate Limits
- Default: 1,000,000 queries per day
- Per method limits apply
