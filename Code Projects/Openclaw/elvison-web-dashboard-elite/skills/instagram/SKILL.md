---
name: instagram-integration
description: "Integrate with Instagram for lead generation and outreach. Use when: automating Instagram DMs, scheduling posts, managing comments, or scraping leads from profiles. NOT for: bulk unsolicited messaging (violates ToS)."
metadata:
  openclaw:
    emoji: "📸"
---

# Instagram Integration

## Overview
Instagram automation is **limited** via official API. Business/Creator accounts have more features.

## Methods

### Option 1: Meta Graph API (Official)
**Best for:** Posts, comments, basic analytics

```javascript
// Check if business account
GET /{ig-user-id}?fields=account_type

// Get media
GET /{ig-user-id}/media
```

**Scopes needed:**
- `instagram_basic` - Read profile/media
- `instagram_content_publish` - Publish posts
- `instagram_manage_comments` - Manage comments

### Option 2: Manychat (Recommended for DMs)
**Best for:** DM automation, chatbots

- Connect Instagram Business account
- Build flow in Manychat
- Use Manychat API to trigger flows programmatically

```bash
# Manychat API
curl -X GET "https://api.manychat.com/fb/page/getInfo" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Option 3: Unofficial Scraping (Risky)
**Tools:** Instaloader, instagrapi

⚠️ **WARNING:** Violates ToS. Account may be banned.

## Lead Generation Workflow

```
1. Scrape profiles via Instagram Basic Display API
2. Filter by follower count/engagement
3. Extract bio/contact info
4. Queue leads for outreach
```

## Rate Limits
- 200 calls/hour per user for Instagram Basic API
- 100 calls/hour for Instagram Graph API

## Security
- Never store passwords
- Use OAuth tokens only
- Rotate tokens every 60 days
