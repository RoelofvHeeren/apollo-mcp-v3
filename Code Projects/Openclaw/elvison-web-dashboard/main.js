document.addEventListener('DOMContentLoaded', () => {
    initSPA();
    initCommandStation();
    initArchitectStation();
    initHierarchyEngine();
    
    // Start with overview
    showSection('overview');
});

// --- 🧭 SPA NAVIGATION ---
function showSection(sectionId) {
    console.log(`Switching to section: ${sectionId}`);
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    if (sectionId === 'command') initWebSocket();
    if (sectionId === 'hierarchy') {
        setTimeout(updateConduits, 100);
    }
}
window.showSection = showSection;

function initSPA() {
    if (window.lucide) lucide.createIcons();

    // Sidebar Toggle Logic
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggle-icon');
    if (toggle && sidebar) {
        toggle.onclick = () => {
            sidebar.classList.toggle('collapsed');
            if (icon) {
                icon.setAttribute('data-lucide', sidebar.classList.contains('collapsed') ? 'chevron-right' : 'chevron-left');
                lucide.createIcons();
            }
            setTimeout(updateConduits, 500); // Re-draw conduits after sidebar transition
        };
    }
}

// --- 📡 REAL-TIME WEBSOCKET HUB ---
let socket = null;
function initWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chat-relay`;
    
    console.log(`[Neural Link] Connecting to ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log('[Neural Link] Online');

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

    socket.onclose = () => setTimeout(initWebSocket, 5000);
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
            if (!msg) return;
            agentInput.value = '';
            appendUserMessage(msg);
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ method: 'chat.send', params: { text: msg, agentId: document.getElementById('agent-selector')?.value || 'pm' } }));
            }
        };
        agentSend.onclick = handleSend;
        agentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    }
}

function appendUserMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-brand-teal/10 p-6 rounded-[32px] rounded-tr-none border border-brand-teal/20 ml-auto max-w-[90%] fade-in mt-4">
            <p class="text-sm text-slate-800 leading-relaxed font-bold text-right">${text}</p>
            <span class="text-[9px] text-brand-teal mt-3 block font-black uppercase tracking-widest text-right">COMMANDER // HUB</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

function appendAgentMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-white p-6 rounded-[32px] rounded-tl-none border border-slate-200 shadow-sm max-w-[90%] fade-in mt-4">
            <p class="text-sm text-slate-600 leading-relaxed font-medium text-left">${text}</p>
            <span class="text-[9px] text-slate-300 mt-3 block font-bold uppercase tracking-widest text-left">AGENT // PM</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

function maximizePane(paneId) {
    const agentPane = document.getElementById('pane-agent');
    const vpsPane = document.getElementById('pane-vps');
    if (!agentPane || !vpsPane) return;

    if (paneId === 'agent') {
        agentPane.classList.toggle('maximized');
        vpsPane.classList.toggle('minimized');
    } else {
        vpsPane.classList.toggle('maximized');
        agentPane.classList.toggle('minimized');
    }
    setTimeout(updateConduits, 600);
}
window.maximizePane = maximizePane;

// --- 🏷 HIERARCHY ENGINE ---
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

    viewport.onmousedown = (e) => {
        if (e.target.closest('.glass-card-white')) return; 
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        applyTransform();
    };

    window.onmouseup = () => isDragging = false;
    window.onresize = updateConduits;
}

function updateConduits() {
    const svg = document.getElementById('conduit-svg');
    if (!svg || document.getElementById('section-hierarchy').classList.contains('hidden')) return;
    svg.innerHTML = ''; 

    const connections = [
        { from: 'port-PM-out', to: 'port-COS-in' },
        { from: 'port-PM-out', to: 'port-COF-in' }
    ];

    connections.forEach(conn => {
        const fromElem = document.getElementById(conn.from);
        const toElem = document.getElementById(conn.to);
        if (!fromElem || !toElem) return;

        const fromRect = fromElem.getBoundingClientRect();
        const toRect = toElem.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
        const x2 = toRect.left + toRect.width / 2 - svgRect.left;
        const y2 = toRect.top + toRect.height / 2 - svgRect.top;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const cp1y = y1 + (y2 - y1) / 2;
        path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp1y}, ${x2} ${y2}`);
        path.setAttribute("class", "conduit");
        svg.appendChild(path);
    });
}

function adjustZoom(amount) {
    scale = Math.min(Math.max(0.3, scale + amount), 2);
    document.getElementById('hierarchy-canvas').style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
    updateConduits();
}
window.adjustZoom = adjustZoom;

// --- 🕵️ MODAL LOGIC ---
function openAgentDeepDive(agentName) {
    const modal = document.getElementById('modal-deep-dive');
    const nameElem = document.getElementById('modal-agent-name');
    const roleElem = document.getElementById('modal-agent-role');
    if (!modal || !nameElem) return;
    nameElem.innerHTML = `Agent <span class="font-normal text-white">${agentName}</span>`;
    roleElem.innerText = agentName === 'Project Manager' ? 'Master Orchestration Hub' : 'Strategic Support Node';
    modal.style.display = 'flex';
}
window.openAgentDeepDive = openAgentDeepDive;

function closeAgentDeepDive(e) { document.getElementById('modal-deep-dive').style.display = 'none'; }
window.closeAgentDeepDive = closeAgentDeepDive;

function closeModalDirect() { document.getElementById('modal-deep-dive').style.display = 'none'; }
window.closeModalDirect = closeModalDirect;

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
                <p class="text-base text-white/90 leading-relaxed font-medium text-right">${msg}</p>
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
                    <p class="text-lg text-white/90 leading-relaxed font-medium text-left">${data.output || "Architectural analysis complete."}</p>
                    <span class="text-[10px] text-white/20 mt-6 block font-black uppercase tracking-[0.2em] text-left">NEURAL CORE // ANTIGRAVITY</span>
                </div>
            `;
        } catch (e) {}
        history.scrollTop = history.scrollHeight;
    };
    send.onclick = handleArchitect;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleArchitect(); };
}
