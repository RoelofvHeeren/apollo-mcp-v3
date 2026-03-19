document.addEventListener('DOMContentLoaded', () => {
    initV4Navigation();
    initV4Toggles();
    initV4GlobalBackdrop();
    initCommandStation();
    initAiArchitectV4();
    lucide.createIcons();
});

// --- 🧭 NAVIGATION & SIDEBAR (Floating White) ---
function initV4Navigation() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggle) return;

    // Check for saved state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        updateToggleIcon(true);
    }

    toggle.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', collapsed);
        updateToggleIcon(collapsed);
    });
}

function updateToggleIcon(collapsed) {
    const icon = document.getElementById('toggle-icon');
    if (!icon) return;
    if (collapsed) {
        icon.setAttribute('data-lucide', 'chevron-right');
    } else {
        icon.setAttribute('data-lucide', 'chevron-left');
    }
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

    // Strategy Report Toggle
    const reportContent = document.getElementById('report-content');
    const reports = {
        system: `
            <p class="text-brand-teal text-[10px] font-black uppercase tracking-[0.4em] mb-6">Commander,</p>
            <p class="text-4xl font-light text-white leading-tight max-w-4xl">
                We've successfully deployed the latest neural node update. Currently, we're optimizing the memory pool for Agent Alpha and indexing the Memory Vault. All systems are nominal.
            </p>
        `,
        project: `
            <p class="text-brand-teal text-[10px] font-black uppercase tracking-[0.4em] mb-6">Commander,</p>
            <p class="text-4xl font-light text-white leading-tight max-w-4xl">
                Project <b class="text-brand-teal">Stardust</b> is performing at 92% velocity. Agent Claw-Builder has successfully initialized the deployment pipeline.
            </p>
        `,
        agent: `
            <p class="text-brand-teal text-[10px] font-black uppercase tracking-[0.4em] mb-6">Commander,</p>
            <p class="text-4xl font-light text-white leading-tight max-w-4xl">
                 <b class="text-brand-teal">Agent Nexus-01</b> has handled 48 strategic requests since the last cycle. Neural link stability is perfect.
            </p>
        `
    };
    document.querySelectorAll('#report-source-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
             document.querySelectorAll('#report-source-toggle .toggle-btn').forEach(b => {
                 b.classList.remove('active', 'text-brand-teal', 'border-b-2', 'border-brand-teal');
                 b.classList.add('text-white/30');
             });
             btn.classList.add('active', 'text-brand-teal', 'border-b-2', 'border-brand-teal');
             btn.classList.remove('text-white/30');
             if (reportContent) reportContent.innerHTML = reports[btn.dataset.src];
             lucide.createIcons();
        });
    });
}

// --- 🎥 THE VIDEO BACKDROP CONTROL (Robust) ---
function initV4GlobalBackdrop() {
    const video = document.getElementById('bg-video');
    if (!video) return;

    const startBackdrop = () => {
        video.play().catch(() => { /* handled */ });
    };

    video.play().catch(() => {
        document.addEventListener('click', startBackdrop, { once: true });
    });

    video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play();
    });
}

// --- 🖥 COMMAND PANE MAXIMIZER ---
function maximizePane(side) {
    const paneAgent = document.getElementById('pane-agent');
    const paneVps = document.getElementById('pane-vps');
    const divider = document.getElementById('divider');
    const header = document.getElementById('command-header');
    
    if (side === 'agent') {
        const isMax = paneAgent.classList.toggle('maximized');
        paneVps.classList.toggle('minimized', isMax);
        if (divider) divider.style.display = isMax ? 'none' : 'block';
        if (header) header.style.display = isMax ? 'none' : 'flex';
    } else {
        const isMax = paneVps.classList.toggle('maximized');
        paneAgent.classList.toggle('minimized', isMax);
        if (divider) divider.style.display = isMax ? 'none' : 'block';
        if (header) header.style.display = isMax ? 'none' : 'flex';
    }
    lucide.createIcons();
}
window.maximizePane = maximizePane;

// --- ⌨ COMMAND STATION LOGIC ---
function initCommandStation() {
    const vpsInput = document.querySelector('.pane-dark input');
    const termOutput = document.getElementById('terminal-output');
    
    if (vpsInput && termOutput) {
        vpsInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const cmd = vpsInput.value;
                if (!cmd) return;
                vpsInput.value = '';
                
                termOutput.innerHTML += `<div class="mt-4"><span class="text-teal-500 font-bold">root@vps-infra:~$</span> ${cmd}</div>`;
                termOutput.scrollTop = termOutput.scrollHeight;

                try {
                    const res = await fetch('/api/shell', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: cmd })
                    });
                    const data = await res.json();
                    
                    if (data.error) {
                        termOutput.innerHTML += `<div class="text-red-500 mt-2 font-mono">[ERROR] ${data.error}</div>`;
                    } else {
                        const sanitized = data.output.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        termOutput.innerHTML += `<pre class="text-teal-400 mt-2 font-mono whitespace-pre-wrap opacity-80">${sanitized}</pre>`;
                    }
                } catch (err) {
                    termOutput.innerHTML += `<div class="text-red-500 mt-2 font-mono">[CONNECTION LOST] Gateway unreachable.</div>`;
                }
                termOutput.scrollTop = termOutput.scrollHeight;
            }
        });
    }

    const agentChatInput = document.querySelector('.pane-light textarea');
    const sendBtn = document.querySelector('.pane-light button[data-lucide="send"]')?.parentElement;
    const chatFeed = document.querySelector('.pane-light .flex-grow');

    if (agentChatInput && sendBtn && chatFeed) {
        const handleSend = async () => {
            const msg = agentChatInput.value;
            if (!msg) return;
            agentChatInput.value = '';
            
            // Add User Message
            chatFeed.innerHTML += `
                <div class="bg-brand-teal/10 p-6 rounded-[32px] rounded-tr-none border border-brand-teal/20 shadow-sm ml-auto max-w-[90%] fade-in">
                    <p class="text-sm text-slate-800 leading-relaxed font-bold">${msg}</p>
                    <span class="text-[9px] text-brand-teal mt-3 block font-black uppercase tracking-widest text-right">COMMANDER // HUB</span>
                </div>
            `;
            chatFeed.scrollTop = chatFeed.scrollHeight;

            try {
                const res = await fetch('/api/prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        prompt: msg, 
                        agent: 'pm', 
                        realAgent: true // This triggers the local OpenClaw Gateway
                    })
                });
                const data = await res.json();
                
                // Add Agent Response
                chatFeed.innerHTML += `
                    <div class="bg-white p-6 rounded-[32px] rounded-tl-none border border-slate-200 shadow-sm max-w-[90%] fade-in mt-4">
                        <p class="text-sm text-slate-600 leading-relaxed font-medium">${data.response || data.output || "Neural link stable. Command indexed."}</p>
                        <span class="text-[9px] text-slate-300 mt-3 block font-bold uppercase tracking-widest">SYSTEM // NEXUS-01</span>
                    </div>
                `;
            } catch (e) {
                chatFeed.innerHTML += `
                    <div class="text-red-500 text-[10px] text-center mt-4 uppercase font-black tracking-widest">Gateway Disconnected</div>
                `;
            }
            chatFeed.scrollTop = chatFeed.scrollHeight;
        };

        sendBtn.addEventListener('click', handleSend);
        agentChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    }
}

// --- 🤖 AI ARCHITECT V4 ---
function initAiArchitectV4() {
    const aiIn = document.getElementById('ai-architect-input');
    const aiSend = document.getElementById('ai-architect-send');
    const aiHistory = document.getElementById('ai-architect-history');
    
    if (!aiIn || !aiHistory) return;

    const addMessage = (text, type) => {
        const msg = document.createElement('div');
        msg.className = type === 'user' 
            ? "bg-brand-teal/10 p-8 rounded-[40px] rounded-tr-none border border-brand-teal/20 ml-auto max-w-[80%] fade-in"
            : "bg-white/5 backdrop-blur-3xl p-8 rounded-[40px] rounded-tl-none border border-white/10 max-w-[80%] fade-in";
        
        msg.innerHTML = `
            <p class="text-base text-white leading-relaxed font-medium">${text}</p>
            <span class="text-[10px] ${type === 'user' ? 'text-brand-teal' : 'text-white/30'} mt-4 block font-black uppercase tracking-[0.2em] ${type === 'user' ? 'text-right' : ''}">
                ${type === 'user' ? 'COMMANDER // ARCHITECT' : 'NEURAL CORE // ANTIGRAVITY'}
            </span>
        `;
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();
            addMessage(data.response || "Neural link stable. Command received.", 'bot');
        } catch (e) {
            addMessage("Link Interrupted. Gateway unreachable.", 'bot');
        }
    };

    if (aiSend) aiSend.addEventListener('click', handleSend);
    aiIn.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
}
