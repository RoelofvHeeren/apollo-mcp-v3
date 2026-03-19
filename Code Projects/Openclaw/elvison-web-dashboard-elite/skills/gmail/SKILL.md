---
name: gmail-integration
description: "Integrate with Gmail for email automation and outreach. Use when: sending automated emails, reading inbox, managing labels, or creating email campaigns."
metadata:
  openclaw:
    emoji: "✉️"
---

# Gmail Integration

## Overview
Gmail API provides full email automation with 1000 sends/day quota.

## Authentication
Requires OAuth 2.0 with these scopes:
- `https://www.googleapis.com/auth/gmail.send` - Send emails only
- `https://www.googleapis.com/auth/gmail.modify` - Full access

## Setup
1. Google Cloud Console → Enable Gmail API
2. Create OAuth 2.0 credentials
3. Download `credentials.json`

## Sending Email

### Python Example
```python
import base64
from email.message import EmailMessage
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def send_email(service, to, subject, body_html):
    message = EmailMessage()
    message['To'] = to
    message['From'] = 'me'
    message['Subject'] = subject
    message.add_alternative(body_html, subtype='html')
    
    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    service.users().messages().send(
        userId='me',
        body={'raw': encoded}
    ).execute()

# Usage
service = build('gmail', 'v1', credentials=creds)
send_email(service, 'client@example.com', 'Your website is ready!', '<h1>Hello!</h1>')
```

### Node.js Example
```javascript
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendEmail() {
  const accessToken = await oauth2Client.getAccessToken();
  
  const transport = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'your-email@gmail.com',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  await transport.sendMail({
    from: '"Elvison" <you@gmail.com>',
    to: 'client@example.com',
    subject: 'Website Delivery',
    html: '<h1>Your website is ready!</h1>',
  });
}
```

## Quotas
- 1000 messages/day (sending)
- 1 billion quota units/day
- Check quota at: https://console.cloud.google.com/apis/api/gmail.googleapis.com/quotas

## Best Practices
- Use batch requests for multiple emails
- Implement exponential backoff for rate limits
- Store refresh tokens securely
- Use HTML templates for consistent branding
