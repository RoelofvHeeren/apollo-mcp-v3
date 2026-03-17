document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initYoyoVideo();
    initRouting();
    initDashboard();
    initCommandCenter();
    initAiArchitect();
});

// --- 🎞️ YOYO VIDEO LOGIC ---
function initYoyoVideo() {
    const video = document.getElementById('bg-video-yoyo');
    if (!video) return;
    video.play();
    video.addEventListener('timeupdate', () => {
        if (video.currentTime >= video.duration - 0.5) video.playbackRate = -1.0;
        if (video.currentTime <= 0.5) video.playbackRate = 1.0;
    });
}

// --- 🧭 HASH ROUTING ---
function initRouting() {
    const handleRoute = () => {
        const hash = window.location.hash || '#dashboard';
        const targetId = `screen-${hash.replace('#', '')}`;
        
        // Update Sidebar Active State
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });

        // Update Tab Visibility
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === targetId || (tab.id === 'screen-command-center' && hash === '#command-center'));
        });

        // Specific Tab Logic
        if (hash === '#hierarchy') initIsometricHierarchy();
    };

    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Initial load
}

// --- 📊 DASHBOARD ---
async function initDashboard() {
    const stream = document.getElementById('intelligence-stream');
    const fetchIntelligence = async () => {
        try {
            const res = await fetch('/api/intelligence');
            const data = await res.json();
            if (data.recent_logs) renderLogs(data.recent_logs);
        } catch (e) {
            stream.innerHTML = '<div style="color:var(--status-error); padding:20px;">Establishing secure stream... (Gateway Connection Refused)</div>';
        }
    };
    const renderLogs = (logs) => {
        stream.innerHTML = logs.map(log => `
            <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:8px; margin-bottom:12px; border:1px solid rgba(255,255,255,0.05)">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:var(--teal-accent); font-weight:700;">${log.agent || 'SYSTEM'}</span>
                    <span style="font-size:11px; opacity:0.5;">${new Date().toLocaleTimeString()}</span>
                </div>
                <div style="font-size:13px; color:var(--text-gray-300)">${log.task || log.status}</div>
            </div>
        `).join('');
    };
    fetchIntelligence();
    setInterval(fetchIntelligence, 5000);
}

// --- 🚢 COMMAND CENTER ---
function initCommandCenter() {
    const termOut = document.getElementById('term-output');
    const termIn = document.getElementById('term-input');
    const ccIn = document.getElementById('cc-input');
    const ccSend = document.getElementById('cc-send');

    // Terminal logic
    termIn?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const cmd = termIn.value;
            if (!cmd) return;
            termIn.value = '';
            termOut.innerHTML += `<div><span style="color:var(--teal-accent)">root@vps:~#</span> ${cmd}</div>`;
            termOut.scrollTop = termOut.scrollHeight;

            try {
                const res = await fetch('/api/shell', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ command: cmd })
                });
                const data = await res.json();
                if (data.error) {
                    termOut.innerHTML += `<div style="color:var(--status-error); margin-bottom:10px;">Error: ${data.error}</div>`;
                } else {
                    const sanitizedOutput = data.output.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    termOut.innerHTML += `<pre style="color:#4ade80; margin-bottom:10px; font-family:monospace; white-space:pre-wrap;">${sanitizedOutput}</pre>`;
                }
            } catch (err) {
                termOut.innerHTML += `<div style="color:var(--status-error)">Execution Error. Check Gateway status.</div>`;
            }
            termOut.scrollTop = termOut.scrollHeight;
        }
    });

    // Executive Directive logic
    ccSend?.addEventListener('click', async () => {
        const text = ccIn.value;
        if (!text) return;
        ccSend.textContent = "TRANSMITTING...";
        try {
            await fetch('/api/prompt', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: text, agent: 'pm', project: document.getElementById('cc-project-name').textContent })
            });
            ccIn.value = "";
            ccSend.textContent = "EXECUTE";
        } catch (e) {
            ccSend.textContent = "ERROR";
            setTimeout(() => ccSend.textContent = "EXECUTE", 2000);
        }
    });
}

// CC Navigation Logic (Global access)
window.openProject = (name) => {
    document.getElementById('cc-level-projects').classList.remove('active');
    document.getElementById('cc-level-control').classList.add('active');
    document.getElementById('cc-project-name').textContent = name;
};

window.goBackToProjects = () => {
    document.getElementById('cc-level-control').classList.remove('active');
    document.getElementById('cc-level-projects').classList.add('active');
};

// --- 🕸 ISOMETRIC HIERARCHY ---
function initIsometricHierarchy() {
    const stage = document.getElementById('hierarchy-stage');
    if (stage.querySelector('.iso-card')) return; // Already init

    const agents = [
        { name: 'CEO (User)', role: 'Grandmaster', status: 'ONLINE', x: 200, y: 100 },
        { name: 'PM Agent', role: 'Orchestrator', status: 'ACTIVE', x: 400, y: 250 },
        { name: 'Dev Agent', role: 'Architect', status: 'WAITING', x: 200, y: 400 },
        { name: 'Writer Agent', role: 'Scribe', status: 'IDLE', x: 600, y: 400 }
    ];

    stage.innerHTML = `
        <div style="position:relative; width:100%; height:100%; perspective:1000px;">
            <div style="position:absolute; width:2000px; height:2000px; top:-50%; left:-50%; transform: rotateX(60deg) rotateZ(45deg); background-image: linear-gradient(rgba(19,145,135,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(19,145,135,0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
            ${agents.map(a => `
                <div style="position:absolute; left:${a.x}px; top:${a.y}px; transition:0.5s;">
                    <div style="background:rgba(0,0,0,0.8); border:2px solid var(--teal-accent); padding:16px; border-radius:8px; width:180px; box-shadow:0 10px 20px rgba(0,0,0,0.5); transform: rotatez(-45deg) rotateX(-60deg);">
                        <div style="font-weight:700; color:white;">${a.name}</div>
                        <div style="font-size:11px; color:var(--teal-accent); opacity:0.8;">${a.role}</div>
                        <div style="font-size:10px; margin-top:8px; color:var(--status-success);">${a.status}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// --- 🤖 AI ARCHITECT ---
function initAiArchitect() {
    const aiIn = document.getElementById('ai-input');
    const aiSend = document.getElementById('ai-send');
    const aiHistory = document.getElementById('ai-chat-history');

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = `ai-msg ${type}`;
        msg.textContent = text;
        aiHistory.appendChild(msg);
        aiHistory.scrollTop = aiHistory.scrollHeight;
    };

    const handleSend = async () => {
        const text = aiIn.value;
        if (!text) return;
        aiIn.value = '';
        addMessage(text, 'user');

        try {
            const res = await fetch('/api/meta-dev', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            addMessage(data.response || "Neural link stable. Command received.", 'bot');
        } catch (e) {
            addMessage("Link Interrupted. Gateway unreachable.", 'bot');
        }
    };

    aiSend?.addEventListener('click', handleSend);
    aiIn?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
}
