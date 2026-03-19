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
        item.classList.add('text-slate-500');
        item.classList.remove('text-white');
        
        // Match by sectionId in the onclick string
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active-nav');
            item.classList.remove('text-slate-500');
            item.classList.add('text-white');
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
}

function updateStatusIndicator(status) {
    const statusText = document.querySelector('.text-brand-teal.mr-2');
    if (statusText) statusText.innerText = status;
}

// --- ⌨ COMMAND STATION LOGIC ---
function initCommandStation() {
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
        agentSend.onclick = handleSend;
        agentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    }
}

function appendUserMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-brand-teal/10 p-4 rounded-xl ml-auto max-w-[80%] text-right mb-4">
            <p class="text-xs text-white">${text}</p>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

function appendAgentMessage(text) {
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    feed.innerHTML += `
        <div class="bg-white/5 p-4 rounded-xl max-w-[80%] mb-4">
            <p class="text-xs text-slate-300">${text}</p>
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
            <div class="bg-brand-teal/10 p-4 rounded-xl ml-auto max-w-[80%] text-right mb-4">
                <p class="text-sm text-white">${msg}</p>
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
                <div class="bg-white/5 p-4 rounded-xl max-w-[80%] mb-4">
                    <p class="text-sm text-slate-300 font-medium">${data.output || "Analysis complete."}</p>
                </div>
            `;
        } catch (e) {}
        history.scrollTop = history.scrollHeight;
    };
    send.onclick = handleArchitect;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleArchitect(); };
}
