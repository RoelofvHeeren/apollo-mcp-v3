document.addEventListener('DOMContentLoaded', () => {
    initV4Navigation();
    initV4Toggles();
    initV4GlobalBackdrop();
    initCommandStation();
    initMissionControlData();
    lucide.createIcons();
});

// --- 🧭 SPA NAVIGATION ---
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });
    // Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        // Find the item that calls this sectionId
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    // Specific Initialization
    if (sectionId === 'command') {
        initWebSocket();
    }
    
    lucide.createIcons();
}
window.showSection = showSection;

function initV4Navigation() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;

    toggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        updateToggleIcon(collapsed);
    });
}

function updateToggleIcon(collapsed) {
    const icon = document.getElementById('toggle-icon');
    if (!icon) return;
    icon.setAttribute('data-lucide', collapsed ? 'chevron-right' : 'chevron-left');
    lucide.createIcons();
}

// --- 🕹 UNIVERSAL TOGGLES ---
function initV4Toggles() {
    // API Cost Toggle
    document.querySelectorAll('#cost-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#cost-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const costValue = document.getElementById('cost-value');
            const agentCostList = document.getElementById('agent-cost-list');
            if (btn.dataset.view === 'agent') {
                if (costValue) costValue.style.display = 'none';
                if (agentCostList) agentCostList.classList.remove('hidden');
                if (agentCostList) agentCostList.classList.add('flex');
            } else {
                if (costValue) costValue.style.display = 'block';
                if (agentCostList) agentCostList.classList.add('hidden');
                if (agentCostList) agentCostList.classList.remove('flex');
            }
        });
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
    if (socket && socket.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/chat-relay`;
    
    console.log(`Connecting to Mission Control Relay: ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('Neural Link Established via Relay');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'chat.response' || data.text) {
            appendAgentMessage(data.text || data.params?.text || "Neural response captured.");
        }
    };

    socket.onclose = () => {
        console.log('Neural Link Severed. Retrying...');
        setTimeout(initWebSocket, 3000);
    };
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
                    termOutput.innerHTML += `<pre class="text-teal-400 mt-2 font-mono whitespace-pre-wrap opacity-60">${sanitized || 'Command executed with no output.'}</pre>`;
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
                socket.send(JSON.stringify({
                    method: 'chat.send',
                    params: { text: msg, agentId: agentId }
                }));
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
    const agentId = document.getElementById('agent-selector')?.value || 'pm';
    feed.innerHTML += `
        <div class="bg-white/5 p-6 rounded-[32px] rounded-tl-none border border-white/10 max-w-[90%] fade-in mt-4">
            <p class="text-sm text-white/80 leading-relaxed font-medium">${text}</p>
            <span class="text-[9px] text-white/20 mt-3 block font-bold uppercase tracking-widest">AGENT // ${agentId.toUpperCase()}</span>
        </div>
    `;
    feed.scrollTop = feed.scrollHeight;
}

// --- 🏛 SYSTEM DATA FETCHING ---
async function initMissionControlData() {
    try {
        const [agentsRes, memoryRes] = await Promise.all([
            fetch('/api/agents'),
            fetch('/api/memory')
        ]);
        const agents = await agentsRes.json();
        const memory = await memoryRes.json();

        renderMemory(memory);
    } catch (e) {
        console.error("Mission Control Sync Error:", e);
    }
}

function renderMemory(items) {
    const list = document.getElementById('memory-list');
    if (!list) return;
    list.innerHTML = items.map(item => `
        <div class="glass-card-white !p-8 border-white/5 !bg-white/5 flex flex-col gap-4 hover:border-brand-teal/30 transition-all cursor-pointer">
            <div class="flex justify-between items-start">
                <span class="text-[8px] font-black text-brand-teal uppercase tracking-widest">${item.category}</span>
                <span class="text-[8px] text-white/20 font-mono">${item.date}</span>
            </div>
            <h3 class="text-sm font-bold text-white/80">${item.title}</h3>
            <div class="mt-auto flex gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-brand-teal"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
            </div>
        </div>
    `).join('');
}
