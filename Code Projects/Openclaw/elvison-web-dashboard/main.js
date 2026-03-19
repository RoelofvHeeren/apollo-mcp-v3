document.addEventListener('DOMContentLoaded', () => {
    initV4Navigation();
    initV4Toggles();
    initV4GlobalBackdrop();
    initCommandStation();
    initHierarchyEngine();
    initArchitectStation();
    initMissionControlData();
    lucide.createIcons();
});

// --- 🧭 SPA NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(section => section.classList.add('hidden'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.remove('hidden');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active-nav');
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) item.classList.add('active-nav');
    });

    if (sectionId === 'command') initWebSocket();
    if (sectionId === 'hierarchy') setTimeout(updateConduits, 100);
    
    lucide.createIcons();
}
window.showSection = showSection;

function initV4Navigation() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;
    toggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        const icon = document.getElementById('toggle-icon');
        if (icon) icon.setAttribute('data-lucide', collapsed ? 'chevron-right' : 'chevron-left');
        lucide.createIcons();
    });
}

// --- 🎥 VIDEO BACKDROP ---
function initV4GlobalBackdrop() {
    const video = document.getElementById('bg-video');
    if (!video) return;
    video.play().catch(() => {
        document.addEventListener('click', () => video.play(), { once: true });
    });
}

// --- 📡 REAL-TIME WEBSOCKET HUB ---
let socket = null;
function initWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use absolute path for relay to ensure Caddy/Proxy works
    const wsUrl = `${protocol}//${window.location.host}/chat-relay`;
    
    console.log(`[Neural Link] Connecting to ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('[Neural Link] Online');
        updateLiveIndicator(true);
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.method === 'chat.response' || data.text) {
                appendAgentMessage(data.text || data.params?.text || "Neural response captured.");
            }
        } catch (e) {
            console.error("[Neural Link] Parse Error", e);
        }
    };

    socket.onclose = () => {
        console.log('[Neural Link] Offline. Retrying...');
        updateLiveIndicator(false);
        setTimeout(initWebSocket, 5000);
    };

    socket.onerror = (err) => {
        console.error("[Neural Link] Connection Error", err);
        updateLiveIndicator(false);
    };
}

function updateLiveIndicator(isOnline) {
    const indicator = document.querySelector('.bg-green-500\\/10');
    if (!indicator) return;
    if (isOnline) {
        indicator.classList.remove('bg-red-500/10', 'text-red-500');
        indicator.classList.add('bg-green-500/10', 'text-green-500');
        indicator.querySelector('span').innerText = 'Live Relay';
    } else {
        indicator.classList.remove('bg-green-500/10', 'text-green-500');
        indicator.classList.add('bg-red-500/10', 'text-red-500');
        indicator.querySelector('span').innerText = 'Neural Offline';
    }
}

// --- ⌨ COMMAND STATION LOGIC ---
function initCommandStation() {
    const vpsInput = document.getElementById('vps-input');
    const termOutput = document.getElementById('terminal-output');
    
    if (vpsInput && termOutput) {
        vpsInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const cmd = vpsInput.value;
                if (!cmd) return;
                vpsInput.value = '';
                termOutput.innerHTML += `<div class="mt-4"><span class="text-teal-500 font-bold">root@elvison:~$</span> ${cmd}</div>`;
                termOutput.scrollTop = termOutput.scrollHeight;

                try {
                    const res = await fetch('/api/shell', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: cmd })
                    });
                    const data = await res.json();
                    const sanitized = (data.output || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    termOutput.innerHTML += `<pre class="text-teal-400 mt-2 font-mono whitespace-pre-wrap opacity-60">${sanitized || 'Command executed.'}</pre>`;
                } catch (err) {
                    termOutput.innerHTML += `<div class="text-red-500 mt-2 font-mono">Gateway disconnected.</div>`;
                }
                termOutput.scrollTop = termOutput.scrollHeight;
            }
        });
    }

    const agentInput = document.getElementById('agent-input');
    const agentSend = document.getElementById('agent-send');
    if (agentInput && agentSend) {
        const handleSend = () => {
            const msg = agentInput.value;
            const agentId = document.getElementById('agent-selector')?.value || 'pm';
            if (!msg) return;
            agentInput.value = '';
            appendUserMessage(msg);
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ method: 'chat.send', params: { text: msg, agentId: agentId } }));
            } else {
                appendAgentMessage("Neural Link Offline. Reconnecting...");
                initWebSocket();
            }
        };
        agentSend.addEventListener('click', handleSend);
        agentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    }
}

function appendUserMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-brand-teal/10 p-6 rounded-[32px] rounded-tr-none border border-brand-teal/20 shadow-sm ml-auto max-w-[90%] fade-in">
            <p class="text-sm text-white leading-relaxed font-bold">${text}</p>
            <span class="text-[9px] text-brand-teal mt-3 block font-black uppercase tracking-widest text-right">COMMANDER // HUB</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

function appendAgentMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    const agentId = document.getElementById('agent-selector')?.value || 'pm';
    feed.innerHTML += `
        <div class="bg-white/5 p-6 rounded-[32px] rounded-tl-none border border-white/10 max-w-[90%] fade-in mt-4">
            <p class="text-sm text-white/80 leading-relaxed font-medium">${text}</p>
            <span class="text-[9px] text-white/20 mt-3 block font-bold uppercase tracking-widest">AGENT // ${agentId.toUpperCase()}</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

// --- 🏗 HIERARCHY ENGINE ---
let scale = 0.8;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let startX, startY;

function initHierarchyEngine() {
    const viewport = document.getElementById('hierarchy-viewport');
    const canvas = document.getElementById('hierarchy-canvas');
    if (!viewport || !canvas) return;

    const applyTransform = () => {
        canvas.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        updateConduits();
    };

    viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.glass-card-white')) return; 
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    });

    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('resize', updateConduits);
}

function updateConduits() {
    const svg = document.getElementById('conduit-svg');
    if (!svg) return;
    svg.innerHTML = ''; 

    const connections = [
        { from: 'port-PM-out', to: 'port-COS-in' },
        { from: 'port-PM-out', to: 'port-COF-in' }
    ];

    const svgRect = svg.getBoundingClientRect();

    connections.forEach(conn => {
        const fromElem = document.getElementById(conn.from);
        const toElem = document.getElementById(conn.to);
        if (!fromElem || !toElem) return;

        const fromRect = fromElem.getBoundingClientRect();
        const toRect = toElem.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
        const x2 = toRect.left + toRect.width / 2 - svgRect.left;
        const y2 = toRect.top + toRect.height / 2 - svgRect.top;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const cp1y = y1 + (y2 - y1) / 2;
        const cp2y = y1 + (y2 - y1) / 2;
        
        path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`);
        path.setAttribute("style", "fill:none; stroke:#14b8a6; stroke-width:2; opacity:0.4; pointer-events:none;");
        svg.appendChild(path);
    });
}
window.adjustZoom = (amount) => {
    scale = Math.min(Math.max(0.3, scale + amount), 2);
    const canvas = document.getElementById('hierarchy-canvas');
    if (canvas) {
        canvas.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        updateConduits();
    }
};

// --- ✨ AI ARCHITECT STATION ---
function initArchitectStation() {
    const input = document.getElementById('architect-input');
    const send = document.getElementById('architect-send');
    const history = document.getElementById('architect-chat-history');

    if (!input || !send || !history) return;

    const handleArchitect = async () => {
        const msg = input.value;
        if (!msg) return;
        input.value = '';

        history.innerHTML += `
            <div class="bg-brand-teal/10 p-8 rounded-[40px] rounded-tr-none border border-brand-teal/20 ml-auto max-w-[80%] fade-in">
                <p class="text-base text-white/90 leading-relaxed font-medium">${msg}</p>
                <span class="text-[9px] text-brand-teal mt-4 block font-black uppercase tracking-widest text-right">COMMANDER // ARCHITECT</span>
            </div>
        `;
        history.scrollTop = history.scrollHeight;

        try {
            const res = await fetch('/api/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: `[ARCHITECT MODE] ${msg}`, realAgent: true })
            });
            const data = await res.json();
            history.innerHTML += `
                <div class="bg-white/5 p-10 rounded-[48px] rounded-tl-none border border-white/10 max-w-[80%] fade-in mt-6">
                    <p class="text-lg text-white/90 leading-relaxed font-medium">${data.output || "Architectural analysis complete."}</p>
                    <span class="text-[10px] text-white/20 mt-6 block font-black uppercase tracking-[0.2em]">NEURAL CORE // ANTIGRAVITY</span>
                </div>
            `;
        } catch (e) {
            history.innerHTML += `<p class="text-red-500 text-xs italic mt-4">Architect disconnect.</p>`;
        }
        history.scrollTop = history.scrollHeight;
    };

    send.addEventListener('click', handleArchitect);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleArchitect(); });
}

// --- 🏛 SYSTEM DATA ---
async function initMissionControlData() {
    try {
        const [agentsRes, memoryRes] = await Promise.all([ fetch('/api/agents'), fetch('/api/memory') ]);
        const agents = await agentsRes.json();
        const memory = await memoryRes.json();
        renderMemory(memory);
    } catch (e) { console.error("Mission Control Sync Error:", e); }
}

function renderMemory(items) {
    const list = document.getElementById('memory-list');
    if (!list) return;
    list.innerHTML = items.map(item => `
        <div class="glass-card-white !p-8 border-white/5 !bg-white/5 flex flex-col gap-4 hover:border-brand-teal/30 transition-all cursor-pointer">
            <div class="flex justify-between items-start">
                <span class="text-[8px] font-black text-brand-teal uppercase tracking-widest">${item.category || 'GENERAL'}</span>
                <span class="text-[8px] text-white/20 font-mono">${item.date || 'RECENT'}</span>
            </div>
            <h3 class="text-sm font-bold text-white/80">${item.title || item.original || 'Memory Node'}</h3>
        </div>
    `).join('');
}
function initV4Toggles() {
    document.querySelectorAll('#cost-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#cost-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const costValue = document.getElementById('cost-value');
            const agentCostList = document.getElementById('agent-cost-list');
            if (btn.dataset.view === 'agent') {
                if (costValue) costValue.style.display = 'none';
                if (agentCostList) { agentCostList.classList.remove('hidden'); agentCostList.classList.add('flex'); }
            } else {
                if (costValue) costValue.style.display = 'block';
                if (agentCostList) { agentCostList.classList.add('hidden'); agentCostList.classList.remove('flex'); }
            }
        });
    });
}
function openAgentDeepDive(name) { console.log("Deep dive for", name); }
window.openAgentDeepDive = openAgentDeepDive;
