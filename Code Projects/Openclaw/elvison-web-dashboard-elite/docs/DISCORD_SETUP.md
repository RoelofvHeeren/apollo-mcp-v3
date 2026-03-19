# Discord Integration Setup Guide

## Overview
The Discord Manager Agent creates a multi-channel workflow system where each OpenClaw agent has its own Discord channel. You can chat with multiple agents simultaneously, and all progress syncs back to the Mission Control dashboard.

## Architecture

```
You (Discord User)
    ↓
Discord Channels (#pm-chat, #research-tasks, etc.)
    ↓
Discord Manager Agent (Bot)
    ↓
Mission Control Backend (WebSocket)
    ↓
OpenClaw Agents + Dashboard
```

## Setup Steps

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "Elvison Claw Manager"
3. Go to "Bot" tab → Click "Add Bot"
4. Enable these Privileged Intents:
   - MESSAGE CONTENT INTENT ✓
   - SERVER MEMBERS INTENT ✓
   - PRESENCE INTENT ✓
5. Copy the Bot Token (keep this secret!)

### 2. Invite Bot to Server

1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Bot permissions:
   - Manage Channels
   - Manage Roles
   - Manage Messages
   - Read Messages/View Channels
   - Send Messages
   - Create Public Threads
   - Embed Links
   - Attach Files
   - Read Message History
   - Mention Everyone
4. Copy the generated URL and open it
5. Select your server and authorize

### 3. Configure Environment

Create `.env` file in `/backend/`:
```
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here
```

### 4. Install & Start

```bash
cd /home/node/mission-control/backend
npm install discord.js
node discord-bot.js
```

## Usage

### Initial Setup
In any Discord channel, type:
```
@DiscordManager setup server structure
```

This creates 7 categories with 20+ channels organized by function.

### Deploy an Agent
```
@DiscordManager deploy researcher to find real estate leads in London
```

The bot will:
1. Create a thread for this task
2. Spawn the Researcher agent
3. Post updates as it works
4. Report results back

### Direct Agent Chat
Simply post in any agent channel:
- `#research-tasks`: Talk directly to Researcher
- `#build-queue`: Talk to Website Builder
- `#outreach`: Talk to Outreach Specialist

Each channel routes to the right agent automatically.

### Check Status
```
@DiscordManager status
```

Shows all active agents, their tasks, and progress.

## Channel Organization

### By Function:

**MISSION CONTROL** (System Overview)
- #dashboard-alerts: Important notifications
- #cost-tracking: Live spending updates every 30s
- #system-status: Agent health/errors

**PROJECT MANAGER** (Strategy)
- #pm-chat: Direct PM conversation
- #pm-tasks: High-level task queue

**DESIGN DEPT** (Website Building)
- #research-tasks: Client/competitor research
- #template-library: Clone and store templates
- #build-queue: Active website builds

**LEAD GEN** (Sales)
- #lead-finding: Prospecting results
- #outreach: DM/email campaigns

## Workflows

### Lead → Website Pipeline

1. **#lead-finding**: "Find real estate agents in London"
   - Lead Finder agent scrapes Instagram/LinkedIn
   - Posts results as list

2. **#outreach**: "Contact these 12 leads with offer"
   - Outreach Specialist drafts messages
   - You approve, it sends

3. **#leadgen-chat**: Lead responds "Yes, interested"
   - Lead Gen Manager qualifies
   - Creates handoff to Design

4. **#research-tasks**: "Research Sarah's Real Estate"
   - Researcher analyzes their current site
   - Extracts content, competitors

5. **#build-queue**: "Build website using template #3"
   - Website Builder creates site
   - Posts preview link

6. **#outreach**: "Send final website to Sarah"
   - Delivers site
   - Schedules payment call

All progress visible in Mission Control dashboard!

## Dashboard Sync

Every action in Discord updates the dashboard:
- New task → Appears in Operations kanban
- Progress update → Updates progress bars
- Cost incurred → Adds to API cost breakdown
- Agent completes → Moves to "Done" column

## Multiple Concurrent Chats

You can have 10+ conversations running:
- Chatting with PM about strategy in #pm-chat
- Reviewing research in #research-tasks
- Approving outreach messages in #outreach
- Watching website build in #build-queue

All simultaneously, all tracked in dashboard.

## Daily Logbook

At 11:59 PM daily, bot posts to #logbook:
```
📊 DAILY REPORT - March 18, 2026

Tasks Completed: 8
Leads Contacted: 12
Websites Built: 2
Total Cost: $2.56

Highlights:
• Completed Mission Control dashboard
• Deployed 3 new agent sessions
• Generated $500 in pipeline
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `@DiscordManager setup` | Creates server structure |
| `@DiscordManager deploy [agent] to [task]` | Spawns agent for task |
| `@DiscordManager status` | Shows all active agents |
| `@DiscordManager create channel [name]` | Creates new channel |
| `@DiscordManager costs` | Posts current spending |
| `@DiscordManager logbook` | Generates daily report |

## Troubleshooting

**Bot not responding?**
- Check bot is online (green dot)
- Verify MESSAGE CONTENT INTENT is enabled
- Check bot has permissions in channel

**Commands not working?**
- Make sure you're @mentioning the bot
- Use exact command format
- Check server ID in .env matches

**Dashboard not syncing?**
- Verify backend is running (port 3001)
- Check WebSocket connection
- Refresh dashboard page
