#!/bin/bash

# --- CONFIGURATION (FILL THESE IN) ---
VPS_USER="root"
VPS_IP="187.124.226.246"
VPS_PATH="/root/openclaw-mcp" 
REPO_DIR="/Users/roelofvanheeren/Code Projects/Openclaw"

# 0. Check SSH Connection
echo "🔑 Checking SSH link..."
ssh -q -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" exit
if [ $? -ne 0 ]; then
    echo "❌ SSH connection failed. Check your IP and keys. Make sure you can run 'ssh $VPS_USER@$VPS_IP' without a password."
    exit 1
fi

# 1. Sync Local to GitHub
echo "🚀 [STAGE 1] Syncing Mac to GitHub..."
cd "$REPO_DIR" || exit
git add .
git commit -m "Automated Sync: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed. Aborting."
    exit 1
fi

# [NEW] Sync .env file directly (since it's ignored by Git)
echo "🔐 Syncing environment secrets (.env)..."
scp -o StrictHostKeyChecking=no "$REPO_DIR/.env" "$VPS_USER@$VPS_IP:$VPS_PATH/.env"

# 2. Trigger Pull & Restart on VPS via SSH
echo "🛰️ [STAGE 2] Updating VPS via SSH..."
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" << EOF
    # Sync Local to VPS (first the whole repo root)
    cd "$VPS_PATH" || { echo "❌ Folder not found on VPS"; exit 1; }
    git pull origin main
    
    # Now go to the app's actual directory
    cd "Code Projects/Openclaw" || { echo "❌ Subfolder not found on VPS"; exit 1; }
    
    # Install dependencies on the VPS
    echo "📦 Installing dependencies on VPS..."
    npm install --omit=dev
    
    # Restart the Gateway using PM2 for persistence
    echo "🔄 Refreshing OpenClaw Gateway (PM2)..."
    if ! command -v pm2 &> /dev/null; then
        echo "⚠️ PM2 not found. Installing..."
        npm install -g pm2
    fi
    
    pm2 delete "openclaw-gateway" 2>/dev/null
    PORT=8080 pm2 start api_gateway.js --name "openclaw-gateway"
    pm2 save

    # [NEW] Sync Elite Dashboard assets to Caddy Proxy
    echo "💎 Deploying Elite Dashboard assets to Proxy..."
    ELITE_DASH_PATH="Code Projects/Openclaw/elvison-web-dashboard-elite"
    if [ -d "$ELITE_DASH_PATH" ]; then
        docker exec elvison-proxy mkdir -p /etc/caddy/elite-dashboard
        docker cp "$ELITE_DASH_PATH/." elvison-proxy:/etc/caddy/elite-dashboard/
        docker exec elvison-proxy caddy reload --config /etc/caddy/Caddyfile
    fi
    
    echo "✅ VPS Sync & Persistence Complete!"
EOF

echo "✨ [LINK STABLE] Elite Dashboard and Neural Gateway are now in sync."
