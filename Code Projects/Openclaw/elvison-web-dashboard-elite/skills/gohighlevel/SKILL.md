---
name: gohighlevel-integration
description: "Integrate with GoHighLevel CRM for lead management, automation, and pipelines. Use when: managing leads, creating appointments, sending campaigns, or building workflows."
metadata:
  openclaw:
    emoji: "🎯"
---

# GoHighLevel Integration

## Overview
GoHighLevel (HighLevel) is an all-in-one CRM with comprehensive API for agencies.

## Authentication

### OAuth 2.0 (For multi-location apps)
```bash
# Authorization URL
https://marketplace.gohighlevel.com/oauth/chooselocation

# Token endpoint
POST https://services.leadconnectorhq.com/oauth/token
```

### Private Token (For single location)
Location Settings → Business Profile → API Key

## Core Endpoints

### Contacts
```bash
# Create contact
curl -X POST "https://services.leadconnectorhq.com/contacts/" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah@example.com",
    "phone": "+44...",
    "tags": ["linkedin_lead", "website_project"]
  }'

# Search contacts
GET /contacts?query=sarah&tags=linkedin_lead
```

### Opportunities (Pipelines)
```bash
# Create opportunity
curl -X POST "https://services.leadconnectorhq.com/opportunities/" \
  -d '{
    "title": "Sarah Website Project",
    "status": "open",
    "stageId": "...",
    "contactId": "...",
    "value": 500
  }'
```

### Appointments
```bash
# Create appointment
curl -X POST "https://services.leadconnectorhq.com/calendars/events" \
  -d '{
    "calendarId": "...",
    "contactId": "...",
    "title": "Website Review Call",
    "startTime": "2026-03-20T14:00:00Z"
  }'
```

### Send Messages
```bash
# Send SMS
curl -X POST "https://services.leadconnectorhq.com/conversations/messages" \
  -d '{
    "contactId": "...",
    "type": "SMS",
    "message": "Hi Sarah, your website is ready!"
  }'
```

## Rate Limits
- Burst: 100 requests per 10 seconds
- Daily: 200,000 requests per location

## Workflow Example
```python
# Lead comes in from LinkedIn
contact = ghl.create_contact(lead_data)

# Add to pipeline
opp = ghl.create_opportunity({
    "title": "Sarah Website Project",
    "contactId": contact['id'],
    "value": 500
})

# Trigger welcome sequence
ghl.trigger_workflow("welcome_sequence", contact['id'])
```
