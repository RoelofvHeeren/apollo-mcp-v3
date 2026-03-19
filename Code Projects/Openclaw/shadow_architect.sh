#!/bin/bash

# --- CONFIGURATION ---
VPS_USER="root"
VPS_IP="187.124.226.246"
VPS_PATH="/root/openclaw-mcp"

echo "🕵️ [SHADOW ARCHITECT] Starting Autonomous Monitoring Loop..."
echo "📡 Link: $VPS_USER@$VPS_IP:$VPS_PATH"

# 1. Fetch Latest Architect Tasks
echo -e "\n📋 [LATEST ARCHITECT DIRECTIVES]"
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "tail -n 10 $VPS_PATH/architect_tasks.log 2>/dev/null || echo 'No tasks log found yet.'"

# 2. Monitor Gateway Health
echo -e "\n🩺 [SYSTEM LOGS]"
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "tail -n 20 $VPS_PATH/gateway.log 2>/dev/null || echo 'No gateway log found yet.'"

# 3. Monitor Agent Activity (if live)
echo -e "\n🤖 [AGENT ACTIVITY]"
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "tail -n 10 $VPS_PATH/agent_activity.log 2>/dev/null || echo 'No agent activity log found Yet.'"

echo -e "\n✨ Ready for Architectural Intervention."
