---
name: linkedin-integration
description: "Integrate with LinkedIn for B2B lead generation and outreach. Use when: finding leads, sending connection requests, automating messages, or extracting profile data. NOT for: spamming or violating LinkedIn ToS."
metadata:
  openclaw:
    emoji: "💼"
---

# LinkedIn Integration

## Overview
LinkedIn has strict anti-automation policies. Official API is limited. Use approved tools.

## Methods

### Option 1: Linked API (Recommended)
**Cost:** $49/month per seat
**Best for:** Full automation with human-like behavior

```python
import linkedapi

client = linkedapi.Client(api_key="YOUR_KEY")

# Search profiles
profiles = client.search_people(
    keywords="real estate",
    location="London",
    industry="Real Estate"
)

# Send connection request
client.send_invitation(
    profile_id="abc123",
    message="Hi, I'd love to connect!"
)

# Send message
client.send_message(
    profile_id="abc123",
    message="Thanks for connecting!"
)
```

**Features:**
- Cloud browsers (undetectable)
- IP matching
- Rate limiting
- Real-time data

### Option 2: useArtemis
**Cost:** $49/month
**Best for:** AI-personalized outreach

- AI writes personalized invites
- Auto-enrichment
- Multichannel (LinkedIn + email)

### Option 3: Official LinkedIn API (Limited)
**Best for:** Company data, job postings

```bash
# Get profile (requires partnership program)
curl "https://api.linkedin.com/v2/people/{personId}" \
  -H "Authorization: Bearer {token}"
```

**Available endpoints:**
- Profile API (restricted)
- Company API
- Jobs API
- Share API (posts)

## Lead Generation Workflow

```
1. Define ICP (Ideal Customer Profile)
2. Search by: Title, Location, Industry, Company size
3. Filter active profiles (posted in last 30 days)
4. Extract: Name, Title, Company, Email (if available)
5. Enrich with Apollo/Hunter for emails
6. Queue for outreach
```

## Best Practices

**Avoid bans:**
- Max 20-30 connections/day for new accounts
- Max 50-100 messages/day
- Add delays between actions (30-120 seconds)
- Vary message templates
- Don't copy-paste same message

**Message template:**
```
Hi {first_name},

I noticed you're {title} at {company}. 

{personalized_line_based_on_recent_post}

I'd love to build you a free website to showcase your properties.

Worth a quick chat?

Best,
Elvison
```

## Integration with CRM

Export leads to GoHighLevel:
```python
# After LinkedIn scrape
lead = {
    "name": profile.name,
    "linkedin_url": profile.url,
    "title": profile.title,
    "company": profile.company,
    "email": enriched_email,
    "source": "LinkedIn",
    "tags": ["real_estate", "london"]
}

# POST to GoHighLevel API
gohighlevel.create_contact(lead)
```
