document.addEventListener('DOMContentLoaded', () => {
    initSPA();
    initCommandStation();
    initArchitectStation();
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
        item.classList.remove('active-nav');
        // Match by sectionId in the onclick string
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active-nav');
        }
    });

    if (sectionId === 'command') initWebSocket();
}
window.showSection = showSection;

function initSPA() {
    // Initial icons
    if (window.lucide) lucide.createIcons();
}

// --- 📡 REAL-TIME WEBSOCKET HUB ---
let socket = null;
function initWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chat-relay`;
    
    console.log(`[Neural Link] Connecting to ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('[Neural Link] Online');
        updateStatusIndicator('NOMINAL');
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
        updateStatusIndicator('OFFLINE');
        setTimeout(initWebSocket, 5000);
    };

    socket.onerror = (err) => {
        console.error("[Neural Link] Connection Error", err);
    };
}

function updateStatusIndicator(status) {
    const statusText = document.querySelector('.text-brand-teal.mr-2');
    if (statusText) statusText.innerText = status;
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
                socket.send(JSON.stringify({ method: 'chat.send', params: { text: msg, agentId: 'pm' } }));
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
        <div class="bg-brand-teal/10 p-6 rounded-[32px] rounded-tr-none border border-brand-teal/20 shadow-sm ml-auto max-w-[90%] fade-in mt-4">
            <p class="text-sm text-white leading-relaxed font-bold text-right">${text}</p>
            <span class="text-[9px] text-brand-teal mt-3 block font-black uppercase tracking-widest text-right">COMMANDER // HUB</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

function appendAgentMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-white/5 p-6 rounded-[32px] rounded-tl-none border border-white/10 max-w-[90%] fade-in mt-4">
            <p class="text-sm text-white/80 leading-relaxed font-medium text-left">${text}</p>
            <span class="text-[9px] text-white/20 mt-3 block font-bold uppercase tracking-widest text-left">AGENT // PM</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

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
        } catch (e) {
            history.innerHTML += `<p class="text-red-500 text-xs italic mt-4">Architect disconnect.</p>`;
        }
        history.scrollTop = history.scrollHeight;
    };

    send.addEventListener('click', handleArchitect);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleArchitect(); });
}
