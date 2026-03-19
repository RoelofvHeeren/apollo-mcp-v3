# 🎯 Mission Control Architecture

## Overview
Glassmorphism dark-themed dashboard for managing AI agent workforce.

## Structure

```
~/mission-control/
├── index.html              # Main Pulse Dashboard
├── command-center.html     # Agent deployment & control
├── chain-of-command.html   # Agent hierarchy & roles
├── operations.html         # Task management
├── claw-hub.html          # Skill marketplace
├── memory-vault.html      # Memory/journal browser
├── core-engine.html       # System settings
├── css/
│   └── styles.css         # Shared styles
├── js/
│   ├── app.js             # Main app logic
│   ├── api.js             # Data fetching
│   └── charts.js          # Visualizations
└── data/
    ├── agents.json        # Agent registry
    ├── tasks.json         # Task queue
    ├── costs.json         # API cost tracking
    └── logs/
        └── errors.json    # System error log
```

## Pages

| Page | Purpose | Key Features |
|------|---------|--------------|
| **Pulse Dashboard** | Main overview | API costs, task counts, error log, system status |
| **Command Center** | Deploy/manage agents | Spawn agents, monitor status, kill/restart |
| **Chain of Command** | Agent hierarchy | View agent roles, responsibilities, relationships |
| **Operations** | Task management | Kanban board, scheduled tasks, cron jobs |
| **Claw Hub** | Skills marketplace | Browse, install, audit skills |
| **Memory Vault** | Memory browser | Search journals, conversation history |
| **Core Engine** | System settings | Model config, API keys, gateway settings |

## Data Sources

### API Cost Tracking
- Read from OpenClaw logs or track via wrapper
- Aggregate by agent/model
- Monthly cycle tracking

### Task Queue
- Pull from `openclaw cron list`
- Active sessions from `sessions_list`
- Agent status from subagents

### Error Log
- Parse session errors
- Gateway status
- Agent crashes/failures

### Agent Registry
- Static config file
- Updated when agents are spawned
- Includes role, model, status

## Design System

### Colors
- Background: `#0a0a0a` (brand-dark)
- Primary: `#139187` (brand-teal)
- Glass: `rgba(255, 255, 255, 0.03)`
- Text: `#e2e8f0` (slate-200)
- Muted: `#64748b` (slate-500)

### Typography
- Font: System sans-serif
- Headings: Light weight, tracking-tight
- Labels: Uppercase, tracking-wider, 9-10px

### Effects
- Glass cards: `backdrop-filter: blur(20px)`
- Glow: `box-shadow: 0 0 15px rgba(19, 145, 135, 0.4)`
- Blur orbs: Background decorative gradients

## Real-time Updates

For MVP: Manual refresh or periodic polling
Future: WebSocket or Server-Sent Events

## Build Order
1. Pulse Dashboard (index.html) - template provided
2. CSS framework with custom properties
3. Data structures (JSON mocks)
4. JavaScript for interactivity
5. Remaining pages
