/**
 * ClaudeClaw Mission Control JS
 * Handles all 8 dashboard sections
 */
const API = '';

// ── STATE ────────────────────────────────────────────────────
let agents = [];
let tasks = { pending: [], active: [], done: [] };
let kbItems = [];
let advisors = [];
let logbookEntries = [];
let activeAgentChat = null;
let completedTotal = 0;
let selectedCmdAgent = 'pm';

const SECTION_META = {
  overview:   { title: 'Overview',             sub: 'System status at a glance' },
  command:    { title: 'Command Center',        sub: 'Instruct your AI workforce directly' },
  chain:      { title: 'Chain of Command',      sub: 'Hierarchy, delegation flow & agent conversations' },
  operations: { title: 'Operations',            sub: 'Task board — all agent work' },
  intel:      { title: 'Intelligence Report',   sub: 'Research missions & findings' },
  advisors:   { title: 'Advisors',              sub: 'Domain experts trained on your knowledge bases' },
  logbook:    { title: 'Logbook',               sub: 'Daily system reports & activity history' },
  kb:         { title: 'Knowledge Base',        sub: 'Centralised intelligence accessible to all agents' },
  ads:        { title: 'Meta Ads',              sub: 'Campaign management, research & analytics' },
  website:    { title: 'Website Builder',       sub: 'Clone sites, manage templates, edit with AI, research brands' },
};

// ── INIT ─────────────────────────────────────────────────────
async function init() {
  document.getElementById('log-date').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  await Promise.all([loadAgents(), loadIntelligence(), loadKB(), loadAdvisors(), loadLogbook(), loadAds()]);
  setupDropzone();
  setupCommandCenter();
  setupChainChat();
  setupResearchManager();
  setupOrchestrationSocket();
  connectResearchSSE();
  loadResearchTeams();
  loadReportLibrary();
  setInterval(loadIntelligence, 20000);
  setInterval(loadAds, 60000);
  loadOverviewMissions();
  setInterval(loadOverviewMissions, 15000);
  initOpsAgentGrid();
  loadOpsFromMissions();
  initCostTracker();
}

// ── NAV ──────────────────────────────────────────────────────
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const sec = document.getElementById(`sec-${id}`);
  if (sec) { sec.classList.add('active'); sec.classList.remove('fade-in'); void sec.offsetWidth; sec.classList.add('fade-in'); }
  if (el) el.classList.add('active');
  const meta = SECTION_META[id] || {};
  document.getElementById('stage-title').textContent = meta.title || id;
  document.getElementById('stage-sub').textContent = meta.sub || '';
  if (id === 'advisors') loadAdvisors();
  if (id === 'intel') loadReportLibrary();
}

function refreshAll() {
  loadAgents(); loadIntelligence(); loadKB(); loadAdvisors(); loadLogbook(); loadReportLibrary();
}

// ── AGENTS ───────────────────────────────────────────────────
const AGENT_DEF = [
  { id:'pm',                  name:'Project Manager',     icon:'clipboard-outline',    role:'CEO / Strategist',    color:'#3b82f6' },
  { id:'cos',                 name:'Chief of Staff',      icon:'briefcase-outline',    role:'COO / Operations',    color:'#8b5cf6' },
  { id:'cfo',                 name:'Chief of Finance',    icon:'cash-outline',         role:'CFO / Cost Optim.',   color:'#10b981' },
  { id:'researcher',          name:'Lead Researcher',     icon:'search-outline',       role:'Research Specialist', color:'#f59e0b' },
  { id:'website-builder',     name:'Website Builder',     icon:'code-slash-outline',   role:'Full-Stack Dev',      color:'#ef4444' },
  { id:'lead-finder',         name:'Lead Finder',         icon:'radio-outline',        role:'Lead Generation',     color:'#8b5cf6' },
  { id:'outreach-specialist', name:'Outreach Specialist', icon:'mail-outline',         role:'Sales Dev Rep',       color:'#06b6d4' },
];

// map advisor name/description → ion-icon
function emojiToIcon(emojiOrHint) {
  const n = (emojiOrHint || '').toLowerCase();
  if (n.includes('strategy') || n.includes('business')) return 'trophy-outline';
  if (n.includes('tech') || n.includes('architect') || n.includes('engineer')) return 'code-slash-outline';
  if (n.includes('market') || n.includes('growth') || n.includes('brand')) return 'trending-up-outline';
  if (n.includes('financ') || n.includes('invest') || n.includes('cost')) return 'cash-outline';
  if (n.includes('research') || n.includes('science')) return 'flask-outline';
  if (n.includes('claude') || n.includes('ai') || n.includes('brain')) return 'bulb-outline';
  if (n.includes('sales') || n.includes('outreach') || n.includes('lead')) return 'radio-outline';
  if (n.includes('globe') || n.includes('world')) return 'globe-outline';
  return 'school-outline';
}
function advisorIcon(a) { return emojiToIcon((a.description || '') + ' ' + (a.name || '')); }
function agentIconHtml(icon, color, size=16) {
  return `<ion-icon name="${icon}" style="color:${color};font-size:${size}px;"></ion-icon>`;
}

async function loadAgents() {
  try {
    const r = await fetch(`${API}/api/agents`);
    if (r.ok) agents = await r.json();
    else agents = AGENT_DEF;
  } catch { agents = AGENT_DEF; }
  renderOverviewAgents();
  renderCmdAgentSelector();
  renderAdvisorYTSelector();
}

function renderOverviewAgents() {
  const el = document.getElementById('ov-agents-list');
  if (!el) return;
  el.innerHTML = agents.map(a => {
    const def = AGENT_DEF.find(d => d.id === a.id) || {};
    const col = def.color || '#139187';
    const icon = a.icon || def.icon || 'hardware-chip-outline';
    return `<div class="agent-row" onclick="showSection('command',document.querySelector('.nav-item:nth-child(3)'));selectCmdAgent('${a.id}')">
      <div class="ag-avatar" style="background:${col}18;">${agentIconHtml(icon, col)}</div>
      <div class="ag-info">
        <div class="ag-name">${a.name}</div>
        <div class="ag-role">${a.role || ''}</div>
      </div>
      <span class="badge badge-ready">Ready</span>
    </div>`;
  }).join('');
  document.getElementById('ov-agents').textContent = agents.length || 7;
}

function renderCmdAgentSelector() {
  const el = document.getElementById('cmd-agent-selector');
  if (!el) return;
  el.innerHTML = agents.map(a => {
    const def = AGENT_DEF.find(d => d.id === a.id) || {};
    const icon = a.icon || def.icon || 'hardware-chip-outline';
    const col2 = def.color || 'var(--teal)';
    return `<div class="agent-chip ${a.id === selectedCmdAgent ? 'selected' : ''}" onclick="selectCmdAgent('${a.id}')" id="chip-${a.id}">
      <ion-icon name="${icon}" style="font-size:13px;"></ion-icon> ${a.name}
    </div>`;
  }).join('');
}

function selectCmdAgent(id) {
  selectedCmdAgent = id;
  document.querySelectorAll('.agent-chip').forEach(c => c.classList.remove('selected'));
  const chip = document.getElementById(`chip-${id}`);
  if (chip) chip.classList.add('selected');
  loadChatHistory(id);
}

function renderAdvisorYTSelector() {
  const el = document.getElementById('yt-advisor');
  if (!el || advisors.length === 0) return;
  el.innerHTML = advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// ── DAILY RESEARCH REPORT ─────────────────────────────────────
let researchSSE = null;

function connectResearchSSE() {
  if (researchSSE) return;
  researchSSE = new EventSource(`${API}/api/research/progress`);
  researchSSE.onmessage = (e) => {
    try { handleResearchEvent(JSON.parse(e.data)); } catch {}
  };
  researchSSE.onerror = () => {
    researchSSE.close(); researchSSE = null;
    setTimeout(connectResearchSSE, 5000);
  };
}

function handleResearchEvent(evt) {
  const { step, detail } = evt;
  const btn = document.getElementById('research-run-btn');
  const progressBox = document.getElementById('research-progress-box');
  const progressLog = document.getElementById('research-progress-log');
  const statusSub = document.getElementById('research-status-sub');

  if (step === '__running__' || step === '__start__') {
    progressBox.style.display = 'block';
    if (btn) { btn.disabled = true; btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Running...'; }
    if (step === '__start__') progressLog.innerHTML = '';
    return;
  }
  if (step === '__idle__') {
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Now'; }
    return;
  }
  if (step === '__done__') {
    progressBox.style.display = 'none';
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Now'; }
    if (statusSub) statusSub.textContent = `Last run: ${new Date().toLocaleTimeString()}`;
    loadReportLibrary();
    return;
  }
  if (step === '__error__') {
    addProgressLine(progressLog, `Error: ${detail}`, 'var(--red)');
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Now'; }
    return;
  }
  // Normal progress step
  addProgressLine(progressLog, step + (detail ? ` — ${detail}` : ''), 'var(--text-dim)');
}

function addProgressLine(container, text, color) {
  const line = document.createElement('div');
  line.style.cssText = `font-size:11px;color:${color};font-family:'JetBrains Mono',monospace;display:flex;gap:6px;align-items:baseline;`;
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  line.innerHTML = `<span style="color:var(--muted);flex-shrink:0;">${ts}</span><span>${text}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

async function triggerResearchRun() {
  const btn = document.getElementById('research-run-btn');
  if (btn) btn.disabled = true;
  connectResearchSSE();
  try {
    await fetch(`${API}/api/research/run`, { method: 'POST' });
  } catch (e) {
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Now'; }
  }
}

let _cachedReports = null;

async function loadReportLibrary() {
  const listEl = document.getElementById('report-library-list');
  const emptyState = document.getElementById('research-empty-state');
  if (!listEl) return;

  try {
    const r = await fetch(`${API}/api/research/all`);
    if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
    const reports = await r.json();
    console.log('[ReportLibrary] fetched', reports.length, 'reports');
    if (reports && reports.length > 0) {
      _cachedReports = reports; // cache so a later failure doesn't wipe the display
    }
  } catch (e) { console.warn('[ReportLibrary] fetch error:', e.message); }

  const reports = _cachedReports;
  if (!reports || reports.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  renderReportLibrary(listEl, reports, false);
}

function renderReportLibrary(listEl, reports, showAll) {
  const filtered = reports.filter(r => r.content && r.content.trim().length > 100);
  const visible = showAll ? filtered : filtered.slice(0, 5);
  let html = visible.map(buildReportCard).join('');
  if (!showAll && filtered.length > 5) {
    html += `<button onclick="showAllReports()" class="btn btn-ghost" style="width:100%;margin-top:8px;font-size:11px;padding:8px;">
      Show all ${filtered.length} reports
    </button>`;
  }
  listEl.innerHTML = html;
}

function showAllReports() {
  const listEl = document.getElementById('report-library-list');
  if (!listEl || !_cachedReports) return;
  renderReportLibrary(listEl, _cachedReports, true);
}

function buildReportCard(report, index) {
  const ts = report.created_at ? new Date(report.created_at).toLocaleString() : new Date().toLocaleString();
  const title = report.title || `Research Report ${ts.split(',')[0]}`;
  const typeLabel = report.type === 'meta_ads'
    ? '<span style="font-size:9px;font-weight:700;background:rgba(24,119,242,0.15);color:#1877f2;border-radius:6px;padding:2px 7px;letter-spacing:0.5px;">META ADS</span>'
    : '<span style="font-size:9px;font-weight:700;background:rgba(0,212,170,0.12);color:var(--teal);border-radius:6px;padding:2px 7px;letter-spacing:0.5px;">AI RESEARCH</span>';
  const html = (report.content || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*)/gm, '<div style="font-size:12px;font-weight:700;color:var(--teal);margin-top:14px;margin-bottom:4px;">$1</div>')
    .replace(/^## (.*)/gm, '<div style="font-size:13px;font-weight:700;color:var(--text);margin-top:16px;margin-bottom:6px;">$1</div>')
    .replace(/^# (.*)/gm, '<div style="font-size:14px;font-weight:700;color:var(--text);margin-top:16px;margin-bottom:8px;">$1</div>')
    .replace(/^- (.*)/gm, '<div style="font-size:11.5px;color:var(--text-dim);padding-left:12px;margin-bottom:3px;">• $1</div>')
    .replace(/\n/g, '<br>');
    
  const actionMatch = (report.content || '').match(/action items[\s\S]*?(?=\n---|\n##|$)/i);
  const section = actionMatch ? actionMatch[0] : (report.content || '');
  const tasks = [];
  section.split('\n').forEach(line => {
    const m = line.match(/^\d+\.\s+(.+)/);
    if (m && m[1].trim().length > 10) tasks.push(m[1].trim());
  });
  
  const hasTasks = tasks.length > 0;
  let taskHtml = '';
  if (hasTasks) {
    const checkboxes = tasks.map((t, i) => `
      <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:8px 10px;border-radius:10px;border:1px solid var(--border);background:var(--glass);transition:all 0.15s;" onmouseover="this.style.borderColor='var(--teal-border)'" onmouseout="this.style.borderColor='var(--border)'">
        <input type="checkbox" value="${t.replace(/"/g, '&quot;')}" style="margin-top:2px;accent-color:var(--teal);flex-shrink:0;">
        <span style="font-size:11.5px;color:var(--text-dim);line-height:1.5;">${t}</span>
      </label>
    `).join('');
    
    taskHtml = `
      <div class="implement-panel" style="border-top:1px solid var(--border);padding-top:14px;margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:11px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px;">
            <ion-icon name="construct-outline" style="color:var(--teal);"></ion-icon> Implement Recommendations
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost" onclick="selectAllTasks(this)" style="font-size:10px;padding:4px 10px;">Select All</button>
            <button class="btn btn-primary" onclick="implementSelected(this)" style="font-size:11px;padding:6px 14px;">
              <ion-icon name="flash-outline"></ion-icon> Implement Selected
            </button>
          </div>
        </div>
        <div class="task-checkboxes" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          ${checkboxes}
        </div>
        <div class="implement-progress-box" style="display:none;background:var(--glass);border:1px solid var(--teal-border);border-radius:12px;padding:12px;">
          <div style="font-size:10px;font-weight:700;color:var(--teal);letter-spacing:0.5px;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span class="status-dot"></span> CLAUDE IS IMPLEMENTING
          </div>
          <div class="implement-progress-log" style="display:flex;flex-direction:column;gap:3px;max-height:220px;overflow-y:auto;"></div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="expandable-card" onclick="toggleCard(this, event)">
      <div class="ec-header">
        <div>
          <div class="ec-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><ion-icon name="document-text-outline" style="color:var(--teal);font-size:16px;flex-shrink:0;"></ion-icon> ${title} ${typeLabel}</div>
          <div class="ec-meta" style="margin-top:4px;">${ts} &nbsp;·&nbsp; ${report.content ? (Math.round(report.content.length/102.4)/10).toFixed(1) + 'kb' : 'Empty'}</div>
        </div>
        <ion-icon name="chevron-down-outline" class="ec-icon"></ion-icon>
      </div>
      <div class="ec-body" onclick="event.stopPropagation()">
        <div style="font-size:12px;line-height:1.7;color:var(--text-dim);padding-bottom:16px;">${html}</div>
        ${taskHtml}
      </div>
    </div>
  `;
}

function toggleCard(cardEl, ev) {
  // if clicking inside the body, don't collapse
  if (ev.target.closest('.ec-body')) return;
  const isExpanded = cardEl.classList.contains('expanded');
  document.querySelectorAll('.expandable-card').forEach(c => c.classList.remove('expanded'));
  if (!isExpanded) cardEl.classList.add('expanded');
}

function selectAllTasks(btn) {
  const panel = btn.closest('.implement-panel');
  if(!panel) return;
  panel.querySelectorAll('.task-checkboxes input[type=checkbox]').forEach(cb => cb.checked = true);
}

let implementSSE = null;
let currentImplementBox = null;
let currentImplementLog = null;
let currentImplementBtn = null;

function connectImplementSSE() {
  if (implementSSE) return;
  implementSSE = new EventSource(`${API}/api/research/implement-progress`);
  implementSSE.onmessage = (e) => {
    try { handleImplementEvent(JSON.parse(e.data)); } catch {}
  };
  implementSSE.onerror = () => {
    implementSSE.close(); implementSSE = null;
    setTimeout(connectImplementSSE, 5000);
  };
}

function handleImplementEvent(evt) {
  const { step, detail } = evt;
  const btn = currentImplementBtn;
  const box = currentImplementBox;
  const log = currentImplementLog;

  if (step === '__running__' || step === '__start__') {
    if (box) box.style.display = 'block';
    if (log && step === '__start__') log.innerHTML = '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Working...'; }
    if (detail && log) addProgressLine(log, detail, 'var(--teal)');
    return;
  }
  if (step === '__idle__') {
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> Implement Selected'; }
    return;
  }
  if (step === '__done__') {
    if (box) box.style.display = 'block'; 
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> Implement Selected'; }
    if(log) addProgressLine(log, 'Done — ' + detail, 'var(--green)');
    return;
  }
  if (step === '__error__') {
    if(log) addProgressLine(log, 'Error: ' + detail, 'var(--red)');
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> Implement Selected'; }
    return;
  }
  if(!log) return;
  if (step === 'Claude') {
    addProgressLine(log, detail, 'var(--text-dim)');
  } else {
    addProgressLine(log, `${step}${detail ? ' — ' + detail : ''}`, 'var(--muted)');
  }
}

async function implementSelected(btn) {
  const panel = btn.closest('.implement-panel');
  if(!panel) return;
  const checked = [...panel.querySelectorAll('.task-checkboxes input[type=checkbox]:checked')];
  if (checked.length === 0) { alert('Select at least one recommendation.'); return; }
  const tasks = checked.map(cb => cb.value);

  currentImplementBtn = btn;
  currentImplementBox = panel.querySelector('.implement-progress-box');
  currentImplementLog = panel.querySelector('.implement-progress-log');
  
  if (currentImplementBox) { currentImplementBox.style.display = 'block'; }
  if (currentImplementLog) currentImplementLog.innerHTML = '';

  connectImplementSSE();

  try {
    await fetch(`${API}/api/research/implement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks })
    });
  } catch (e) {
    if (currentImplementLog) addProgressLine(currentImplementLog, 'Failed to start: ' + e.message, 'var(--red)');
  }
}

// ── INTELLIGENCE FEED ─────────────────────────────────────────
async function loadIntelligence() {
  try {
    const r = await fetch(`${API}/api/intelligence`);
    if (!r.ok) return;
    const data = await r.json();
    const logs = data.recent_logs || [];

    // Overview feed
    const ovFeed = document.getElementById('ov-feed');
    if (ovFeed) {
      if (logs.length === 0) {
        ovFeed.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="radio-outline"></ion-icon></div><div class="empty-icon-hidden"><div class="empty-sub">No activity yet. Deploy a mission to generate data.</div></div>`;
      } else {
        ovFeed.innerHTML = logs.slice(0, 6).map(log => buildIntelCard(log)).join('');
      }
    }

    // Intel section
    const intelFeed = document.getElementById('intel-reports');
    if (intelFeed) {
      if (logs.length === 0) {
        intelFeed.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="radio-outline"></ion-icon></div><div class="empty-icon-hidden"><div class="empty-sub">No intelligence data yet. Launch a research mission.</div></div>`;
      } else {
        intelFeed.innerHTML = logs.map(log => buildIntelCard(log)).join('');
      }
    }

    // Overview metrics
    const summary = data.summary || {};
    document.getElementById('ov-intel').textContent = summary.intelligence_reports || logs.filter(l => l.type === 'INTELLIGENCE').length || 0;
    document.getElementById('ov-intel-status').textContent = data.status === 'ACTIVE' ? 'Active' : 'Standby';
  } catch (e) {
    console.warn('Intel load failed:', e.message);
  }
}

function buildIntelCard(log) {
  const agentId = (log.agent || 'SYSTEM').toUpperCase();
  const iconMap = { PM:'clipboard-outline', COS:'briefcase-outline', CFO:'cash-outline', SCOUT:'telescope-outline', SYSTEM:'cog-outline', CLAUDE:'flash-outline', RESEARCHER:'search-outline' };
  const colorMap = { PM:'#3b82f6', COS:'#8b5cf6', CFO:'#10b981', SCOUT:'#f59e0b', SYSTEM:'#64748b', CLAUDE:'#14b8a6', RESEARCHER:'#f59e0b' };
  const agIcon = iconMap[agentId] || 'hardware-chip-outline';
  const color = colorMap[agentId] || '#14b8a6';
  const typeClass = `t-${(log.type || 'system').toLowerCase()}`;
  const statusClass = (log.status || 'ready').toLowerCase() === 'completed' ? 't-done' : `t-${(log.status||'system').toLowerCase()}`;
  const action = log.action || log.prompt || 'Activity recorded';
  const timeStr = log.timestamp ? fmtTime(log.timestamp) : 'just now';
  return `<div class="intel-card">
    <div class="intel-hd">
      <div class="intel-source" style="color:${color}">
        <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
        <ion-icon name="${agIcon}" style="font-size:12px;"></ion-icon> ${log.agent || 'SYSTEM'}
      </div>
      <span class="intel-type ${typeClass}">${(log.type||'SYSTEM').toUpperCase()}</span>
    </div>
    <div class="intel-text">${action}</div>
    <div class="intel-meta">
      <span class="badge ${statusClass}" style="font-size:9px;padding:2px 7px;">${(log.status||'READY').toUpperCase()}</span>
      <span class="intel-time">${timeStr}</span>
    </div>
  </div>`;
}

// ── CHAT PERSISTENCE ──────────────────────────────────────────
function _cmdStorageKey(agentId) {
  return `claudeclaw_cmd_${agentId}`;
}

function saveMsgToStorage(agentId, role, name, text) {
  try {
    const key = _cmdStorageKey(agentId);
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.push({ role, name, text, ts: Date.now() });
    if (history.length > 150) history.splice(0, history.length - 150);
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) { /* ignore storage errors */ }
}

function loadChatHistory(agentId) {
  const id = agentId || selectedCmdAgent;
  const msgs = document.getElementById('cmd-messages');
  if (!msgs) return;
  msgs.innerHTML = '';
  try {
    const history = JSON.parse(localStorage.getItem(_cmdStorageKey(id)) || '[]');
    if (history.length === 0) {
      msgs.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="chatbubbles-outline"></ion-icon></div><div class="empty-sub">Select an agent and type your command</div></div>`;
      return;
    }
    const agentDef = AGENT_DEF.find(a => a.id === id) || AGENT_DEF[0];
    history.forEach(m => {
      _appendChatMsgRaw(msgs, m.role, m.name, m.text, agentDef.icon || 'hardware-chip-outline', m.ts);
    });
    msgs.scrollTop = msgs.scrollHeight;
  } catch (e) {
    msgs.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="chatbubbles-outline"></ion-icon></div><div class="empty-sub">Select an agent and type your command</div></div>`;
  }
}

function clearChatHistory() {
  localStorage.removeItem(_cmdStorageKey(selectedCmdAgent));
  loadChatHistory(selectedCmdAgent);
}

// ── COMMAND CENTER ────────────────────────────────────────────
function setupCommandCenter() {
  const btn = document.getElementById('cmd-send');
  const inp = document.getElementById('cmd-input');
  if (btn) btn.addEventListener('click', sendCommand);
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCommand(); } });
  loadChatHistory(selectedCmdAgent);
}

async function sendCommand() {
  const inp = document.getElementById('cmd-input');
  const msgs = document.getElementById('cmd-messages');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  inp.value = '';

  const empty = msgs.querySelector('.empty');
  if (empty) empty.remove();

  appendChatMsg(msgs, 'user', 'You', text);
  saveMsgToStorage(selectedCmdAgent, 'user', 'You', text);

  const typing = document.createElement('div');
  typing.className = 'msg-agent fade-in';
  typing.innerHTML = `<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const agentDef = AGENT_DEF.find(a => a.id === selectedCmdAgent) || AGENT_DEF[0];

    // PM uses orchestration engine; all other agents use direct prompt
    if (selectedCmdAgent === 'pm') {
      const r = await fetch(`${API}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text })
      });
      const data = await r.json();
      typing.remove();

      appendChatMsg(msgs, 'agent', agentDef.name, data.pmResponse || 'Plan created.', '', agentDef.icon || 'hardware-chip-outline');
      saveMsgToStorage(selectedCmdAgent, 'agent', agentDef.name, data.pmResponse || '');

      if (data.plan) showApprovalCard(msgs, data.missionId, data.plan);

    } else {
      const r = await fetch(`${API}/api/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, agent: selectedCmdAgent, context: { dashboard: true } })
      });
      const data = await r.json();
      typing.remove();
      const responseText = data.choices?.[0]?.message?.content || 'No response.';
      appendChatMsg(msgs, 'agent', agentDef.name, responseText, '', agentDef.icon || 'hardware-chip-outline');
      saveMsgToStorage(selectedCmdAgent, 'agent', agentDef.name, responseText);
      parseTasksFromResponse(responseText, agentDef.name);
    }
  } catch (e) {
    typing.remove();
    const agentDef = AGENT_DEF.find(a => a.id === selectedCmdAgent) || AGENT_DEF[0];
    appendChatMsg(msgs, 'agent', agentDef.name, `Error: ${e.message}`, '', agentDef.icon || 'hardware-chip-outline');
  }
}

// ── LIVE FEED ──────────────────────────────────────────────────
function addLiveFeedEntry(type, text, agentId) {
  const feed = document.getElementById('live-feed-entries');
  if (!feed) return;
  const def = AGENT_DEF.find(a => a.id === agentId) || {};
  const colors = { tool: '#8b5cf6', cos: '#f59e0b', agent: def.color || 'var(--teal)', complete: 'var(--green)' };
  const icons  = { tool: 'terminal-outline', cos: 'briefcase-outline', agent: def.icon || 'hardware-chip-outline', complete: 'checkmark-circle-outline' };
  const color = colors[type] || 'var(--teal)';
  const icon  = icons[type] || 'flash-outline';
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.createElement('div');
  el.className = 'fade-in';
  el.style.cssText = 'display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);';
  el.innerHTML = `
    <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--muted);flex-shrink:0;padding-top:1px;">${ts}</span>
    <ion-icon name="${icon}" style="font-size:12px;color:${color};flex-shrink:0;margin-top:1px;"></ion-icon>
    <span style="font-size:11px;color:var(--text-dim);word-break:break-word;">${text}</span>`;
  feed.insertBefore(el, feed.firstChild);
  // Keep only last 60 entries
  while (feed.children.length > 60) feed.removeChild(feed.lastChild);
}

let _autoApprove = false;
function toggleAutoApprove(btn) {
  _autoApprove = !_autoApprove;
  btn.style.background = _autoApprove ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)';
  btn.style.color = _autoApprove ? 'var(--green)' : 'var(--muted)';
  btn.style.borderColor = _autoApprove ? 'rgba(16,185,129,0.4)' : 'var(--border)';
  btn.textContent = _autoApprove ? 'Auto-run ON' : 'Auto-run OFF';
}

function showApprovalCard(msgs, missionId, plan) {
  if (_autoApprove) { approveMissionSilent(missionId); return; }
  const card = document.createElement('div');
  card.className = 'fade-in';
  card.style.cssText = 'margin:10px 0;padding:16px;border-radius:14px;background:rgba(20,184,166,0.08);border:1px solid rgba(20,184,166,0.3);';
  card.innerHTML = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;margin-bottom:10px;font-family:Orbitron,monospace;">Mission Plan — Awaiting Approval</div>
    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px;">${plan.goal}</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
      ${(plan.phases||[]).map((p,i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;background:rgba(255,255,255,0.04);border:1px solid var(--border);">
          <div style="width:20px;height:20px;border-radius:50%;background:rgba(20,184,166,0.2);color:var(--teal);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;color:var(--text);">${p.name}</div>
            <div style="font-size:10.5px;color:var(--muted);">${p.agent}${p.depends_on?.length ? ' · after: ' + p.depends_on.join(', ') : ''} · ${p.description.slice(0,80)}</div>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="approveMission('${missionId}', this)" style="flex:1;padding:9px;border-radius:9px;background:linear-gradient(135deg,var(--teal),#0d9488);border:none;color:white;font-size:12px;font-weight:700;cursor:pointer;font-family:Rajdhani,sans-serif;letter-spacing:0.5px;">Approve & Execute</button>
      <button onclick="this.closest('.fade-in').remove()" style="padding:9px 14px;border-radius:9px;background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);font-size:12px;cursor:pointer;">Reject</button>
    </div>`;
  msgs.appendChild(card);
  msgs.scrollTop = msgs.scrollHeight;
}

async function approveMissionSilent(missionId) {
  try { await fetch(`${API}/api/orchestrate/${missionId}/approve`, { method: 'POST' }); } catch(e) {}
}

async function approveMission(missionId, btn) {
  btn.textContent = 'Executing...';
  btn.disabled = true;
  btn.closest('.fade-in').querySelector('button:last-child').disabled = true;
  await fetch(`${API}/api/orchestrate/${missionId}/approve`, { method: 'POST' });
}

// ── SOCKET.IO ORCHESTRATION EVENTS ────────────────────────────
// Single shared socket connection reused by both orchestration and cost tracker
let _sharedSocket = null;
function getSocket() {
  if (!_sharedSocket && typeof io !== 'undefined') {
    _sharedSocket = io(API);
  }
  return _sharedSocket;
}

// Add/update an entry in the Chain of Command task log
function addChainLogEntry(agentId, agentName, phase, status) {
  const log = document.getElementById('chain-task-log');
  if (!log) return;
  const empty = log.querySelector('.empty');
  if (empty) empty.remove();

  // If entry exists and we're marking done, update it in place
  const existing = document.getElementById(`chain-log-${agentId}`);
  if (existing && status === 'done') {
    existing.className = 'task-card done fade-in';
    const badge = existing.querySelector('.badge');
    if (badge) { badge.className = 'badge badge-done'; badge.textContent = 'Done'; }
    return;
  }

  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entry = document.createElement('div');
  const cardCls = status === 'working' ? 'active' : status === 'done' ? 'done' : 'pending';
  const badgeCls = status === 'working' ? 'badge-working' : status === 'done' ? 'badge-done' : 'badge-idle';
  const badgeLabel = status === 'working' ? 'Working' : status === 'done' ? 'Done' : 'Pending';
  entry.className = `task-card ${cardCls} fade-in`;
  entry.id = `chain-log-${agentId}`;
  entry.style.marginBottom = '8px';
  entry.innerHTML = `
    <div class="task-hd">
      <span class="task-name">${phase}</span>
      <span class="badge ${badgeCls}">${badgeLabel}</span>
    </div>
    <div class="task-agent">${agentName}</div>
    <div class="task-meta"><span class="task-time">${ts}</span></div>
  `;
  log.insertBefore(entry, log.firstChild);
}

function setupOrchestrationSocket() {
  if (typeof io === 'undefined') return;
  const socket = getSocket();

  socket.on('mission:start', ({ plan }) => {
    const msgs = document.getElementById('cmd-messages');
    const goal = plan?.goal || 'New Mission';
    const msg = `Mission approved: "${goal}". Running pre-mission intelligence check...`;
    appendChatMsg(msgs, 'agent', 'Chief of Staff', msg, '', 'briefcase-outline');
    saveMsgToStorage('pm', 'agent', 'Chief of Staff', msg);
    updateChainStatus('pm', 'done');
    updateChainStatus('cos', 'working');
    addChainLogEntry('cos', 'Chief of Staff', `Coordinating: ${goal}`, 'working');
    addKanbanTask('active', { id: 'ktask-cos', title: 'Mission Coordination', agent: 'Chief of Staff', icon: 'briefcase-outline', desc: goal, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
    loadOverviewMissions();
  });

  socket.on('mission:cos:status', ({ phase, message, from, to }) => {
    const msgs = document.getElementById('cmd-messages');
    let statusMsg = message || '';
    if (phase === 'handoff' && from && to) {
      const fromDef = AGENT_DEF.find(a => a.id === from) || { name: from };
      const toDef   = AGENT_DEF.find(a => a.id === to)   || { name: to };
      statusMsg = `Preparing handoff: ${fromDef.name} → ${toDef.name}...`;
    }
    if (statusMsg) {
      appendChatMsg(msgs, 'agent', 'Chief of Staff', `⟳ ${statusMsg}`, '', 'briefcase-outline');
      saveMsgToStorage('pm', 'agent', 'Chief of Staff', `⟳ ${statusMsg}`);
    }
  });

  socket.on('mission:cos', ({ message, phase }) => {
    const msgs = document.getElementById('cmd-messages');
    appendChatMsg(msgs, 'agent', 'Chief of Staff', message, '', 'briefcase-outline');
    saveMsgToStorage('pm', 'agent', 'Chief of Staff', message);
    if (phase === 'pre-mission') {
      addChainLogEntry('cos', 'Chief of Staff', 'Context Brief Ready', 'done');
    } else if (phase === 'closing') {
      updateChainStatus('cos', 'done');
      addChainLogEntry('cos-closing', 'Chief of Staff', 'Mission Summary', 'done');
    } else {
      updateChainStatus('cos', 'done');
      const cosCard = document.getElementById('ktask-ktask-cos');
      if (cosCard) cosCard.remove();
      addKanbanTask('done', { id: 'ktask-cos-done', title: 'Mission Coordination', agent: 'Chief of Staff', icon: 'briefcase-outline', desc: 'Handoff complete', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
      updateKanbanCounts();
    }
  });

  socket.on('mission:cos:handoff', ({ from, to, brief }) => {
    const msgs = document.getElementById('cmd-messages');
    const fromDef = AGENT_DEF.find(a => a.id === from) || { name: from };
    const toDef   = AGENT_DEF.find(a => a.id === to)   || { name: to };
    const msg = `**Handoff: ${fromDef.name} → ${toDef.name}**\n${brief}`;
    appendChatMsg(msgs, 'agent', 'Chief of Staff', msg, '', 'briefcase-outline');
    saveMsgToStorage('pm', 'agent', 'Chief of Staff', msg);
    addChainLogEntry(`handoff-${from}-${to}`, 'Chief of Staff', `Handoff → ${toDef.name}`, 'done');
  });

  socket.on('mission:task:start', ({ agentId, phase, description }) => {
    const msgs = document.getElementById('cmd-messages');
    const def = AGENT_DEF.find(a => a.id === agentId) || { name: agentId, icon: 'hardware-chip-outline' };
    const msg = `Starting: **${phase}** — ${description}`;
    appendChatMsg(msgs, 'agent', def.name, msg, '', def.icon || 'hardware-chip-outline');
    saveMsgToStorage('pm', 'agent', def.name, msg);
    updateChainStatus(agentId, 'working');
    addChainLogEntry(agentId, def.name, phase, 'working');
    addKanbanTask('active', { id: `ktask-${agentId}`, title: phase, agent: def.name, icon: def.icon || 'hardware-chip-outline', desc: description, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
    opsAgentWorking(agentId, phase, description);
    loadOverviewMissions();
  });

  socket.on('mission:task:done', ({ agentId, phase, result }) => {
    const msgs = document.getElementById('cmd-messages');
    const def = AGENT_DEF.find(a => a.id === agentId) || { name: agentId, icon: 'hardware-chip-outline' };
    appendChatMsg(msgs, 'agent', def.name, result, '', def.icon || 'hardware-chip-outline');
    saveMsgToStorage('pm', 'agent', def.name, result);
    updateChainStatus(agentId, 'done');
    addChainLogEntry(agentId, def.name, phase, 'done');
    const existingCard = document.getElementById(`ktask-ktask-${agentId}`);
    if (existingCard) existingCard.remove();
    addKanbanTask('done', { id: `ktask-${agentId}-done`, title: phase, agent: def.name, icon: def.icon || 'hardware-chip-outline', desc: 'Completed', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
    updateKanbanCounts();
    opsAgentDone(agentId, phase, result);
    loadOverviewMissions();
  });

  socket.on('mission:complete', ({ tasks, summary }) => {
    const msgs = document.getElementById('cmd-messages');
    const msg = `Mission complete — ${tasks.length} phase${tasks.length !== 1 ? 's' : ''} executed successfully.`;
    appendChatMsg(msgs, 'agent', 'Project Manager', msg, '', 'clipboard-outline');
    saveMsgToStorage('pm', 'agent', 'Project Manager', msg);
    updateChainStatus('pm', 'done');
    updateChainStatus('cos', 'idle');
    loadOverviewMissions();
    // Flash the live feed header green
    const feedHeader = document.getElementById('live-feed-header');
    if (feedHeader) { feedHeader.style.color = 'var(--green)'; setTimeout(() => { feedHeader.style.color = ''; }, 3000); }
  });

  // ── TOOL CALL VISIBILITY ──────────────────────────────────────
  socket.on('mission:tool:call', ({ agentId, phase, tool, args }) => {
    const msgs = document.getElementById('cmd-messages');
    const def = AGENT_DEF.find(a => a.id === agentId) || { name: agentId };
    const argStr = args ? Object.entries(args).map(([k,v]) => `${k}: "${String(v).slice(0,60)}"`).join(', ') : '';
    const bubble = document.createElement('div');
    bubble.className = 'fade-in';
    bubble.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin:4px 0;padding-left:12px;';
    bubble.innerHTML = `
      <div style="width:22px;height:22px;border-radius:6px;background:rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
        <ion-icon name="terminal-outline" style="font-size:11px;color:#8b5cf6;"></ion-icon>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#8b5cf6;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:8px;padding:5px 10px;max-width:85%;">
        <span style="opacity:0.6;">${def.name} ·</span> ${tool}(${argStr})
      </div>`;
    if (msgs) { msgs.appendChild(bubble); msgs.scrollTop = msgs.scrollHeight; }
    addLiveFeedEntry('tool', `${tool}(${argStr.slice(0,80)})`, agentId);
  });

  socket.on('mission:tool:result', ({ agentId, tool, result }) => {
    const msgs = document.getElementById('cmd-messages');
    const snippet = (result || '').slice(0, 120).replace(/\n/g, ' ');
    const bubble = document.createElement('div');
    bubble.className = 'fade-in';
    bubble.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin:2px 0 6px 0;padding-left:36px;';
    bubble.innerHTML = `
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:7px;padding:4px 10px;max-width:85%;opacity:0.8;">
        ↩ ${snippet}${result && result.length > 120 ? '…' : ''}
      </div>`;
    if (msgs) { msgs.appendChild(bubble); msgs.scrollTop = msgs.scrollHeight; }
  });

  // ── RATE LIMIT EVENTS ──────────────────────────────────────
  let _rlInterval = null;
  socket.on('system:rate_limited', ({ provider, retryAt, secsLeft }) => {
    const banner = document.getElementById('rl-banner');
    const provEl = document.getElementById('rl-provider');
    const countdown = document.getElementById('rl-countdown');
    if (!banner) return;
    banner.style.display = 'flex';
    if (provEl) provEl.textContent = `(${provider})`;
    addLiveFeedEntry('rate_limit', `Rate limited on ${provider} — auto-resuming in ${Math.ceil(secsLeft / 60)}m`, 'system');

    // Live countdown tick
    if (_rlInterval) clearInterval(_rlInterval);
    const tick = () => {
      const left = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      const m = String(Math.floor(left / 60)).padStart(2, '0');
      const s = String(left % 60).padStart(2, '0');
      if (countdown) countdown.textContent = `${m}:${s}`;
      if (left <= 0) { clearInterval(_rlInterval); _rlInterval = null; }
    };
    tick();
    _rlInterval = setInterval(tick, 1000);
  });

  socket.on('system:rate_limit_cleared', () => {
    const banner = document.getElementById('rl-banner');
    if (banner) banner.style.display = 'none';
    if (_rlInterval) { clearInterval(_rlInterval); _rlInterval = null; }
    addLiveFeedEntry('rate_limit', 'Rate limit cleared — system resuming', 'system');
  });
}

// Maps agent IDs to their badge element IDs in the Chain of Command tree
const AGENT_BADGE_MAP = {
  'pm': 'badge-pm',
  'cos': 'badge-cos',
  'researcher': 'badge-researcher',
  'website-builder': 'badge-builder',
  'lead-finder': 'badge-leadfinder',
  'outreach-specialist': 'badge-outreach',
  'cfo': 'badge-cfo'
};

const BADGE_CLASSES = {
  'ready':   'badge-ready',
  'working': 'badge-working',
  'done':    'badge-done',
  'idle':    'badge-idle'
};

function updateChainStatus(agentId, status) {
  const badgeId = AGENT_BADGE_MAP[agentId];
  if (!badgeId) return;
  const badge = document.getElementById(badgeId);
  if (!badge) return;

  // Remove all status classes
  Object.values(BADGE_CLASSES).forEach(cls => badge.classList.remove(cls));
  badge.classList.add(BADGE_CLASSES[status] || 'badge-idle');

  const labels = { ready: 'Ready', working: 'Working', done: 'Done', idle: 'Idle' };
  badge.textContent = labels[status] || status;

  // Also pulse the tree avatar when working
  const avatarId = `tree-${agentId === 'website-builder' ? 'builder' : agentId === 'lead-finder' ? 'leadfinder' : agentId === 'outreach-specialist' ? 'outreach' : agentId}`;
  const avatar = document.getElementById(avatarId);
  if (avatar) {
    avatar.style.boxShadow = status === 'working' ? '0 0 0 3px rgba(20,184,166,0.5)' : '';
  }
}

function parseTasksFromResponse(text, agentName) {
  // Extract numbered list items (1. Task, 2. Task) or bullet points (- Task, * Task)
  const lines = text.split('\n');
  const taskLines = lines.filter(l => /^(\d+[\.\)]\s+|[-*•]\s+)/.test(l.trim()));
  if (taskLines.length < 2) return; // only create tasks if there's a clear list

  taskLines.forEach(line => {
    const title = line.replace(/^(\d+[\.\)]\s+|[-*•]\s+)/, '').replace(/\*\*/g, '').trim();
    if (title.length < 5 || title.length > 120) return;
    addKanbanTask('pending', {
      id: `${Date.now()}-${Math.random()}`,
      title,
      agent: agentName,
      icon: 'hardware-chip-outline',
      desc: '',
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    });
  });
}

function _appendChatMsgRaw(container, type, name, text, ionIcon = null, ts = null) {
  const div = document.createElement('div');
  div.className = `msg-${type} fade-in`;
  const time = ts
    ? new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    : new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  if (type === 'agent') {
    const avatarContent = ionIcon ? `<ion-icon name="${ionIcon}" style="color:var(--teal);font-size:14px;"></ion-icon>` : '';
    div.innerHTML = `<div style="display:flex;gap:8px;align-items:flex-start;">
      <div style="width:28px;height:28px;border-radius:8px;background:rgba(20,184,166,0.15);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">${avatarContent}</div>
      <div><div class="msg-bubble">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div><div class="msg-meta">${name} · ${time}</div></div>
    </div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div><div class="msg-meta">${time}</div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendChatMsg(container, type, name, text, emoji = '', ionIcon = null) {
  const div = document.createElement('div');
  div.className = `msg-${type} fade-in`;
  const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  if (type === 'agent') {
    const avatarContent = ionIcon
      ? `<ion-icon name="${ionIcon}" style="color:var(--teal);font-size:14px;"></ion-icon>`
      : (emoji || '');
    div.innerHTML = `<div style="display:flex;gap:8px;align-items:flex-start;">
      <div style="width:28px;height:28px;border-radius:8px;background:rgba(20,184,166,0.15);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">${avatarContent}</div>
      <div><div class="msg-bubble">${text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</div><div class="msg-meta">${name} · ${time}</div></div>
    </div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div><div class="msg-meta">${time}</div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ── CHAIN OF COMMAND ──────────────────────────────────────────
function setupChainChat() {
  const btn = document.getElementById('chain-chat-send');
  const inp = document.getElementById('chain-chat-input');
  if (btn) btn.addEventListener('click', sendChainMsg);
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChainMsg(); } });
}

function openAgentChat(agentId) {
  activeAgentChat = agentId;
  const def = AGENT_DEF.find(a => a.id === agentId) || {};
  document.getElementById('chain-chat-title').textContent = `${def.name || agentId}`;
  document.querySelector('#sec-chain .sec-sub').textContent = `Direct line to ${def.name || agentId}`;
  const msgs = document.getElementById('chain-chat-msgs');
  const empty = msgs.querySelector('.empty');
  if (empty) {
    empty.remove();
    appendChatMsg(msgs, 'agent', def.name, `Connected. I'm ${def.name}, your ${def.role}. How can I help?`, def.emoji || '');
  }
}

async function sendChainMsg() {
  if (!activeAgentChat) return;
  const inp = document.getElementById('chain-chat-input');
  const msgs = document.getElementById('chain-chat-msgs');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  appendChatMsg(msgs, 'user', 'You', text);

  const typing = document.createElement('div');
  typing.className = 'msg-agent';
  typing.innerHTML = `<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const r = await fetch(`${API}/api/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: document.getElementById('ai-provider')?.value || 'claude-local', prompt: text, agent: activeAgentChat, context: { direct: true } })
    });
    const data = await r.json();
    typing.remove();
    const def = AGENT_DEF.find(a => a.id === activeAgentChat) || {};
    const resp = data.response || data.choices?.[0]?.message?.content || `Message received. Processing with ${def.name}...`;
    appendChatMsg(msgs, 'agent', def.name, resp, '', def.icon || 'hardware-chip-outline');
  } catch {
    typing.remove();
    const def = AGENT_DEF.find(a => a.id === activeAgentChat) || {};
    appendChatMsg(msgs, 'agent', def.name, 'Message queued for processing.', '', def.icon || 'hardware-chip-outline');
  }
}

// ── OPERATIONS ────────────────────────────────────────────────
function deployQuickMission() {
  showSection('command', document.querySelector('[onclick*="command"]'));
  document.getElementById('cmd-input').focus();
}

function updateOpsBoard(analysis) {
  if (!analysis) return;
  const assignments = analysis.assignments || {};
  Object.values(assignments).forEach(assignment => {
    (assignment.tasks || []).forEach(task => {
      addKanbanTask('pending', {
        id: `${Date.now()}-${Math.random()}`,
        title: task.title || task,
        agent: assignment.agent?.name || 'Unknown',
        icon: 'hardware-chip-outline',
        desc: task.description || '',
        time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
      });
    });
  });
}

function addKanbanTask(col, task) {
  const container = document.getElementById(`ops-${col}`);
  if (!container) return;

  // Remove empty state
  const empty = container.querySelector('.empty');
  if (empty) empty.remove();

  const card = document.createElement('div');
  card.className = `task-card ${col === 'active' ? 'active' : col === 'done' ? 'done' : 'pending'} fade-in`;
  card.id = `ktask-${task.id}`;
  card.innerHTML = `
    <div class="task-hd">
      <span class="task-name">${task.title}</span>
      <span class="badge badge-${col === 'active' ? 'working' : col === 'done' ? 'done' : 'idle'}">${col === 'active' ? 'In Progress' : col === 'done' ? 'Done' : 'Pending'}</span>
    </div>
    <div class="task-agent">${task.agent}</div>
    ${task.desc ? `<div class="task-desc">${task.desc}</div>` : ''}
    <div class="task-meta"><span class="task-time">${task.time || ''}</span></div>
  `;
  container.appendChild(card);
  updateKanbanCounts();
}

// ── COST TRACKER ───────────────────────────────────────────────
const AGENT_COLORS = {
  pm: '#60a5fa', cos: '#a78bfa', researcher: '#f59e0b',
  'website-builder': '#f87171', 'lead-finder': '#a78bfa',
  'outreach-specialist': '#22d3ee', cfo: '#34d399'
};

function initCostTracker() {
  loadCostBalance();
  setInterval(loadCostBalance, 60000); // refresh balance every minute
  // Wire socket for live updates — reuse shared socket, no second connection
  if (typeof io !== 'undefined') {
    getSocket().on('cost:update', renderCostUpdate);
  }
}

async function loadCostBalance() {
  try {
    const [liveRes, balRes] = await Promise.all([
      fetch(`${API}/api/costs/live`),
      fetch(`${API}/api/costs/balance`)
    ]);
    const live = await liveRes.json();
    const bal = await balRes.json();

    const sessionEl = document.getElementById('cost-session');
    if (sessionEl) sessionEl.textContent = `$${(live.session || 0).toFixed(4)}`;

    const balEl = document.getElementById('cost-balance');
    if (balEl) {
      const remaining = bal.remaining != null ? bal.remaining : (bal.limit ? bal.limit - bal.usage : null);
      balEl.textContent = remaining != null ? `$${remaining.toFixed(2)}` : '∞';
    }

    const labelEl = document.getElementById('cost-balance-label');
    if (labelEl && !bal.error) {
      const used = (bal.usage || 0).toFixed(4);
      labelEl.textContent = `${bal.label || 'OpenRouter'} · $${used} used this month`;
    }

    renderCostFeed(live.calls || []);
    renderCostByAgent(live.byAgent || {});
  } catch (e) { /* ignore */ }
}

function renderCostUpdate(data) {
  const sessionEl = document.getElementById('cost-session');
  if (sessionEl) sessionEl.textContent = `$${(data.session || 0).toFixed(4)}`;
  // Add the new call to the feed
  if (data.lastCall) prependCostFeedItem(data.lastCall, true);
  renderCostByAgent(data.byAgent || {});
}

function renderCostFeed(calls) {
  const feed = document.getElementById('cost-feed');
  if (!feed) return;
  if (!calls.length) {
    feed.innerHTML = '<div style="font-size:11px;color:var(--dim);padding:8px 0;">No calls yet this session</div>';
    return;
  }
  feed.innerHTML = '';
  [...calls].reverse().slice(0, 20).forEach(c => prependCostFeedItem(c, false));
}

function prependCostFeedItem(call, animate) {
  const feed = document.getElementById('cost-feed');
  if (!feed) return;
  const empty = feed.querySelector('div[style*="No calls"]');
  if (empty) empty.remove();
  const t = new Date(call.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const el = document.createElement('div');
  el.className = `cost-feed-item${animate ? ' new' : ''}`;
  const modelShort = (call.model || '').split('/').pop();
  const agentLabel = call.agentId || modelShort;
  const color = AGENT_COLORS[call.agentId] || 'var(--teal)';
  el.innerHTML = `
    <span style="color:${color};font-weight:700;min-width:110px;">${agentLabel}</span>
    <span style="color:var(--muted);flex:1;padding:0 8px;">${modelShort}</span>
    <span style="color:var(--text-dim);">${(call.inputTokens||0).toLocaleString()} in · ${(call.outputTokens||0).toLocaleString()} out</span>
    <span style="color:var(--teal);font-weight:700;min-width:70px;text-align:right;">$${(call.cost||0).toFixed(5)}</span>
    <span style="color:var(--dim);min-width:55px;text-align:right;">${t}</span>
  `;
  feed.insertBefore(el, feed.firstChild);
  // Keep max 20 items
  while (feed.children.length > 20) feed.removeChild(feed.lastChild);
}

function renderCostByAgent(byAgent) {
  const el = document.getElementById('cost-by-agent');
  if (!el || !Object.keys(byAgent).length) return;
  el.innerHTML = Object.entries(byAgent)
    .sort((a, b) => b[1] - a[1])
    .map(([agent, cost]) => {
      const color = AGENT_COLORS[agent] || 'var(--muted)';
      return `<span class="cost-agent-chip" style="border-color:${color}33;color:${color};">${agent} $${cost.toFixed(4)}</span>`;
    }).join('');
}

// ── OPERATIONS AGENT ACTIVITY ──────────────────────────────────
const agentTaskHistory = {}; // { agentId: [{ phase, result, status, time, missionGoal }] }
const agentCurrentTask = {}; // { agentId: { phase, description } | null }

const OPS_AGENTS = [
  { id: 'researcher',          name: 'Lead Researcher',      role: 'Research Spec.',     icon: 'search-outline',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'website-builder',     name: 'Website Builder',      role: 'Full-Stack Dev',     icon: 'code-slash-outline',    color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  { id: 'cos',                 name: 'Chief of Staff',       role: 'COO / Operations',   icon: 'briefcase-outline',     color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  { id: 'lead-finder',         name: 'Lead Finder',          role: 'Lead Generation',    icon: 'radio-outline',         color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
  { id: 'outreach-specialist', name: 'Outreach Specialist',  role: 'Sales Dev Rep',      icon: 'mail-outline',          color: '#22d3ee', bg: 'rgba(6,182,212,0.12)' },
  { id: 'cfo',                 name: 'Chief Finance Officer', role: 'Finance',            icon: 'cash-outline',          color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
];

function initOpsAgentGrid() {
  const grid = document.getElementById('ops-agent-grid');
  if (!grid) return;
  grid.innerHTML = OPS_AGENTS.map(a => `
    <div class="ops-agent-card idle" id="ops-card-${a.id}">
      <div class="ops-agent-hd">
        <div class="ops-agent-avatar" style="background:${a.bg};">
          <ion-icon name="${a.icon}" style="color:${a.color};font-size:18px;"></ion-icon>
        </div>
        <div style="flex:1;min-width:0;">
          <div class="ops-agent-name">${a.name}</div>
          <div class="ops-agent-role">${a.role}</div>
        </div>
        <span class="badge badge-idle" id="ops-badge-${a.id}">Idle</span>
      </div>
      <div class="ops-task-list" id="ops-tasks-${a.id}">
        <div class="ops-empty-agent">No tasks yet</div>
      </div>
    </div>
  `).join('');
}

function opsAgentWorking(agentId, phase, description) {
  agentCurrentTask[agentId] = { phase, description };
  const card = document.getElementById(`ops-card-${agentId}`);
  const badge = document.getElementById(`ops-badge-${agentId}`);
  const taskList = document.getElementById(`ops-tasks-${agentId}`);
  if (!card) return;
  card.classList.remove('idle', 'done');
  card.classList.add('working');
  if (badge) { badge.className = 'badge badge-working'; badge.textContent = 'Working'; }
  // Add live task indicator at top of list
  const existingLive = taskList.querySelector('.ops-task-item.active-item');
  if (existingLive) existingLive.remove();
  const empty = taskList.querySelector('.ops-empty-agent');
  if (empty) empty.remove();
  const liveEl = document.createElement('div');
  liveEl.className = 'ops-task-item active-item fade-in';
  liveEl.id = `ops-live-${agentId}`;
  liveEl.innerHTML = `
    <div class="ops-task-item-name">
      <span>${phase}</span>
      <span class="ops-live-indicator"><span class="ops-live-dot"></span>LIVE</span>
    </div>
    <div class="ops-task-item-meta">${description}</div>
  `;
  taskList.insertBefore(liveEl, taskList.firstChild);
}

function opsAgentDone(agentId, phase, result) {
  if (!agentTaskHistory[agentId]) agentTaskHistory[agentId] = [];
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  agentTaskHistory[agentId].unshift({ phase, result, ts });
  agentCurrentTask[agentId] = null;

  const card = document.getElementById(`ops-card-${agentId}`);
  const badge = document.getElementById(`ops-badge-${agentId}`);
  const taskList = document.getElementById(`ops-tasks-${agentId}`);
  if (!card) return;
  card.classList.remove('working', 'idle');
  card.classList.add('done');
  if (badge) { badge.className = 'badge badge-done'; badge.textContent = 'Done'; }

  // Replace live indicator with completed task item
  const liveEl = document.getElementById(`ops-live-${agentId}`);
  if (liveEl) liveEl.remove();

  const item = document.createElement('div');
  item.className = 'ops-task-item fade-in';
  item.onclick = () => showOpsDetail(agentId, phase, result);
  const preview = result.replace(/\n/g, ' ').slice(0, 80);
  item.innerHTML = `
    <div class="ops-task-item-name">
      <span>${phase}</span>
      <span style="font-size:10px;color:var(--green);font-weight:600;">✓ Done</span>
    </div>
    <div class="ops-task-item-meta">${preview}${result.length > 80 ? '…' : ''}</div>
    <div class="ops-task-item-meta" style="margin-top:3px;color:var(--dim);">${ts} · Click to view full output</div>
  `;
  const empty = taskList.querySelector('.ops-empty-agent');
  if (empty) empty.remove();
  taskList.insertBefore(item, taskList.firstChild);

  // After a delay reset card state to idle (keep history visible)
  setTimeout(() => {
    if (card.classList.contains('done')) {
      card.classList.remove('done');
      card.classList.add('idle');
      if (badge) { badge.className = 'badge badge-idle'; badge.textContent = 'Idle'; }
    }
  }, 5000);
}

function showOpsDetail(agentId, phase, result) {
  const agentDef = OPS_AGENTS.find(a => a.id === agentId) || { name: agentId, icon: 'hardware-chip-outline', color: 'var(--teal)' };
  const panel = document.getElementById('ops-detail-panel');
  document.getElementById('ops-detail-icon').name = agentDef.icon;
  document.getElementById('ops-detail-icon').style.color = agentDef.color;
  document.getElementById('ops-detail-title').textContent = phase;
  document.getElementById('ops-detail-sub').textContent = agentDef.name;
  // Render markdown-ish output
  const body = document.getElementById('ops-detail-body');
  body.innerHTML = result
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:13px;color:var(--text);display:block;margin:8px 0 4px;">$1</strong>')
    .replace(/\n/g, '<br>');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Load existing missions from API and populate agent history
async function loadOpsFromMissions() {
  try {
    const res = await fetch(`${API}/api/orchestrate`);
    const missions = await res.json();
    missions.forEach(m => {
      (m.tasks || []).forEach(t => {
        if (!agentTaskHistory[t.agentId]) agentTaskHistory[t.agentId] = [];
        // Only add if not already tracked
        const exists = agentTaskHistory[t.agentId].some(h => h.phase === t.phase && h.result === t.result);
        if (!exists) opsAgentDone(t.agentId, t.phase, t.result || '');
      });
    });
  } catch (e) { /* ignore */ }
}

// ── OVERVIEW MISSIONS PANEL ────────────────────────────────────
async function loadOverviewMissions() {
  try {
    const res = await fetch(`${API}/api/orchestrate`);
    const missions = await res.json();
    renderOverviewMissions(missions);
  } catch (e) { /* ignore */ }
}

function renderOverviewMissions(missions) {
  const container = document.getElementById('ov-missions');
  if (!container) return;

  const running = missions.filter(m => m.status === 'running');
  const recent = missions.filter(m => m.status === 'complete').slice(-3).reverse();
  const all = [...running, ...recent];

  if (all.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="git-network-outline"></ion-icon></div><div class="empty-sub">No active missions — start one in Command Center</div></div>`;
    document.getElementById('ov-active').textContent = 0;
    document.getElementById('ov-completed').textContent = missions.filter(m => m.status === 'complete').length;
    return;
  }

  document.getElementById('ov-active').textContent = running.length;
  document.getElementById('ov-completed').textContent = missions.filter(m => m.status === 'complete').length;

  container.innerHTML = all.map(m => {
    const phases = m.plan?.phases || [];
    const doneTasks = m.tasks || [];
    const doneIds = new Set(doneTasks.map(t => t.agentId));
    const statusLabel = m.status === 'running' ? 'Running' : 'Complete';
    const pills = phases.map(p => {
      const isDone = doneIds.has(p.agent);
      const isActive = m.status === 'running' && doneTasks.length === phases.indexOf(p);
      const cls = isDone ? 'done' : (isActive ? 'active' : '');
      const icon = isDone ? '✓' : (isActive ? '⟳' : '·');
      return `<span class="phase-pill ${cls}">${icon} ${p.name}</span>`;
    }).join('');

    const created = new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    return `
      <div class="mission-card ${m.status}" onclick="showSection('command',document.querySelector('.nav-item:nth-child(3)'))">
        <div class="mission-hd">
          <div class="mission-goal">${m.plan?.goal || m.command}</div>
          <span class="badge ${m.status === 'running' ? 'badge-working' : 'badge-done'}">${statusLabel}</span>
        </div>
        <div class="task-agent">${doneTasks.length}/${phases.length} phases · Started ${created}</div>
        ${pills ? `<div class="mission-phases">${pills}</div>` : ''}
      </div>`;
  }).join('');
}

function updateOverviewMission(missionId, patch) {
  // Called from socket events to update a specific mission card live
  loadOverviewMissions();
}

function updateKanbanCounts() {
  ['pending','active','done'].forEach(col => {
    const c = document.getElementById(`ops-${col}`);
    const count = document.getElementById(`ops-${col}-count`);
    if (c && count) {
      const n = c.querySelectorAll('.task-card').length;
      count.textContent = n;
    }
  });
}

function updateChainFromMission(analysis) {
  const log = document.getElementById('chain-task-log');
  if (!log) return;
  const empty = log.querySelector('.empty');
  if (empty) empty.remove();

  const ts = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const entry = document.createElement('div');
  entry.className = 'task-card active fade-in';
  entry.style.marginBottom = '8px';
  entry.innerHTML = `
    <div class="task-hd">
      <span class="task-name">Mission: ${(analysis.originalGoal || '').substring(0, 50)}...</span>
      <span class="badge badge-working">Delegating</span>
    </div>
    <div class="task-agent">PM → CoS → Specialists</div>
    <div class="task-meta"><span class="task-time">${ts}</span></div>
  `;
  log.insertBefore(entry, log.firstChild);
}

// ── INTELLIGENCE ──────────────────────────────────────────────
function launchResearch() {
  const topic = document.getElementById('intel-topic')?.value?.trim();
  const depth = document.querySelector('input[name="depth"]:checked')?.value || 'standard';
  const agent = document.getElementById('intel-agent')?.value || 'researcher';
  if (!topic) return;

  const activeEl = document.getElementById('intel-active');
  const empty = activeEl.querySelector('.empty');
  if (empty) empty.remove();

  const def = AGENT_DEF.find(a => a.id === agent) || AGENT_DEF[3];
  const card = document.createElement('div');
  card.className = 'task-card active fade-in';
  card.innerHTML = `
    <div class="task-hd">
      <span class="task-name">${topic.substring(0,60)}${topic.length>60?'...':''}</span>
      <span class="badge badge-working">Researching</span>
    </div>
    <div class="task-agent">Assigned to ${def.name} · Depth: ${depth}</div>
    <div class="task-meta"><span class="task-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
  `;
  activeEl.appendChild(card);

  // Send to API
  fetch(`${API}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: document.getElementById('ai-provider')?.value || 'claude-local', prompt: `Research task: ${topic}. Depth: ${depth}. Provide a comprehensive intelligence report.`, agent, context: { research: true, depth } })
  }).then(() => {
    card.className = 'task-card done fade-in';
    card.querySelector('.badge').className = 'badge badge-done';
    card.querySelector('.badge').textContent = 'Complete';
  }).catch(() => {});

  document.getElementById('intel-topic').value = '';
}

// ── ADVISORS ──────────────────────────────────────────────────
async function loadAdvisors() {
  try {
    const r = await fetch(`${API}/api/advisors`);
    if (r.ok) advisors = await r.json();
  } catch {
    advisors = [
      { id:'business', name:'Business Strategist', emoji:'', description:'Business strategy, growth, market analysis', videos:[], knowledge:[] },
      { id:'tech',     name:'Tech Architect',       emoji:'', description:'Software architecture, engineering best practices', videos:[], knowledge:[] },
      { id:'marketing',name:'Marketing Expert',     emoji:'', description:'Marketing, growth hacking, brand building', videos:[], knowledge:[] },
      { id:'finance',  name:'Financial Advisor',    emoji:'', description:'Finance, investment, cost optimization', videos:[], knowledge:[] },
    ];
  }
  renderAdvisors();
  renderAdvisorYTSelector();
}

function renderAdvisors() {
  const el = document.getElementById('advisor-grid');
  if (!el) return;
  if (advisors.length === 0) {
    el.innerHTML = `<div class="empty" style="grid-column:1/-1;"><div class="empty-icon"><ion-icon name="people-outline"></ion-icon></div><div class="empty-title">No advisors yet</div><div class="empty-sub">Create your first advisor to start building knowledge bases.</div></div>`;
    return;
  }
  el.innerHTML = advisors.map(a => `
    <div class="advisor-card">
      <div class="advisor-avatar-wrap"><ion-icon name="${advisorIcon(a)}" style="font-size:24px;color:var(--teal);"></ion-icon></div>
      <div class="advisor-name">${a.name}</div>
      <div class="advisor-desc">${a.description || ''}</div>
      <div class="advisor-stats">
        <div class="advisor-stat"><strong>${a.knowledgeCount || 0}</strong> KB items</div>
        <div class="advisor-stat" style="color:${a.status==='idle'?'var(--green)':'var(--amber)'};">${a.status || 'ready'}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn btn-primary" style="flex:1;font-size:12px;height:34px;justify-content:center;"
          onclick="openAdvisorChat('${a.id}')">
          <ion-icon name="chatbubble-ellipses-outline"></ion-icon> Chat
        </button>
        <button class="btn btn-ghost" style="font-size:12px;height:34px;padding:0 10px;"
          onclick="openKBView('${a.id}')">
          <ion-icon name="library-outline"></ion-icon>
        </button>
        <button class="btn btn-ghost" style="font-size:12px;height:34px;padding:0 10px;color:var(--red,#f87171);"
          onclick="deleteAdvisor('${a.id}','${a.name.replace(/'/g,"\\'")}')">
          <ion-icon name="trash-outline"></ion-icon>
        </button>
      </div>
    </div>
  `).join('');
}

async function deleteAdvisor(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const r = await fetch(`${API}/api/advisors/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    await loadAdvisors();
  } catch (e) {
    alert('Failed to delete advisor: ' + e.message);
  }
}

// ── ADVISOR CHAT ──────────────────────────────────────────────

function saveChatHistory(advisorId, role, content) {
  const key = `cc_chat_${advisorId}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.push({ role, content, ts: Date.now() });
  if (history.length > 100) history.splice(0, history.length - 100);
  localStorage.setItem(key, JSON.stringify(history));
}
function loadChatHistory(advisorId) {
  return JSON.parse(localStorage.getItem(`cc_chat_${advisorId}`) || '[]');
}
function clearChatHistory(advisorId) {
  localStorage.removeItem(`cc_chat_${advisorId}`);
}

let currentAdvisorId = null;
let currentChatSessionId = null;
let kbPanelVisible = false;

async function openAdvisorChat(id) {
  const adv = advisors.find(a => a.id === id);
  if (!adv) return;

  currentAdvisorId = id;
  currentChatSessionId = `${id}_default`;  // stable — same session every time
  kbPanelVisible = false;

  // Switch views
  document.getElementById('advisors-grid-view').style.display = 'none';
  document.getElementById('advisors-chat-view').style.display = 'block';
  document.getElementById('adv-kb-sidebar').style.display = 'none';

  // Set header
  document.getElementById('adv-chat-avatar').innerHTML = `<ion-icon name="${advisorIcon(adv)}" style="font-size:28px;color:var(--teal);"></ion-icon>`;
  document.getElementById('adv-chat-name').textContent = adv.name;
  document.getElementById('adv-chat-meta').textContent = `${adv.description || ''} · ${adv.knowledgeCount || 0} KB items`;

  // Restore history from localStorage, or show welcome if first time
  const msgs = document.getElementById('adv-chat-messages');
  msgs.innerHTML = '';
  const saved = loadChatHistory(id);
  if (saved.length > 0) {
    saved.forEach(m => appendAdvisorMsg(m.role, m.content, m.role === 'assistant' ? advisorIcon(adv) : null, false, true));
    msgs.scrollTop = msgs.scrollHeight;
  } else {
    appendAdvisorMsg('assistant', `Hello! I'm ${adv.name}. ${adv.description ? `I specialise in ${adv.description}.` : ''} How can I help you today?`, advisorIcon(adv), false, true);
  }

  document.getElementById('adv-chat-input').focus();
}

function backToAdvisors() {
  document.getElementById('advisors-chat-view').style.display = 'none';
  document.getElementById('advisors-grid-view').style.display = 'block';
  currentAdvisorId = null;
  currentChatSessionId = null;
}

async function sendAdvisorMsg() {
  const input = document.getElementById('adv-chat-input');
  const message = input.value.trim();
  if (!message || !currentAdvisorId) return;

  const adv = advisors.find(a => a.id === currentAdvisorId);
  input.value = '';
  input.style.height = '';

  appendAdvisorMsg('user', message, null);
  saveChatHistory(currentAdvisorId, 'user', message);

  // Show typing indicator
  const typingId = `typing_${Date.now()}`;
  const msgs = document.getElementById('adv-chat-messages');
  msgs.innerHTML += `<div id="${typingId}" class="adv-msg adv-msg-assistant" style="opacity:0.6;">
    <div class="adv-msg-avatar">${adv?.emoji || ''}</div>
    <div class="adv-msg-bubble"><div class="spinner" style="border-top-color:var(--teal);width:12px;height:12px;border-width:2px;"></div></div>
  </div>`;
  msgs.scrollTop = msgs.scrollHeight;

  const sendBtn = document.getElementById('adv-chat-send');
  sendBtn.disabled = true;

  try {
    const r = await fetch(`${API}/api/advisors/${currentAdvisorId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId: currentChatSessionId }),
      signal: AbortSignal.timeout(90000)
    });
    const data = await r.json();
    document.getElementById(typingId)?.remove();
    if (data.success) {
      appendAdvisorMsg('assistant', data.reply, adv ? advisorIcon(adv) : 'school-outline');
      saveChatHistory(currentAdvisorId, 'assistant', data.reply);
    } else {
      appendAdvisorMsg('assistant', `Sorry, something went wrong: ${data.error}`, adv ? advisorIcon(adv) : 'school-outline', true);
    }
  } catch (e) {
    document.getElementById(typingId)?.remove();
    appendAdvisorMsg('assistant', `Error: ${e.message}`, adv ? advisorIcon(adv) : 'school-outline', true);
  } finally {
    sendBtn.disabled = false;
    document.getElementById('adv-chat-input').focus();
  }
}

function appendAdvisorMsg(role, text, avatar, isError = false) {
  const msgs = document.getElementById('adv-chat-messages');
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.className = `adv-msg ${isUser ? 'adv-msg-user' : 'adv-msg-assistant'} fade-in`;
  const iconName = avatar || 'school-outline';
  div.innerHTML = isUser
    ? `<div class="adv-msg-bubble adv-bubble-user">${escHtml(text)}</div>`
    : `<div class="adv-msg-avatar"><ion-icon name="${iconName}" style="font-size:16px;color:var(--teal);"></ion-icon></div>
       <div class="adv-msg-bubble adv-bubble-assistant${isError ? ' adv-bubble-error' : ''}">${formatMarkdown(text)}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function formatMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px;font-size:0.9em;">$1</code>')
    .replace(/\n/g, '<br>');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function clearAdvisorChat() {
  if (!currentAdvisorId) return;
  await fetch(`${API}/api/advisors/${currentAdvisorId}/chat`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: currentChatSessionId })
  }).catch(() => {});
  clearChatHistory(currentAdvisorId);
  const adv = advisors.find(a => a.id === currentAdvisorId);
  const msgs = document.getElementById('adv-chat-messages');
  msgs.innerHTML = '';
  appendAdvisorMsg('assistant', `Chat cleared. How can I help you?`, adv ? advisorIcon(adv) : 'school-outline');
}

async function openKBPanel() {
  kbPanelVisible = !kbPanelVisible;
  const sidebar = document.getElementById('adv-kb-sidebar');
  sidebar.style.display = kbPanelVisible ? 'block' : 'none';
  if (!kbPanelVisible) return;

  const list = document.getElementById('adv-kb-sidebar-list');
  list.innerHTML = `<div style="color:var(--muted);font-size:12px;">Loading...</div>`;
  try {
    const r = await fetch(`${API}/api/advisors/${currentAdvisorId}/knowledge`);
    const items = await r.json();
    if (items.length === 0) {
      list.innerHTML = `<div style="color:var(--muted);font-size:12px;">No KB items yet.</div>`;
    } else {
      list.innerHTML = items.map(k => `
        <div class="kb-item" style="padding:8px 0;border-bottom:1px solid var(--border);">
          <div class="kb-title" style="font-size:12px;">${k.source_title || 'Untitled'}</div>
          <div class="kb-meta" style="font-size:10px;margin-top:2px;">${k.source_type} · ${(k.content||'').length.toLocaleString()} chars</div>
        </div>
      `).join('');
    }
  } catch {
    list.innerHTML = `<div style="color:var(--red);font-size:12px;">Failed to load KB.</div>`;
  }
}

async function openKBView(id) {
  await openAdvisorChat(id);
  // Open KB panel immediately
  kbPanelVisible = false;
  await openKBPanel();
}

// ── ADVISOR MODAL ──────────────────────────────────────────────
let selectedAdvisorEmoji = '';

function showNewAdvisor() {
  selectedAdvisorEmoji = '';
  document.getElementById('modal-adv-name').value = '';
  document.getElementById('modal-adv-desc').value = '';
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.toggle('selected', b.dataset.emoji === ''));
  document.getElementById('new-advisor-modal').style.display = 'flex';
  document.getElementById('modal-adv-name').focus();

  // Wire emoji picker (once)
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.onclick = () => {
      selectedAdvisorEmoji = btn.dataset.emoji;
      document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
  });
}

function closeAdvisorModal() {
  document.getElementById('new-advisor-modal').style.display = 'none';
}

async function submitNewAdvisor() {
  const name = document.getElementById('modal-adv-name').value.trim();
  const desc = document.getElementById('modal-adv-desc').value.trim();
  if (!name) { document.getElementById('modal-adv-name').focus(); return; }

  const btn = document.getElementById('modal-adv-submit');
  btn.disabled = true; btn.textContent = 'Creating...';

  try {
    const r = await fetch(`${API}/api/advisors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc, emoji: selectedAdvisorEmoji })
    });
    const data = await r.json();
    if (data.success) {
      closeAdvisorModal();
      await loadAdvisors();
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    alert('Failed to create advisor: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Create Advisor';
  }
}

async function addYouTubeVideo() {
  const urlEl = document.getElementById('yt-url');
  const url = urlEl?.value?.trim();
  const advisorId = document.getElementById('yt-advisor')?.value;
  if (!url || !advisorId) return;

  const btn = document.querySelector('[onclick="addYouTubeVideo()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Transcribing...'; }

  try {
    const r = await fetch(`${API}/api/advisors/${advisorId}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ youtubeUrl: url })
    });
    const data = await r.json();
    urlEl.value = '';
    if (data.success) {
      alert(`Transcript saved! Method: ${data.method}, ${data.chars} chars`);
    } else {
      alert(`Transcription failed: ${data.error}\nURL saved — paste transcript manually below.`);
    }
    loadAdvisors();
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Add Video'; }
  }
}

function addTranscriptKnowledge() {
  const text = document.getElementById('yt-transcript')?.value?.trim();
  const advisorId = document.getElementById('yt-advisor')?.value;
  if (!text || !advisorId) return;
  const knowledge = { title: `Transcript ${new Date().toLocaleDateString()}`, type: 'transcript', content: text, addedAt: new Date().toISOString() };
  fetch(`${API}/api/advisors/${advisorId}/knowledge`, {
    method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(knowledge)
  }).then(() => { document.getElementById('yt-transcript').value = ''; loadAdvisors(); });
}

// ── LOGBOOK ───────────────────────────────────────────────────
async function loadLogbook() {
  try {
    const r = await fetch(`${API}/api/logbook`);
    if (r.ok) logbookEntries = await r.json();
  } catch { logbookEntries = []; }
  renderLogbook();
}

function renderLogbook() {
  const el = document.getElementById('logbook-timeline');
  if (!el) return;
  if (logbookEntries.length === 0) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📔</div><div class="empty-sub">No log entries yet.</div></div>`;
    return;
  }
  const colors = { system:'var(--teal)', mission:'var(--amber)', intel:'var(--purple)', manual:'var(--muted)' };
  el.innerHTML = logbookEntries.slice(0,20).map(e => `
    <div class="log-entry">
      <div class="log-time">${e.timestamp ? fmtTime(e.timestamp) : ''}</div>
      <div class="log-dot" style="background:${colors[e.type||'manual']||'var(--muted)'};"></div>
      <div class="log-body">
        <div class="log-title">${e.title || 'Log Entry'}</div>
        <div class="log-detail">${e.content || e.detail || ''}</div>
      </div>
    </div>
  `).join('');
}

async function generateDailyLog() {
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const entry = {
    title: `Daily Report — ${today}`,
    type: 'system',
    content: `System operational. Agents: ${agents.length || 7} online. Intelligence feed: active. Knowledge base: ${kbItems.length} items indexed. All systems nominal.`,
    detail: `Auto-generated daily log for ${today}.`
  };
  await fetch(`${API}/api/logbook`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(entry) });
  document.getElementById('log-summary-text').textContent = entry.content;
  loadLogbook();
}

async function addLogEntry() {
  const text = document.getElementById('log-entry-input')?.value?.trim();
  if (!text) return;
  await fetch(`${API}/api/logbook`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ title:'Manual Entry', content:text, type:'manual' })
  });
  document.getElementById('log-entry-input').value = '';
  loadLogbook();
}

// ── KNOWLEDGE BASE ────────────────────────────────────────────
async function loadKB() {
  try {
    const r = await fetch(`${API}/api/knowledge-base`);
    if (r.ok) kbItems = await r.json();
  } catch { kbItems = []; }
  renderKB(kbItems);
}

function renderKB(items) {
  const el = document.getElementById('kb-list');
  const count = document.getElementById('kb-count');
  if (count) count.textContent = items.length;
  if (!el) return;
  if (items.length === 0) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🗄️</div><div class="empty-title">Empty Knowledge Base</div><div class="empty-sub">Add files, URLs, or text to get started</div></div>`;
    return;
  }
  const iconMap = { url:'🔗', file:'📁', text:'📄', repo:'', report:'' };
  el.innerHTML = items.map(item => `
    <div class="kb-item">
      <div class="kb-icon">${iconMap[item.type||'text']||'📄'}</div>
      <div class="kb-info">
        <div class="kb-title">${item.title || 'Untitled'}</div>
        <div class="kb-meta">${item.type || 'text'} · ${fmtTime(item.timestamp)}</div>
      </div>
      <button class="kb-del" onclick="deleteKBItem('${item.id}')">×</button>
    </div>
  `).join('');
}

function filterKB(q) {
  const filtered = kbItems.filter(i => (i.title||'').toLowerCase().includes(q.toLowerCase()) || (i.content||'').toLowerCase().includes(q.toLowerCase()));
  renderKB(filtered);
}

async function addKBText() {
  const title = document.getElementById('kb-title')?.value?.trim() || 'Untitled';
  const content = document.getElementById('kb-text')?.value?.trim();
  if (!content) return;
  await fetch(`${API}/api/knowledge-base`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ title, content, type:'text' })
  });
  document.getElementById('kb-title').value = '';
  document.getElementById('kb-text').value = '';
  loadKB();
}

async function addKBUrl() {
  const url = document.getElementById('kb-url')?.value?.trim();
  if (!url) return;
  const title = url.includes('github.com') ? `Repo: ${url.split('github.com/')[1] || url}` : `URL: ${url}`;
  await fetch(`${API}/api/knowledge-base`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ title, url, type: url.includes('github.com') ? 'repo' : 'url', content: url })
  });
  document.getElementById('kb-url').value = '';
  loadKB();
}

async function deleteKBItem(id) {
  await fetch(`${API}/api/knowledge-base/${id}`, { method:'DELETE' });
  loadKB();
}

function handleKBFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = async e => {
      const content = e.target.result;
      await fetch(`${API}/api/knowledge-base`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ title:file.name, content: typeof content === 'string' ? content.substring(0,5000) : '[binary file]', type:'file', filename:file.name })
      });
      loadKB();
    };
    if (file.name.match(/\.(txt|md|json)$/)) reader.readAsText(file);
    else { reader.readAsText(file); }
  });
}

function setupDropzone() {
  const dz = document.getElementById('kb-dropzone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); handleKBFiles(e.dataTransfer.files); });
}

// ── HELPERS ───────────────────────────────────────────────────
function fmtTime(ts) {
  try {
    const d = new Date(ts), now = new Date(), diff = Math.floor((now-d)/1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    return d.toLocaleDateString([],{month:'short',day:'numeric'});
  } catch { return ''; }
}

function getAgentEmoji(id) {
  const def = AGENT_DEF.find(a => a.id === id);
  return def ? def.emoji : '';
}

// ── RESEARCH MANAGER ──────────────────────────────────────────
let rmSessionId = `session_${Date.now()}`;
let rmPhase = 'discovery';

const RM_AGENT_ICONS = {
  google: { name: 'search-outline', label: 'Google', color: '#4285f4' },
  github: { name: 'logo-github',    label: 'GitHub', color: '#e8eaea' },
  reddit: { name: 'logo-reddit',    label: 'Reddit', color: '#ff4500' },
  instagram: { name: 'logo-instagram', label: 'Instagram', color: '#c13584' },
  linkedin: { name: 'logo-linkedin',   label: 'LinkedIn',  color: '#0077b5' },
};

function setupResearchManager() {
  const send = document.getElementById('rm-send');
  const inp = document.getElementById('rm-input');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendResearchMsg(); } });
}

async function sendResearchMsg() {
  const inp = document.getElementById('rm-input');
  const msgs = document.getElementById('rm-messages');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  inp.value = '';

  const empty = msgs.querySelector('.empty');
  if (empty) empty.remove();

  appendChatMsg(msgs, 'user', 'You', text);

  const typing = document.createElement('div');
  typing.className = 'msg-agent fade-in';
  typing.innerHTML = `<div style="display:flex;gap:8px;align-items:flex-start;"><div style="width:28px;height:28px;border-radius:8px;background:rgba(20,184,166,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><ion-icon name="search-outline" style="color:var(--teal);font-size:14px;"></ion-icon></div><div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div></div></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const r = await fetch(`${API}/api/research/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: document.getElementById('ai-provider')?.value || 'claude-local', message: text, sessionId: rmSessionId })
    });
    const data = await r.json();
    typing.remove();

    const response = data.response || 'No response';
    appendChatMsg(msgs, 'agent', 'Research Manager', response, null, 'search-outline');

    // Update phase
    if (data.phase && data.phase !== rmPhase) {
      rmPhase = data.phase;
      updateRMPhase(rmPhase);
    }

    // Show plan if confirmed
    if (data.planConfirmed) {
      showRMPlan(data.planConfirmed);
    }
  } catch (e) {
    typing.remove();
    appendChatMsg(msgs, 'agent', 'Research Manager', 'Connection error. Is the gateway running?', null, 'search-outline');
  }
}

function updateRMPhase(phase) {
  const phases = ['discovery', 'planning', 'execution'];
  const idx = phases.indexOf(phase);
  const labels = { discovery: 'Tell me what you want to research', planning: 'Reviewing research plan', execution: 'Dispatching research agents' };
  const badges = { discovery: 'Discovery', planning: 'Planning', execution: 'Active' };

  document.querySelectorAll('.rm-phase').forEach((el, i) => {
    el.classList.toggle('active', i <= idx);
  });

  const label = document.getElementById('rm-phase-label');
  const badge = document.getElementById('rm-phase-badge');
  if (label) label.textContent = labels[phase] || phase;
  if (badge) {
    badge.textContent = badges[phase] || phase;
    badge.className = `badge ${phase === 'execution' ? 'badge-working' : phase === 'planning' ? 'badge-done' : 'badge-ready'}`;
  }
}

function showRMPlan(plan) {
  const box = document.getElementById('rm-plan-box');
  const agentsEl = document.getElementById('rm-plan-agents');
  const detailsEl = document.getElementById('rm-plan-details');
  if (!box || !plan) return;

  const agentList = (plan.agents || []).map(a => {
    const info = RM_AGENT_ICONS[a] || { name: 'search-outline', label: a, color: '#14b8a6' };
    return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,0.06);border:1px solid var(--border);font-size:11px;font-weight:600;color:${info.color};">
      <ion-icon name="${info.name}" style="font-size:13px;"></ion-icon>${info.label}
    </span>`;
  }).join('');

  agentsEl.innerHTML = agentList;
  detailsEl.innerHTML = `Query: <strong style="color:var(--text);">${plan.query || ''}</strong> &nbsp;|&nbsp; Depth: ${plan.depth || 'standard'} &nbsp;|&nbsp; Schedule: ${plan.schedule || 'immediate'}`;
  box.style.display = 'block';
}

function resetResearch() {
  rmSessionId = `session_${Date.now()}`;
  rmPhase = 'discovery';
  updateRMPhase('discovery');
  const msgs = document.getElementById('rm-messages');
  if (msgs) msgs.innerHTML = `<div class="empty fade-in"><div class="empty-icon"><ion-icon name="telescope-outline" style="font-size:28px;color:var(--teal);"></ion-icon></div><div class="empty-title">Research Manager Ready</div><div class="empty-sub">Tell me what you want to research.</div></div>`;
  const planBox = document.getElementById('rm-plan-box');
  if (planBox) planBox.style.display = 'none';
}

// ── RESEARCH TEAMS ───────────────────────────────────────────
let mockResearchTeams = [
  {
    id: 'ai-research',
    name: 'AI Research Team',
    objective: 'Daily intelligence on AI coding tools, Claude/Anthropic updates, new frameworks, vibe coding trends, and skills to copy.',
    sources: 'Reddit (r/LocalLLaMA, r/ClaudeAI, r/MachineLearning, r/programming, r/ChatGPT, r/artificial), GitHub trending AI/LLM repos, YouTube × 11 channels (Fireship, Theo, Karpathy, Matt Williams, AI Code King, IndyDevDan, David Ondrej, Anthropic, AI Explained, Codeium, Jack)',
    schedule: 'Daily',
    scheduleDetail: 'Every day at 09:00 UTC+8 (01:00 UTC)',
    status: 'Active'
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads Research Team',
    objective: 'Weekly intelligence on Meta Ads best practices, platform updates, and UK fitness coaching competitor ad landscape via the Meta Ad Library.',
    sources: 'Meta Ad Library (UK, ACTIVE ads, 8 fitness keywords), Reddit (r/FacebookAds, r/PPC, r/marketing, r/EntrepreneurRideAlong), YouTube × 4 (Ben Heath, Charley T, AdLeaks, Nick Theriot)',
    schedule: 'Weekly',
    scheduleDetail: 'Every Monday at 10:00 UTC+8 (02:00 UTC)',
    status: 'Active'
  }
];

function loadResearchTeams() {
  renderResearchTeams();
}

function renderResearchTeams() {
  const grid = document.getElementById('research-teams-grid');
  if (!grid) return;
  if(mockResearchTeams.length === 0) {
    grid.innerHTML = `<div class="empty" style="padding:24px 12px;"><div class="empty-icon"><ion-icon name="people-outline"></ion-icon></div><div class="empty-sub">No research teams yet. Create one!</div></div>`;
    return;
  }
  grid.innerHTML = mockResearchTeams.map(t => {
    return `
      <div class="expandable-card" onclick="toggleCard(this, event)">
        <div class="ec-header">
          <div>
            <div class="ec-title"><ion-icon name="people-circle-outline" style="color:var(--teal);font-size:16px;"></ion-icon> ${t.name}</div>
            <div class="ec-meta" style="margin-top:4px;">
              <span style="color:var(--green);"><span class="status-dot" style="display:inline-block;margin-right:4px;width:6px;height:6px;background:var(--green);border-radius:50%;"></span>${t.status}</span> &nbsp;·&nbsp; ${t.scheduleDetail || t.schedule}
            </div>
          </div>
          <ion-icon name="chevron-down-outline" class="ec-icon"></ion-icon>
        </div>
        <div class="ec-body" onclick="event.stopPropagation()">
          <div class="team-grid">
            <div class="team-field">
              <div class="team-field-label">Objective</div>
              <div class="team-field-val">${t.objective}</div>
            </div>
            <div class="team-field">
              <div class="team-field-label">Sources</div>
              <div class="team-field-val"><ion-icon name="globe-outline" style="vertical-align:middle;margin-right:2px;"></ion-icon> ${t.sources}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function showNewTeamModal() {
  document.getElementById('modal-team-name').value = '';
  document.getElementById('modal-team-objective').value = '';
  document.getElementById('modal-team-instructions').value = '';
  document.getElementById('new-team-modal').style.display = 'flex';
}

function closeTeamModal() {
  document.getElementById('new-team-modal').style.display = 'none';
}

function submitNewTeam() {
  const name = document.getElementById('modal-team-name').value.trim();
  const obj = document.getElementById('modal-team-objective').value.trim();
  const inst = document.getElementById('modal-team-instructions').value.trim();
  const src = document.getElementById('modal-team-sources').value;
  const sched = document.getElementById('modal-team-schedule').value;
  
  if(!name) { document.getElementById('modal-team-name').focus(); return; }
  
  mockResearchTeams.push({
    id: `t_${Date.now()}`,
    name: name,
    objective: obj || inst || 'Automated Intelligence Gathering',
    sources: src,
    schedule: sched,
    status: 'Active'
  });
  
  closeTeamModal();
  renderResearchTeams();
}


// ── META ADS ─────────────────────────────────────────────────

async function loadAds() {
  await Promise.all([loadAdsCampaigns(), loadAdsKpi(), loadAdsActions(), loadAdsAnalytics(), loadAdsLibrary()]);
}

async function loadAdsKpi() {
  try {
    const r = await fetch(`${API}/api/meta-ads/kpi`);
    if (!r.ok) return;
    const d = await r.json();
    if (!d) return;
    document.getElementById('ads-kpi-spend').textContent = d.spend_gbp != null ? `£${parseFloat(d.spend_gbp).toFixed(2)}` : '£—';
    document.getElementById('ads-kpi-impressions').textContent = d.impressions ? Number(d.impressions).toLocaleString() : '—';
    document.getElementById('ads-kpi-ctr').textContent = d.ctr ? `${parseFloat(d.ctr).toFixed(2)}%` : '—';
    document.getElementById('ads-kpi-roas').textContent = d.roas ? `${parseFloat(d.roas).toFixed(2)}x` : '—';
  } catch {}
}

async function loadAdsCampaigns() {
  const el = document.getElementById('ads-campaign-list');
  const count = document.getElementById('ads-campaign-count');
  if (!el) return;

  // Show loading state
  el.innerHTML = `<div class="empty"><div class="empty-sub" style="color:var(--muted);">Loading from Meta...</div></div>`;

  try {
    const r = await fetch(`${API}/api/meta-ads/live`);
    if (!r.ok) throw new Error('Failed to load');
    const { campaigns = [], totals = {}, errors = [] } = await r.json();

    if (!campaigns.length) {
      const errMsg = errors.length ? errors[0] : 'No campaigns found.';
      const isRateLimit = errMsg.toLowerCase().includes('request limit') || errMsg.toLowerCase().includes('too many');
      el.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="${isRateLimit ? 'timer-outline' : 'megaphone-outline'}"></ion-icon></div><div class="empty-sub" style="color:${isRateLimit ? 'var(--amber)' : 'var(--muted)'}">${isRateLimit ? 'Meta API rate limited — wait a few minutes then refresh.' : errMsg}</div></div>`;
      if (count) count.textContent = isRateLimit ? 'Rate limited' : '0 campaigns';
      return;
    }

    const hasRateLimit = errors.some(e => e.toLowerCase().includes('request limit') || e.toLowerCase().includes('too many'));
    if (count) count.textContent = `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}${totals.adsets ? ` · ${totals.adsets} ad sets · ${totals.ads} ads` : hasRateLimit ? ' · rate limited — ad sets unavailable' : ''}`;

    const fmtK = n => n != null && n !== '' ? (parseFloat(n) >= 1000 ? `${(parseFloat(n)/1000).toFixed(1)}k` : parseFloat(n).toFixed(0)) : '—';
    const fmtGBP = n => n != null && n !== '' ? `£${parseFloat(n).toFixed(2)}` : '—';
    const fmtPct = n => n != null && n !== '' ? `${parseFloat(n).toFixed(2)}%` : '—';
    const actVal = (ins, type) => { const a = (ins.actions||[]).find(a=>a.action_type===type); return a ? a.value : null; };
    const costPer = (ins, type) => { const a = (ins.cost_per_action_type||[]).find(a=>a.action_type===type); return a ? a.value : null; };

    const metricsBar = (ins, objective) => {
      if (!ins) return '';
      let rows;
      if (objective === 'OUTCOME_TRAFFIC') {
        // TOF / IG Visits — profile visits = link_click, followers = like
        const profileVisits = actVal(ins, 'link_click');
        const costPerVisit  = costPer(ins, 'link_click');
        const followers     = actVal(ins, 'like');
        rows = [
          ['Spend',          fmtGBP(ins.spend),                          'var(--teal)'],
          ['Profile Visits', fmtK(profileVisits),                        'var(--text)'],
          ['Cost/Visit',     fmtGBP(costPerVisit),                       ''],
          ['Followers',      fmtK(followers),                            'var(--green)'],
          ['CPM',            fmtGBP(ins.cpm),                            ''],
          ['Frequency',      ins.frequency ? parseFloat(ins.frequency).toFixed(2) : '—', ''],
          ['CTR',            fmtPct(ins.ctr),                            parseFloat(ins.ctr||0)>1?'var(--green)':''],
        ];
      } else if (objective === 'OUTCOME_LEADS') {
        // Barn Gym — leads, cost per lead, link clicks, CPC
        const leads        = actVal(ins, 'lead') || actVal(ins, 'onsite_conversion.lead_grouped');
        const costPerLead  = costPer(ins, 'lead') || costPer(ins, 'onsite_conversion.lead_grouped');
        const linkClicks   = actVal(ins, 'link_click');
        rows = [
          ['Spend',          fmtGBP(ins.spend),                          'var(--teal)'],
          ['Leads',          fmtK(leads),                                'var(--green)'],
          ['Cost/Lead',      fmtGBP(costPerLead),                        leads>0?'var(--text)':'var(--red)'],
          ['Clicks',         fmtK(linkClicks),                           ''],
          ['CPC',            fmtGBP(costPer(ins,'link_click')||ins.cpc), ''],
          ['CPM',            fmtGBP(ins.cpm),                            ''],
          ['Frequency',      ins.frequency ? parseFloat(ins.frequency).toFixed(2) : '—', ''],
          ['CTR',            fmtPct(ins.ctr),                            parseFloat(ins.ctr||0)>1?'var(--green)':''],
        ];
      } else {
        // Generic fallback
        rows = [
          ['Spend',   fmtGBP(ins.spend),    'var(--teal)'],
          ['Impr.',   fmtK(ins.impressions), ''],
          ['Reach',   fmtK(ins.reach),       ''],
          ['CTR',     fmtPct(ins.ctr),       parseFloat(ins.ctr||0)>1?'var(--green)':''],
          ['CPM',     fmtGBP(ins.cpm),       ''],
          ['CPC',     fmtGBP(ins.cpc),       ''],
          ['Freq.',   ins.frequency ? parseFloat(ins.frequency).toFixed(2) : '—', ''],
        ];
      }
      return `<div style="display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;margin-top:8px;">${
        rows.map(([l,v,c],i) => `<div style="flex:1;padding:6px 8px;${i?'border-left:1px solid var(--border)':''}"><div style="font-size:9px;color:var(--muted);margin-bottom:2px;">${l}</div><div style="font-size:11px;font-weight:700;color:${c||'var(--text)'};">${v}</div></div>`).join('')
      }</div>`;
    };

    el.innerHTML = campaigns.map(c => {
      const isActive = c.effective_status === 'ACTIVE';
      const statusColor = isActive ? 'var(--green)' : 'var(--amber)';
      const budget = c.daily_budget_gbp ? `£${parseFloat(c.daily_budget_gbp).toFixed(2)}/day` : '—';
      const campAdsets = c.adsets || [];

      const adsetsHtml = campAdsets.map(s => {
        const sActive = s.effective_status === 'ACTIVE';
        const sColor = sActive ? 'var(--green)' : 'var(--amber)';
        const sBudget = s.daily_budget_gbp ? `£${parseFloat(s.daily_budget_gbp).toFixed(2)}/day` : '—';
        const setAds = s.ads || [];

        const creativeGrid = setAds.map(ad => {
          const adActive = ad.effective_status === 'ACTIVE';
          const adColor = adActive ? 'var(--green)' : 'var(--amber)';
          const cr = ad.creative || {};
          const thumb = cr.thumbnail_url || cr.image_url;
          const headline = cr.title || cr.name || '';
          const body = cr.body || '';
          const cta = cr.call_to_action_type || '';
          return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
            ${thumb ? `<img src="${thumb}" alt="" style="width:100%;height:90px;object-fit:cover;display:block;" onerror="this.style.display='none'">` : `<div style="width:100%;height:90px;background:var(--surface);display:flex;align-items:center;justify-content:center;"><ion-icon name="image-outline" style="font-size:24px;color:var(--border);"></ion-icon></div>`}
            <div style="padding:8px;">
              <div style="font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ad.name || 'Ad'}</div>
              ${headline ? `<div style="font-size:10px;color:var(--teal);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${headline}</div>` : ''}
              ${body ? `<div style="font-size:9px;color:var(--muted);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${body}</div>` : ''}
              <div style="margin-top:5px;display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:${adColor};display:inline-block;flex-shrink:0;"></span>
                <span style="font-size:9px;color:var(--muted);">${cta || ad.effective_status || ad.status}</span>
              </div>
            </div>
          </div>`;
        }).join('');

        return `<div style="margin-left:16px;margin-top:8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:7px;height:7px;border-radius:50%;background:${sColor};flex-shrink:0;display:inline-block;"></span>
              <span style="font-size:12px;font-weight:600;color:var(--text);">${s.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:10px;color:var(--muted);">${sBudget}</span>
              <span style="font-size:10px;color:var(--muted);">${s.optimization_goal ? s.optimization_goal.replace(/_/g,' ') : ''}</span>
              <span style="font-size:10px;color:var(--muted);">${setAds.length} ad${setAds.length !== 1 ? 's' : ''}</span>
              <span style="font-size:9px;font-weight:700;color:${sColor};letter-spacing:0.5px;">${s.effective_status || s.status}</span>
            </div>
          </div>
          ${metricsBar(s.insights, c.objective)}
          ${setAds.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px;">${creativeGrid}</div>` : ''}
        </div>`;
      }).join('');

      return `<div class="card" style="border-left:3px solid ${statusColor};padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:14px;font-weight:700;color:var(--text);">${c.name}</span>
          <span style="font-size:10px;font-weight:700;letter-spacing:0.8px;color:${statusColor};background:${statusColor}18;padding:2px 8px;border-radius:4px;">${c.effective_status || c.status}</span>
        </div>
        <div style="display:flex;gap:16px;font-size:11px;color:var(--muted);">
          <span>${(c.objective || '').replace(/_/g,' ')}</span>
          <span>Budget: ${budget}</span>
          <span>${campAdsets.length} ad set${campAdsets.length !== 1 ? 's' : ''}</span>
        </div>
        ${metricsBar(c.insights, c.objective)}
        ${campAdsets.length ? `<div style="margin-top:4px;">${adsetsHtml}</div>` : ''}
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = `<div class="empty"><div class="empty-sub" style="color:var(--red);">Failed to load: ${e.message}</div></div>`;
    console.error('loadAdsCampaigns', e);
  }
}

async function loadAdsActions() {
  try {
    const r = await fetch(`${API}/api/meta-ads/actions`);
    const actions = r.ok ? await r.json() : [];
    const el = document.getElementById('ads-actions-list');
    const badge = document.getElementById('ads-pending-badge');
    if (!el) return;
    if (badge) { badge.textContent = actions.length; badge.style.display = actions.length ? 'inline-flex' : 'none'; }
    if (!actions.length) {
      el.innerHTML = `<div class="card" style="text-align:center;padding:20px;"><div style="color:var(--muted);font-size:12px;">No pending actions. Run /meta analytics to generate recommendations.</div></div>`;
      return;
    }
    el.innerHTML = actions.map(a => {
      const typeColor = { pause:'var(--red)', increase_budget:'var(--green)', decrease_budget:'var(--amber)', duplicate:'var(--teal)', expand_audience:'var(--purple)' }[a.action_type] || 'var(--muted)';
      return `<div class="task-card" style="border-left-color:${typeColor};margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;color:${typeColor};letter-spacing:0.5px;text-transform:uppercase;">${a.action_type.replace(/_/g,' ')}</span>
          <span style="font-size:10px;color:var(--muted);">${a.object_level}</span>
        </div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px;">${a.object_name || a.object_id}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">${a.reason}</div>
        ${a.recommended_value ? `<div style="font-size:11px;color:var(--teal);margin-bottom:8px;">Recommended: ${a.recommended_value}</div>` : ''}
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;height:auto;" onclick="applyAdsAction('${a.id}')">Apply</button>
          <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;height:auto;color:var(--muted);" onclick="dismissAdsAction('${a.id}')">Dismiss</button>
        </div>
      </div>`;
    }).join('');
  } catch {}
}

async function loadAdsAnalytics() {
  try {
    const r = await fetch(`${API}/api/meta-ads/analytics?level=campaign`);
    const snaps = r.ok ? await r.json() : [];
    const el = document.getElementById('ads-analytics-list');
    if (!el) return;
    if (!snaps.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="bar-chart-outline"></ion-icon></div><div class="empty-sub">No analytics snapshots yet. Run /meta analytics in Claude Code.</div></div>`;
      return;
    }
    // Group by object_name, show latest per campaign
    const seen = new Set();
    const unique = snaps.filter(s => { if (seen.has(s.object_id)) return false; seen.add(s.object_id); return true; });
    el.innerHTML = unique.slice(0, 8).map(s => {
      const roas = s.roas ? `${parseFloat(s.roas).toFixed(2)}x` : '—';
      const ctr = s.ctr ? `${parseFloat(s.ctr).toFixed(2)}%` : '—';
      const spend = s.spend_gbp ? `£${parseFloat(s.spend_gbp).toFixed(2)}` : '—';
      const date = new Date(s.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
      return `<div class="card" style="padding:14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">${s.object_name || s.object_id || 'Account'}</span>
          <span style="font-size:10px;color:var(--muted);">${date}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
          <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--teal);font-family:'JetBrains Mono',monospace;">${spend}</div><div style="font-size:9px;color:var(--muted);margin-top:2px;">SPEND</div></div>
          <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--text);font-family:'JetBrains Mono',monospace;">${ctr}</div><div style="font-size:9px;color:var(--muted);margin-top:2px;">CTR</div></div>
          <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--text);font-family:'JetBrains Mono',monospace;">${s.cpm_gbp ? '£'+parseFloat(s.cpm_gbp).toFixed(2) : '—'}</div><div style="font-size:9px;color:var(--muted);margin-top:2px;">CPM</div></div>
          <div style="text-align:center;"><div style="font-size:14px;font-weight:700;color:${parseFloat(s.roas) >= 2 ? 'var(--green)' : 'var(--amber)'};font-family:'JetBrains Mono',monospace;">${roas}</div><div style="font-size:9px;color:var(--muted);margin-top:2px;">ROAS</div></div>
        </div>
      </div>`;
    }).join('');
  } catch {}
}

async function loadAdsLibrary() {
  try {
    const r = await fetch(`${API}/api/meta-ads/library`);
    const items = r.ok ? await r.json() : [];
    const el = document.getElementById('ads-library-list');
    if (!el) return;
    if (!items.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="search-outline"></ion-icon></div><div class="empty-sub">No research saved. Use /meta library in Claude Code.</div></div>`;
      return;
    }
    el.innerHTML = items.map(item => {
      const date = new Date(item.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' });
      return `<div class="card" style="padding:14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
          <div>
            <span style="font-size:13px;font-weight:600;color:var(--text);">${item.page_name || item.search_query}</span>
            ${item.page_name ? `<span style="font-size:10px;color:var(--muted);margin-left:8px;">${item.search_query}</span>` : ''}
          </div>
          <span style="font-size:10px;color:var(--muted);flex-shrink:0;">${date}</span>
        </div>
        <div style="display:flex;gap:12px;font-size:11px;color:var(--muted);margin-bottom:${item.summary ? '8px' : '0'};">
          <span>${item.ads_found} ads found</span>
          <span style="color:var(--green);">${item.active_ads} active</span>
          <span>${item.country}</span>
        </div>
        ${item.summary ? `<div style="font-size:11px;color:var(--text-dim);line-height:1.5;border-top:1px solid var(--border);padding-top:8px;">${item.summary}</div>` : ''}
      </div>`;
    }).join('');
  } catch {}
}

async function syncMetaAds() {
  const btn = document.getElementById('ads-sync-btn');
  const status = document.getElementById('ads-sync-status');
  if (btn) { btn.innerHTML = '<ion-icon name="sync-outline" style="font-size:13px;margin-right:5px;animation:spin 1s linear infinite;"></ion-icon>Syncing...'; btn.disabled = true; }
  if (status) status.textContent = '';
  try {
    const r = await fetch(`${API}/api/meta-ads/sync`, { method: 'POST' });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error || 'Sync failed');
    const s = result.synced || {};
    if (status) status.textContent = `✓ ${s.campaigns || 0} campaigns · ${s.adsets || 0} ad sets · ${s.ads || 0} ads${s.errors && s.errors.length ? ` · ${s.errors.length} errors` : ''}`;
    await loadAds();
  } catch(e) {
    if (status) status.textContent = `✗ ${e.message}`;
  }
  if (btn) { btn.innerHTML = '<ion-icon name="sync-outline" style="font-size:13px;margin-right:5px;"></ion-icon>Sync'; btn.disabled = false; }
}

async function applyAdsAction(id) {
  try {
    await fetch(`${API}/api/meta-ads/actions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'applied' })
    });
    await loadAdsActions();
  } catch {}
}

async function dismissAdsAction(id) {
  try {
    await fetch(`${API}/api/meta-ads/actions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'dismissed', dismissed_reason: 'Dismissed by user' })
    });
    await loadAdsActions();
  } catch {}
}

// ── WEBSITE BUILDER ───────────────────────────────────────────
let _lastResearchProfile = '';

function showWebTab(id, btn) {
  document.querySelectorAll('.web-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.web-tab').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`web-${id}`);
  if (panel) panel.style.display = 'flex';
  if (btn) btn.classList.add('active');
  if (id === 'templates') loadTemplates();
  if (id === 'editor' && !window._editorDraftFile) populateEditorFileSelect();
}

// ── COPIER ──────────────────────────────────────────────────
async function runCopier() {
  const url = document.getElementById('copier-url')?.value?.trim();
  const name = document.getElementById('copier-name')?.value?.trim();
  if (!url) return;

  const btn = document.getElementById('copier-btn');
  const progress = document.getElementById('copier-progress');
  const log = document.getElementById('copier-progress-log');
  const result = document.getElementById('copier-result');
  const previewWrap = document.getElementById('copier-preview-wrap');

  btn.disabled = true;
  btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Cloning...';
  result.style.display = 'none';
  previewWrap.style.display = 'none';
  progress.style.display = 'block';
  log.innerHTML = '';

  // Progress bar helpers
  const bar = document.getElementById('copier-bar');
  const pct = document.getElementById('copier-pct');
  let _pctValue = 0;
  let _crawlInterval = null;
  const setProgress = (val) => {
    _pctValue = Math.min(val, 99);
    if (bar) bar.style.width = _pctValue + '%';
    if (pct) pct.textContent = _pctValue + '%';
  };
  const startCrawl = (from, target, durationMs) => {
    clearInterval(_crawlInterval);
    const steps = 40;
    const stepMs = durationMs / steps;
    const inc = (target - from) / steps;
    let cur = from;
    _crawlInterval = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setProgress(Math.round(cur));
      if (cur >= target) clearInterval(_crawlInterval);
    }, stepMs);
  };
  const finishProgress = () => {
    clearInterval(_crawlInterval);
    setProgress(100);
  };

  setProgress(5);

  // Known steps → percentage milestones
  const STEP_MAP = {
    'Starting site crawl':   10,
    'Crawling':              15, // dynamic — bumps as pages found
    'Fetching page HTML':    20,
    'Processing page':       30, // dynamic — bumps per page
    'Creating ZIP':          92,
  };

  // Listen for socket progress
  const sock = getSocket();
  const cleanup = () => {
    clearInterval(_crawlInterval);
    sock.off('website:progress', onProgress);
    sock.off('website:done', onDone);
    sock.off('website:error', onError);
  };
  const onProgress = ({ step }) => {
    addProgressLine(log, step, 'var(--teal)');
    // Dynamic page-processing steps: extract "X/Y" to calculate real %
    const pageMatch = step.match(/Processing page (\d+)\/(\d+)/);
    if (pageMatch) {
      const cur = parseInt(pageMatch[1]), total = parseInt(pageMatch[2]);
      const target = 30 + Math.round((cur / total) * 58); // 30%→88%
      startCrawl(_pctValue, target, 800);
      return;
    }
    const mapEntry = Object.entries(STEP_MAP).find(([k]) => step.includes(k));
    if (mapEntry) startCrawl(_pctValue, mapEntry[1], 1200);
    else startCrawl(_pctValue, Math.min(_pctValue + 8, 90), 2000);
  };
  const onDone = ({ filename, folder, url: fileUrl, zipUrl, pages, summary }) => {
    cleanup();
    finishProgress();
    setTimeout(() => {
      window._lastCopiedFile = filename;
      document.getElementById('copier-summary').innerHTML =
        `<div style="margin-bottom:8px;">${summary}</div>` +
        (pages?.length > 1 ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">${pages.length} pages cloned: ${pages.join(', ')}</div>` : '') +
        (zipUrl ? `<a href="${zipUrl}" download style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--teal);text-decoration:none;"><ion-icon name="download-outline"></ion-icon> Download ZIP</a>` : '');
      document.getElementById('copier-open-btn').onclick = () => window.open(fileUrl, '_blank');
      result.style.display = 'block';
      document.getElementById('copier-iframe').src = fileUrl;
      previewWrap.style.display = 'block';
      progress.style.display = 'none';
      btn.disabled = false;
      btn.innerHTML = '<ion-icon name="copy-outline"></ion-icon> Clone Site';
      loadTemplates();
    }, 500);
  };
  const onError = ({ message }) => {
    cleanup();
    addProgressLine(log, `Error: ${message}`, 'var(--red)');
    if (bar) { bar.style.background = 'var(--red)'; }
    btn.disabled = false;
    btn.innerHTML = '<ion-icon name="copy-outline"></ion-icon> Clone Site';
  };
  sock.on('website:progress', onProgress);
  sock.on('website:done', onDone);
  sock.on('website:error', onError);

  // Slow crawl from 5→18% while request is in flight
  startCrawl(5, 18, 3000);
  addProgressLine(log, `Sending request for: ${url}`, 'var(--muted)');

  try {
    const r = await fetch(`${API}/api/website/copy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    // Job is running in background — all updates come via socket events
    // cleanup() will be called by onDone or onError when the job finishes
  } catch (e) {
    onError({ message: e.message });
  }
}

// ── TEMPLATES ───────────────────────────────────────────────
function _templateCard(f, actions) {
  const kb = (f.size / 1024).toFixed(1);
  const date = new Date(f.modified).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  const displayName = f.sourceTemplate || f.folder || f.name;
  const badge = f.isMultiPage
    ? `<span style="font-size:9px;font-weight:700;letter-spacing:0.5px;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);border-radius:4px;padding:1px 5px;">${f.pageCount} PAGES</span>`
    : '';
  const zipBtn = f.zipUrl
    ? `<a href="${f.zipUrl}" download class="btn btn-ghost" style="font-size:11px;padding:5px 8px;" title="Download ZIP"><ion-icon name="download-outline"></ion-icon></a>`
    : '';
  return `
    <div class="template-card">
      <div class="template-thumb">
        <iframe src="${f.url}" loading="lazy"></iframe>
      </div>
      <div class="template-info">
        <div class="template-name" style="display:flex;align-items:center;gap:5px;" title="${displayName}">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</span>${badge}
        </div>
        <div class="template-meta">${kb} KB · ${date}</div>
      </div>
      <div class="template-actions">
        ${actions(f, zipBtn)}
      </div>
    </div>`;
}

async function loadTemplates() {
  const grid = document.getElementById('template-grid');
  const finalGrid = document.getElementById('finalized-grid');
  const finalSection = document.getElementById('finalized-section');
  if (!grid) return;
  grid.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:20px;font-family:'JetBrains Mono',monospace;">Loading...</div>`;

  try {
    const r = await fetch(`${API}/api/website/files`);
    const files = await r.json();

    const templates = files.filter(f => f.type === 'template');
    const finalized = files.filter(f => f.type === 'finalized');

    if (!templates.length) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon"><ion-icon name="browsers-outline" style="font-size:28px;color:var(--muted);"></ion-icon></div><div class="empty-sub">No templates yet. Use the Copier to generate your first one.</div></div>`;
    } else {
      grid.innerHTML = templates.map(f => _templateCard(f, (f, zipBtn) => `
        <button class="btn btn-primary" style="flex:1;font-size:11px;padding:5px 10px;" onclick="createDraft('${f.name}')"><ion-icon name="create-outline"></ion-icon> Edit Copy</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px;" onclick="window.open('${f.url}','_blank')">Open</button>
        ${zipBtn}
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 8px;color:var(--red);" onclick="deleteTemplate('${f.name}',this)"><ion-icon name="trash-outline"></ion-icon></button>
      `)).join('');
    }

    if (finalSection) finalSection.style.display = finalized.length ? 'block' : 'none';
    if (finalGrid) {
      finalGrid.innerHTML = finalized.length ? finalized.map(f => _templateCard(f, (f, zipBtn) => `
        <button class="btn btn-ghost" style="flex:1;font-size:11px;padding:5px 10px;" onclick="window.open('${f.url}','_blank')">Open</button>
        ${zipBtn}
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 8px;color:var(--red);" onclick="deleteTemplate('${f.name}',this)"><ion-icon name="trash-outline"></ion-icon></button>
      `)).join('') : '';
    }
  } catch (e) {
    grid.innerHTML = `<div class="empty"><div class="empty-sub">Error loading templates: ${e.message}</div></div>`;
  }
}

async function createDraft(filename) {
  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating draft...'; }
  try {
    const r = await fetch(`${API}/api/website/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Failed to create draft');
    // Switch to editor with the draft loaded
    window._editorDraftFile = data.draftFile;
    window._editorSourceTemplate = data.sourceFolder;
    showWebTab('editor', document.getElementById('wtab-editor'));
    loadEditorFile(data.draftFile);
    // Update draft banner
    const banner = document.getElementById('editor-draft-banner');
    const bannerName = document.getElementById('editor-draft-name');
    if (banner) banner.style.display = 'flex';
    if (bannerName) bannerName.textContent = data.sourceFolder;
  } catch (e) {
    alert('Error: ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = '<ion-icon name="create-outline"></ion-icon> Edit Copy'; }
  }
}

async function finalizeEdit() {
  const draftFile = window._editorDraftFile;
  if (!draftFile) return alert('No active draft to finalize.');
  const btn = document.getElementById('editor-finalize-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Finalizing...'; }
  try {
    const r = await fetch(`${API}/api/website/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftFile })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Finalize failed');
    window._editorDraftFile = null;
    window._editorSourceTemplate = null;
    // Hide banner, clear editor
    const banner = document.getElementById('editor-draft-banner');
    if (banner) banner.style.display = 'none';
    const iframe = document.getElementById('editor-iframe');
    if (iframe) iframe.src = '';
    const sel = document.getElementById('editor-file-select');
    if (sel) sel.value = '';
    // Switch to templates and show finalized
    showWebTab('templates', document.getElementById('wtab-templates'));
    alert('Done! Your site has been moved to Finalized Websites.');
  } catch (e) {
    alert('Error: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Complete Edit'; }
  }
}

async function deleteTemplate(filename, btn) {
  if (!confirm(`Delete ${filename}?`)) return;
  btn.disabled = true;
  try {
    await fetch(`${API}/api/website/files/${encodeURIComponent(filename)}`, { method: 'DELETE' });
    loadTemplates();
  } catch (e) {
    btn.disabled = false;
    alert('Delete failed: ' + e.message);
  }
}

// ── EDITOR MODE SWITCHING ────────────────────────────────────────────────────
function switchEditorMode(mode, btn) {
  ['page','site','form'].forEach(m => {
    const el = document.getElementById(`editor-mode-${m}`);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('[id^="emode-tab-"]').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`editor-mode-${mode}`);
  if (panel) panel.style.display = 'flex';
  if (btn) btn.classList.add('active');
  window._editorMode = mode;
  if (mode === 'form') startJourney();
}

// ── WHOLE SITE EDIT ──────────────────────────────────────────────────────────
async function applySiteEdit() {
  const prompt = document.getElementById('site-edit-prompt')?.value?.trim();
  const draftFile = window._editorDraftFile;
  if (!prompt) return alert('Enter an instruction first.');
  if (!draftFile) return alert('No active draft. Go to Templates and click "Edit Copy" first.');

  const folder = draftFile.split('/')[0];
  const btn = document.getElementById('site-edit-btn');
  const log = document.getElementById('site-edit-log');

  btn.disabled = true;
  btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Applying to all pages...';
  log.style.display = 'block';
  log.innerHTML = '<div style="font-size:12px;color:var(--muted);">Processing...</div>';

  try {
    const r = await fetch(`${API}/api/website/edit-site`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, prompt })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Failed');
    log.innerHTML = (data.results || []).map(r =>
      `<div style="font-size:12px;padding:3px 0;color:${r.success ? 'var(--teal)' : 'var(--red)'};">
        <ion-icon name="${r.success ? 'checkmark-outline' : 'close-outline'}"></ion-icon> ${r.file}: ${r.success ? 'Updated' : r.error}
      </div>`
    ).join('');
    document.getElementById('site-edit-prompt').value = '';
    const iframe = document.getElementById('editor-iframe');
    if (iframe?.src) iframe.src = iframe.src.split('?')[0] + '?t=' + Date.now();
  } catch (e) {
    log.innerHTML = `<div style="color:var(--red);font-size:12px;">Error: ${e.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<ion-icon name="planet-outline"></ion-icon> Apply to All Pages';
  }
}

// ── JOURNEY ENGINE ───────────────────────────────────────────────────────────
const JOURNEY_STATIC = ['intro','basics','story','contact','tone'];

window._J = {
  steps: [...JOURNEY_STATIC],
  index: 0,
  direction: 1,
  tone: '',
  sections: [],
  sectionsLoaded: false,
  sectionsLoading: false
};

function startJourney() {
  if (!window._editorDraftFile) return; // silently — banner will show on next tab switch
  if (window._J._started && window._J.index > 0) { _jShow(window._J.index, window._J.direction); return; } // resume in-progress journey
  Object.assign(window._J, { steps: [...JOURNEY_STATIC], index: 0, _si: 0, _started: true, direction: 1, tone: '', sections: [], sectionsLoaded: false, sectionsLoading: false });
  _jShow(0);
}

function _jStepId() { return window._J.steps[window._J.index]; }

function _jProgress() {
  const total = window._J.steps.length;
  const cur = window._J.index;
  return { cur, total, pct: total > 1 ? (cur / (total - 1)) * 100 : 0 };
}

function _jShow(idx, dir = 1) {
  window._J.index = idx;
  window._J.direction = dir;
  const id = window._J.steps[idx];

  document.querySelectorAll('.journey-step').forEach(el => el.style.display = 'none');

  let el;
  if (id === 'section') {
    el = document.getElementById('jstep-section');
    if (el) { el.style.display = 'flex'; _jRenderSection(window._J.sections[window._J._si]); }
  } else {
    el = document.getElementById(`jstep-${id}`);
    if (el) el.style.display = ['intro','generating','preview'].includes(id) ? 'flex' : 'flex';
  }
  if (el) { el.classList.remove('journey-step'); void el.offsetWidth; el.classList.add('journey-step'); if (dir < 0) el.classList.add('back'); }

  _jUpdateHeader(id);
  _jUpdateNav(id);
}

function _jUpdateHeader(id) {
  const { cur, total, pct } = _jProgress();
  document.getElementById('journey-progress-bar').style.width = pct + '%';

  const labels = { intro:'Welcome', basics:'Step 1 · Business', story:'Step 2 · Your Story', contact:'Step 3 · Contact', tone:'Step 4 · Brand Voice', generating:'Building', preview:'Done!' };
  const names  = { intro:'Personalise Your Site', basics:'Your Business', story:'Your Story', contact:'Contact Details', tone:'Brand Voice', generating:'Building your site...', preview:'Your site is ready' };

  const lbl = id === 'section' ? `Section ${(window._J._si||0)+1} of ${window._J.sections.length}` : (labels[id]||'');
  const nm  = id === 'section' ? (window._J.sections[window._J._si]?.label||'Edit Section') : (names[id]||'');

  document.getElementById('journey-step-label').textContent = lbl;
  document.getElementById('journey-step-name').textContent = nm;
  document.getElementById('journey-step-count').textContent = (id !== 'intro' && id !== 'generating' && id !== 'preview') ? `${cur} / ${total-1}` : '';
}

function _jUpdateNav(id) {
  const nav  = document.getElementById('journey-nav');
  const back = document.getElementById('journey-back-btn');
  const next = document.getElementById('journey-next-btn');
  const hideNav = id === 'generating' || id === 'preview';
  if (nav)  nav.style.display  = hideNav ? 'none' : 'flex';
  if (back) back.style.display = id === 'intro' ? 'none' : 'flex';
  if (!next) return;
  const isLastSection = id === 'section' && window._J._si >= window._J.sections.length - 1;
  next.innerHTML =
    id === 'intro'         ? 'Get Started <ion-icon name="arrow-forward-outline"></ion-icon>' :
    id === 'tone'          ? 'Edit Sections <ion-icon name="arrow-forward-outline"></ion-icon>' :
    isLastSection          ? 'Generate My Site <ion-icon name="sparkles-outline"></ion-icon>' :
    id === 'section'       ? 'Next Section <ion-icon name="arrow-forward-outline"></ion-icon>' :
                             'Continue <ion-icon name="arrow-forward-outline"></ion-icon>';
}

async function journeyNext() {
  const id = _jStepId();
  const { steps, index } = window._J;

  if (id === 'basics' && !document.getElementById('form-biz-name')?.value?.trim()) {
    const el = document.getElementById('form-biz-name');
    el.style.animation='shake 0.3s ease'; el.style.borderColor='var(--red)';
    setTimeout(()=>{ el.style.animation=''; el.style.borderColor=''; },800);
    el.focus(); return;
  }

  if (id === 'tone' && !window._J.sectionsLoading) _jLoadSections();

  if (id === 'section') {
    _jCollectSection(window._J._si);
    if (window._J._si < window._J.sections.length - 1) {
      window._J._si++;
      _jShow(index); return;
    } else {
      _jGenerate(); return;
    }
  }

  if (id === 'tone') {
    const btn = document.getElementById('journey-next-btn');
    if (!window._J.sectionsLoaded) {
      btn.disabled = true; btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Analysing...';
      await _jWaitSections();
      btn.disabled = false;
    }
    window._J._si = 0;
    if (!steps.includes('section')) steps.splice(steps.indexOf('tone')+1, 0, 'section');
    if (window._J.sections.length === 0) { _jGenerate(); return; }
    _jShow(index + 1); return;
  }

  if (index < steps.length - 1) _jShow(index + 1);
}

function journeyBack() {
  const { steps, index } = window._J;
  const id = steps[index];
  if (id === 'section' && window._J._si > 0) { window._J._si--; _jShow(index, -1); return; }
  if (index > 0) _jShow(index - 1, -1);
}

function selectTone(card) {
  document.querySelectorAll('.tone-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  window._J.tone = card.dataset.tone;
}

async function _jLoadSections() {
  window._J.sectionsLoading = true;
  try {
    const r = await fetch(`${API}/api/website/analyze-sections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: window._editorDraftFile })
    });
    const d = await r.json();
    window._J.sections = d.sections || [];
  } catch { window._J.sections = []; }
  finally { window._J.sectionsLoaded = true; window._J.sectionsLoading = false; }
}

function _jWaitSections() {
  return new Promise(r => { const c = () => window._J.sectionsLoaded ? r() : setTimeout(c, 150); c(); });
}

function _jRenderSection(section) {
  const container = document.getElementById('journey-section-content');
  if (!container || !section) return;
  const si = window._J._si;

  const fieldsHtml = (section.fields || []).map((f, fi) => {
    const id = `jf-${si}-${fi}`;
    const val = section._vals?.[fi] ?? f.current ?? '';
    const safeV = String(val).replace(/</g,'&lt;').replace(/"/g,'&quot;');
    const input = f.type === 'media'
      ? `<div style="display:flex;gap:8px;"><input class="input-field journey-input" id="${id}" value="${safeV}" placeholder="Image/video URL..." style="flex:1;height:44px;font-size:13px;"><label class="btn btn-ghost" style="height:44px;cursor:pointer;flex-shrink:0;"><ion-icon name="cloud-upload-outline"></ion-icon><input type="file" accept="image/*,video/*" style="display:none;" onchange="handleJMedia(this,'${id}')"></label></div>`
      : f.type === 'textarea'
        ? `<textarea class="input-field journey-input" id="${id}" rows="3" style="resize:none;font-size:13px;line-height:1.6;">${String(val).replace(/</g,'&lt;')}</textarea>`
        : `<input class="input-field journey-input" id="${id}" value="${safeV}" style="height:46px;font-size:15px;">`;
    return `<div style="margin-bottom:18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="font-size:14px;font-weight:700;color:var(--text);">${f.label}</div>
        ${f.type !== 'media' ? `<button class="btn btn-ghost" style="font-size:11px;height:28px;padding:0 10px;gap:4px;" onclick="jAiSuggest(${si},${fi},this)"><ion-icon name="sparkles-outline"></ion-icon> Suggest</button>` : ''}
      </div>
      ${input}
      <div id="jsug-${si}-${fi}" style="display:none;margin-top:8px;"></div>
    </div>`;
  }).join('');

  const gridHtml = (section.isGrid && section.items?.length) ? `
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:4px;">
      <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">
        Grid Items — <span style="font-weight:400;">edit, remove, or add</span>
      </div>
      <div id="jgrid-${si}">${section.items.map((item,ii) => _jGridItem(si,ii,item)).join('')}</div>
      <button class="btn btn-ghost" style="width:100%;height:36px;font-size:12px;margin-top:6px;" onclick="addJGridItem(${si})"><ion-icon name="add-outline"></ion-icon> Add Item</button>
    </div>` : '';

  container.innerHTML = fieldsHtml + gridHtml;
}

function _jGridItem(si, ii, item) {
  const safeH = (item.headline||'').replace(/"/g,'&quot;');
  return `<div style="background:var(--glass-sm);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:8px;" id="jgi-${si}-${ii}">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:11px;color:var(--teal);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Item ${ii+1}</div>
      <button class="btn btn-ghost" style="font-size:10px;height:22px;padding:0 8px;color:var(--red);" onclick="removeJGridItem(${si},${ii})">Remove</button>
    </div>
    <div style="margin-bottom:8px;"><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Headline</div>
      <input class="input-field" id="jg-${si}-${ii}-h" value="${safeH}" style="height:36px;font-size:13px;"></div>
    <div><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Description</div>
      <textarea class="input-field" id="jg-${si}-${ii}-d" rows="2" style="resize:none;font-size:12px;">${item.description||''}</textarea></div>
    ${item.hasImage ? `<div style="margin-top:8px;"><div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Image</div>
      <label class="btn btn-ghost" style="width:100%;height:32px;cursor:pointer;font-size:11px;justify-content:center;" id="jg-${si}-${ii}-img">
        <ion-icon name="image-outline"></ion-icon> Upload image<input type="file" accept="image/*" style="display:none;" onchange="handleJGridImg(this,${si},${ii})">
      </label></div>` : ''}
  </div>`;
}

function addJGridItem(si) {
  const sec = window._J.sections[si]; if (!sec) return;
  const ii = (sec.items = sec.items||[]).length;
  sec.items.push({ headline:'', description:'', hasImage:true });
  document.getElementById(`jgrid-${si}`)?.insertAdjacentHTML('beforeend', _jGridItem(si,ii,sec.items[ii]));
}

function removeJGridItem(si, ii) {
  document.getElementById(`jgi-${si}-${ii}`)?.remove();
  if (window._J.sections[si]?.items[ii]) window._J.sections[si].items[ii]._removed = true;
}

function _jCollectSection(si) {
  const sec = window._J.sections[si]; if (!sec) return;
  sec._vals = (sec.fields||[]).map((_,fi) => document.getElementById(`jf-${si}-${fi}`)?.value ?? sec.fields[fi]?.current ?? '');
  sec._gridItems = (sec.items||[]).filter(i=>!i._removed).map((item,ii) => ({
    headline: document.getElementById(`jg-${si}-${ii}-h`)?.value || item.headline || '',
    description: document.getElementById(`jg-${si}-${ii}-d`)?.value || item.description || '',
    hasImage: item.hasImage, newImageData: item.newImageData||null
  }));
}

async function jAiSuggest(si, fi, btn) {
  const sec = window._J.sections[si]; const field = sec?.fields?.[fi]; if (!field) return;
  const biz = { name: document.getElementById('form-biz-name')?.value||'', description: document.getElementById('form-biz-description')?.value||'', tagline: document.getElementById('form-biz-tagline')?.value||'', tone: window._J.tone||'Professional' };
  const inputId = `jf-${si}-${fi}`;
  const sug = document.getElementById(`jsug-${si}-${fi}`);
  const orig = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon>';
  if (sug) { sug.style.display='block'; sug.innerHTML='<div style="font-size:11px;color:var(--muted);">Generating...</div>'; }
  try {
    const r = await fetch(`${API}/api/website/suggest-content`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ businessName:biz.name, description:biz.description, tagline:biz.tagline, tone:biz.tone, sectionLabel:sec.label, fieldLabel:field.label, currentValue:field.current }) });
    const d = await r.json(); if (d.error) throw new Error(d.error);
    if (sug) sug.innerHTML = `<div style="font-size:10px;color:var(--teal);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Pick one:</div>`
      + (d.suggestions||[]).map(s=>`<div class="jsug-option" onclick="jPickSug('${inputId}',this.textContent.trim(),this.parentElement)">${s}</div>`).join('');
  } catch(e) {
    if (sug) sug.innerHTML=`<div style="color:var(--red);font-size:11px;">${e.message}</div>`;
  } finally { btn.disabled=false; btn.innerHTML=orig; }
}

function jPickSug(inputId, val, container) {
  const el = document.getElementById(inputId); if (el) el.value = val;
  if (container) { container.style.opacity='0'; setTimeout(()=>container.style.display='none',200); }
}

function handleJMedia(input, targetId) {
  const file=input.files[0]; if(!file) return;
  const r=new FileReader(); r.onload=e=>{ const t=document.getElementById(targetId); if(t) t.value=e.target.result; }; r.readAsDataURL(file);
}

function handleJGridImg(input, si, ii) {
  const file=input.files[0]; if(!file) return;
  const r=new FileReader(); r.onload=e=>{
    if(window._J.sections[si]?.items[ii]) window._J.sections[si].items[ii].newImageData=e.target.result;
    const lbl=document.getElementById(`jg-${si}-${ii}-img`); if(lbl) lbl.innerHTML='<ion-icon name="checkmark-outline"></ion-icon> Uploaded';
  }; r.readAsDataURL(file);
}

async function _jGenerate() {
  const { steps } = window._J;
  if (!steps.includes('generating')) steps.push('generating');
  _jShow(steps.indexOf('generating'));

  const bar    = document.getElementById('journey-gen-bar');
  const status = document.getElementById('journey-gen-status');
  const msgs   = ['Reading your brand...','Personalising the hero...','Updating copy throughout...','Adjusting grid layouts...','Polishing final touches...'];
  let pct=0, mi=0;
  const tick = setInterval(()=>{
    pct = Math.min(pct + Math.random()*9, 88);
    if (bar) bar.style.width = pct+'%';
    if (status && mi<msgs.length && pct>mi*18) status.textContent=msgs[mi++];
  }, 700);

  try {
    const businessInfo = {
      name: document.getElementById('form-biz-name')?.value||'',
      industry: document.getElementById('form-biz-industry')?.value||'',
      tagline: document.getElementById('form-biz-tagline')?.value||'',
      description: document.getElementById('form-biz-description')?.value||'',
      phone: document.getElementById('form-biz-phone')?.value||'',
      email: document.getElementById('form-biz-email')?.value||'',
      address: document.getElementById('form-biz-address')?.value||'',
      tone: window._J.tone || 'Professional'
    };
    const sections = window._J.sections.map((sec,si) => ({
      id: sec.id, label: sec.label,
      fields: (sec.fields||[]).map((f,fi) => ({ key:f.key, label:f.label, value: sec._vals?.[fi] ?? f.current ?? '' })),
      items: (sec._gridItems || sec.items||[]).filter(i=>!i._removed).map(i => ({ headline:i.headline||'', description:i.description||'', newImageData:i.newImageData||null }))
    }));

    const r = await fetch(`${API}/api/website/form-apply`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ filename:window._editorDraftFile, businessInfo, sections }) });
    const d = await r.json();
    clearInterval(tick);
    if (!d.success) throw new Error(d.error||'Generation failed');
    if (bar) bar.style.width='100%';
    await new Promise(r=>setTimeout(r,500));

    if (!steps.includes('preview')) steps.push('preview');
    _jShow(steps.indexOf('preview'));
    const iframe = document.getElementById('journey-preview-iframe');
    if (iframe) iframe.src = `/generated/${window._editorDraftFile}?t=${Date.now()}`;
    window._editorCurrentFile = window._editorDraftFile;
  } catch(e) {
    clearInterval(tick);
    if (status) status.textContent = 'Error: '+e.message;
    alert('Error: '+e.message);
    journeyBack();
  }
}

function backToJourneyEdit() {
  switchEditorMode('page', document.getElementById('emode-tab-page'));
  loadEditorFile(window._editorDraftFile);
}

// ── OLD FORM STUBS (no-ops, kept so nothing breaks) ─────────────────────────
function goToFormStep2() {}
function backToFormStep1() {}
function renderFormSections() {}
function applyFormEdits() {}

// ── DEAD CODE REMOVED ────────────────────────────────────────────────────────
async function _deadOld() {
  const name = document.getElementById('form-biz-name')?.value?.trim();
  if (!name) return alert('Please enter your business name.');
  const draftFile = window._editorDraftFile;
  if (!draftFile) return alert('No active draft. Go to Templates and click "Edit Copy" first.');

  document.getElementById('form-step-1').style.display = 'none';
  document.getElementById('form-step-2').style.display = 'flex';

  const container = document.getElementById('form-sections-container');
  container.innerHTML = '<div style="color:var(--muted);font-size:12px;padding:30px;text-align:center;"><ion-icon name="hourglass-outline"></ion-icon> Analysing sections...</div>';

  try {
    const r = await fetch(`${API}/api/website/analyze-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: draftFile })
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    renderFormSections(data.sections || []);
  } catch (e) {
    container.innerHTML = `<div style="color:var(--red);font-size:12px;padding:20px;">Error: ${e.message}</div>`;
  }
}

function backToFormStep1() {
  document.getElementById('form-step-2').style.display = 'none';
  document.getElementById('form-step-1').style.display = 'flex';
}

function renderFormSections(sections) {
  window._formSections = sections;
  const container = document.getElementById('form-sections-container');
  if (!sections.length) { container.innerHTML = '<div style="color:var(--muted);font-size:12px;">No sections detected.</div>'; return; }

  container.innerHTML = sections.map((section, si) => {
    const fieldsHtml = (section.fields || []).map((field, fi) => {
      const inputId = `form-field-${si}-${fi}`;
      const safeVal = (field.current || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      let input;
      if (field.type === 'media') {
        input = `<div style="display:flex;gap:8px;align-items:center;">
          <input class="input-field" id="${inputId}" placeholder="Image or video URL..." value="${safeVal}" style="height:36px;font-size:12px;flex:1;">
          <label class="btn btn-ghost" style="font-size:11px;height:36px;cursor:pointer;flex-shrink:0;">
            <ion-icon name="cloud-upload-outline"></ion-icon>
            <input type="file" accept="image/*,video/*" style="display:none;" onchange="handleMediaUpload(this,'${inputId}')">
          </label>
        </div>`;
      } else if (field.type === 'textarea') {
        input = `<textarea class="input-field" id="${inputId}" rows="2" style="resize:none;font-size:12px;">${field.current || ''}</textarea>`;
      } else {
        input = `<input class="input-field" id="${inputId}" value="${safeVal}" style="height:36px;font-size:12px;">`;
      }
      return `<div style="margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div class="label" style="font-size:11px;">${field.label}</div>
          ${field.type !== 'media' ? `<button class="btn btn-ghost" style="font-size:10px;height:24px;padding:0 8px;" onclick="aiGenerateField(${si},${fi},this)"><ion-icon name="sparkles-outline"></ion-icon> AI</button>` : ''}
        </div>
        ${input}
        <div id="form-suggestions-${si}-${fi}" style="display:none;margin-top:4px;"></div>
      </div>`;
    }).join('');

    const gridHtml = (section.isGrid && section.items?.length) ? `
      <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Grid Items</div>
        <div id="form-grid-${si}">${section.items.map((item, ii) => _gridItemHtml(si, ii, item)).join('')}</div>
        <button class="btn btn-ghost" style="font-size:11px;height:32px;width:100%;margin-top:4px;" onclick="addGridItem(${si})">+ Add Item</button>
      </div>` : '';

    return `<div class="card" style="padding:16px;">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <ion-icon name="layers-outline" style="color:var(--teal);"></ion-icon>${section.label}
      </div>${fieldsHtml}${gridHtml}
    </div>`;
  }).join('');
}

function _gridItemHtml(si, ii, item) {
  const safeH = (item.headline || '').replace(/"/g, '&quot;');
  return `<div class="card" style="padding:12px;margin-bottom:8px;background:var(--glass-sm);">
    <div style="font-size:10px;color:var(--muted);font-weight:700;margin-bottom:6px;">ITEM ${ii + 1}</div>
    <div style="margin-bottom:6px;"><div class="label" style="font-size:10px;margin-bottom:3px;">Headline</div>
      <input class="input-field" id="form-grid-${si}-${ii}-headline" value="${safeH}" style="height:32px;font-size:12px;"></div>
    <div><div class="label" style="font-size:10px;margin-bottom:3px;">Description</div>
      <textarea class="input-field" id="form-grid-${si}-${ii}-desc" rows="2" style="resize:none;font-size:12px;">${item.description || ''}</textarea></div>
    ${item.hasImage ? `<div style="margin-top:6px;"><div class="label" style="font-size:10px;margin-bottom:3px;">Image</div>
      <label class="btn btn-ghost" style="font-size:11px;height:32px;width:100%;cursor:pointer;justify-content:center;" id="form-grid-${si}-${ii}-img-btn">
        <ion-icon name="image-outline"></ion-icon> Upload Image
        <input type="file" accept="image/*" style="display:none;" onchange="handleGridImageUpload(this,${si},${ii})">
      </label></div>` : ''}
  </div>`;
}

function addGridItem(si) {
  if (!window._formSections?.[si]) return;
  const items = window._formSections[si].items = window._formSections[si].items || [];
  const ii = items.length;
  items.push({ headline: '', description: '', hasImage: true });
  const grid = document.getElementById(`form-grid-${si}`);
  if (grid) grid.insertAdjacentHTML('beforeend', _gridItemHtml(si, ii, items[ii]));
}

async function aiGenerateField(si, fi, btn) {
  const biz = {
    name: document.getElementById('form-biz-name')?.value || '',
    description: document.getElementById('form-biz-description')?.value || '',
    tagline: document.getElementById('form-biz-tagline')?.value || '',
    tone: document.getElementById('form-biz-tone')?.value || 'Professional'
  };
  const section = window._formSections?.[si];
  const field = section?.fields?.[fi];
  if (!field) return;
  const inputId = `form-field-${si}-${fi}`;
  const sugDiv = document.getElementById(`form-suggestions-${si}-${fi}`);
  const origHtml = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon>';
  if (sugDiv) { sugDiv.style.display = 'block'; sugDiv.innerHTML = '<div style="font-size:11px;color:var(--muted);">Generating...</div>'; }
  try {
    const r = await fetch(`${API}/api/website/suggest-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: biz.name, description: biz.description, tagline: biz.tagline, tone: biz.tone, sectionLabel: section.label, fieldLabel: field.label, currentValue: field.current })
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    if (sugDiv) sugDiv.innerHTML = `
      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;font-weight:600;">Pick one:</div>
      ${(data.suggestions || []).map(s => `<div style="background:var(--glass-sm);border:1px solid var(--border);border-radius:6px;padding:6px 10px;margin-bottom:4px;font-size:12px;cursor:pointer;" onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'" onclick="selectSuggestion('${inputId}',this.textContent.trim(),this.parentElement)">${s}</div>`).join('')}`;
  } catch (e) {
    if (sugDiv) sugDiv.innerHTML = `<div style="color:var(--red);font-size:11px;">${e.message}</div>`;
  } finally {
    btn.disabled = false; btn.innerHTML = origHtml;
  }
}

function selectSuggestion(inputId, value, container) {
  const el = document.getElementById(inputId);
  if (el) el.value = value;
  if (container) container.style.display = 'none';
}

function handleMediaUpload(input, targetId) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { const t = document.getElementById(targetId); if (t) t.value = e.target.result; };
  reader.readAsDataURL(file);
}

function handleGridImageUpload(input, si, ii) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (!window._formSections?.[si]?.items?.[ii]) return;
    window._formSections[si].items[ii].newImageData = e.target.result;
    const lbl = document.getElementById(`form-grid-${si}-${ii}-img-btn`);
    if (lbl) lbl.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Image uploaded';
  };
  reader.readAsDataURL(file);
}

async function applyFormEdits() {
  const draftFile = window._editorDraftFile;
  if (!draftFile) return alert('No active draft.');
  const btn = document.getElementById('form-apply-btn');
  btn.disabled = true;
  btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Applying...';

  const businessInfo = {
    name: document.getElementById('form-biz-name')?.value || '',
    industry: document.getElementById('form-biz-industry')?.value || '',
    tagline: document.getElementById('form-biz-tagline')?.value || '',
    description: document.getElementById('form-biz-description')?.value || '',
    phone: document.getElementById('form-biz-phone')?.value || '',
    email: document.getElementById('form-biz-email')?.value || '',
    address: document.getElementById('form-biz-address')?.value || '',
    tone: document.getElementById('form-biz-tone')?.value || 'Professional'
  };

  const sections = (window._formSections || []).map((sec, si) => ({
    id: sec.id, label: sec.label,
    fields: (sec.fields || []).map((f, fi) => ({ key: f.key, label: f.label, value: document.getElementById(`form-field-${si}-${fi}`)?.value ?? f.current ?? '' })),
    items: (sec.items || []).map((item, ii) => ({
      headline: document.getElementById(`form-grid-${si}-${ii}-headline`)?.value || item.headline || '',
      description: document.getElementById(`form-grid-${si}-${ii}-desc`)?.value || item.description || '',
      newImageData: item.newImageData || null
    }))
  }));

  try {
    const r = await fetch(`${API}/api/website/form-apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: draftFile, businessInfo, sections })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Apply failed');
    switchEditorMode('page', document.getElementById('emode-tab-page'));
    loadEditorFile(draftFile);
    alert('All changes applied! Preview updated.');
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon> Apply All Changes to Draft';
  }
}

// ── EDITOR ──────────────────────────────────────────────────
async function populateEditorFileSelect() {
  const sel = document.getElementById('editor-file-select');
  if (!sel) return;
  try {
    const r = await fetch(`${API}/api/website/files`);
    const files = await r.json();
    const current = window._editorCurrentFile || sel.value;
    sel.innerHTML = `<option value="">Select a file...</option>` +
      files.map(f => `<option value="${f.name}" ${f.name === current ? 'selected' : ''}>${f.name}</option>`).join('');
    if (current) loadEditorFile(current);
    else if (files.length) loadEditorFile(files[0].name);
  } catch {}
}

function loadEditorFile(filename) {
  if (!filename) return;
  const sel = document.getElementById('editor-file-select');
  if (sel) sel.value = filename;
  const iframe = document.getElementById('editor-iframe');
  if (iframe) iframe.src = `/generated/${filename}?t=${Date.now()}`;
  window._editorCurrentFile = filename;
}

async function loadEditorPages(folder) {
  // For multi-page clones, populate a sub-page selector
  const sel = document.getElementById('editor-file-select');
  if (!sel || !folder) return;
  try {
    const r = await fetch(`${API}/api/website/files`);
    const files = await r.json();
    const site = files.find(f => f.folder === folder);
    if (!site || !site.pages) return;
    sel.innerHTML = site.pages.map(p =>
      `<option value="${folder}/${p}">${p}</option>`
    ).join('');
    loadEditorFile(`${folder}/index.html`);
  } catch {}
}

async function applyEditorEdit() {
  const prompt = document.getElementById('editor-prompt')?.value?.trim();
  const filename = window._editorCurrentFile || document.getElementById('editor-file-select')?.value;
  if (!prompt || !filename) return;

  const btn = document.getElementById('editor-apply-btn');
  const history = document.getElementById('editor-history');
  const loading = document.getElementById('editor-loading');
  const input = document.getElementById('editor-prompt');

  btn.disabled = true;
  btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Applying...';
  if (loading) loading.style.display = 'flex';
  input.value = '';

  // Add user entry to history
  const userEntry = document.createElement('div');
  userEntry.className = 'editor-edit-entry user';
  userEntry.textContent = prompt;
  history.appendChild(userEntry);
  history.scrollTop = history.scrollHeight;

  try {
    const r = await fetch(`${API}/api/website/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, prompt })
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Edit failed');

    // Reload iframe
    const iframe = document.getElementById('editor-iframe');
    if (iframe) iframe.src = `/generated/${filename}?t=${Date.now()}`;

    // Add agent entry
    const agentEntry = document.createElement('div');
    agentEntry.className = 'editor-edit-entry agent';
    agentEntry.textContent = data.summary || 'Changes applied.';
    history.appendChild(agentEntry);
    history.scrollTop = history.scrollHeight;
  } catch (e) {
    const errEntry = document.createElement('div');
    errEntry.className = 'editor-edit-entry agent';
    errEntry.style.color = 'var(--red)';
    errEntry.textContent = 'Error: ' + e.message;
    history.appendChild(errEntry);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon> Apply Edit';
    if (loading) loading.style.display = 'none';
  }
}

// ── RESEARCHER ──────────────────────────────────────────────
function renderResearchImages(images) {
  const imagesEl = document.getElementById('researcher-images');
  const gridEl = document.getElementById('researcher-img-grid');
  const countEl = document.getElementById('researcher-img-count');
  gridEl.innerHTML = '';
  if (images && images.length > 0) {
    countEl.textContent = `${images.length} image${images.length !== 1 ? 's' : ''} extracted`;
    images.forEach(img => {
      const imgUrl = `${API}${img.url}`;
      const card = document.createElement('div');
      card.style.cssText = 'position:relative;border-radius:8px;overflow:hidden;background:var(--surface);border:1px solid var(--border);cursor:pointer;aspect-ratio:16/10;';
      card.title = img.originalUrl;
      card.innerHTML = `
        <img src="${imgUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="img-copy-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;">
          <span style="font-size:10px;font-weight:700;color:#fff;letter-spacing:.06em;">COPY URL</span>
        </div>`;
      const overlay = card.querySelector('.img-copy-overlay');
      card.addEventListener('mouseenter', () => overlay.style.opacity = '1');
      card.addEventListener('mouseleave', () => overlay.style.opacity = '0');
      card.addEventListener('click', () => {
        navigator.clipboard.writeText(imgUrl).then(() => {
          overlay.querySelector('span').textContent = 'COPIED!';
          setTimeout(() => overlay.querySelector('span').textContent = 'COPY URL', 1500);
        });
      });
      gridEl.appendChild(card);
    });
    imagesEl.style.display = 'block';
  } else {
    imagesEl.style.display = 'none';
  }
}

async function runResearcher() {
  const urlInput = document.getElementById('researcher-url')?.value?.trim();
  if (!urlInput) return;

  const btn       = document.getElementById('researcher-btn');
  const result    = document.getElementById('researcher-result');
  const progressEl = document.getElementById('researcher-progress');
  const barEl     = document.getElementById('researcher-bar');
  const pctEl     = document.getElementById('researcher-pct');
  const logEl     = document.getElementById('researcher-log');

  const STEPS = {
    'Analysing brand...':       10,
    'Searching web...':         25,
    'Scraping website...':      45,
    'Building brand profile...':65,
    'Extracting images...':     80,
    'Finishing up...':          92,
  };

  const setProgress = (pct, label) => {
    barEl.style.width = pct + '%';
    pctEl.textContent = Math.round(pct) + '%';
    if (label) {
      const row = document.createElement('div');
      row.style.cssText = 'color:var(--muted);display:flex;gap:6px;';
      row.innerHTML = `<span style="color:var(--teal);">›</span>${label}`;
      logEl.appendChild(row);
      logEl.scrollTop = logEl.scrollHeight;
    }
  };

  // Animated crawl between current % and target
  let currentPct = 0;
  const crawlTo = (target) => {
    const step = (target - currentPct) / 20;
    const iv = setInterval(() => {
      currentPct = Math.min(currentPct + step, target);
      barEl.style.width = currentPct + '%';
      pctEl.textContent = Math.round(currentPct) + '%';
      if (currentPct >= target) clearInterval(iv);
    }, 80);
  };

  btn.disabled = true;
  btn.innerHTML = '<ion-icon name="hourglass-outline"></ion-icon> Researching...';
  result.style.display = 'none';
  logEl.innerHTML = '';
  progressEl.style.display = 'block';
  setProgress(5, 'Starting research job...');
  crawlTo(10);

  const isUrl = urlInput.startsWith('http');
  const isHandle = urlInput.startsWith('@');
  const body = isUrl ? { url: urlInput } : isHandle ? { handle: urlInput } : { company: urlInput };

  const sock = getSocket();
  const cleanup = () => {
    sock.off('research:done', onDone);
    sock.off('research:error', onError);
    sock.off('research:progress', onProgress);
    btn.disabled = false;
    btn.innerHTML = '<ion-icon name="search-outline"></ion-icon> Research';
  };

  const onProgress = ({ step }) => {
    const target = STEPS[step] || (currentPct + 8);
    crawlTo(Math.min(target, 92));
    setProgress(currentPct, step);
  };

  const onDone = (data) => {
    crawlTo(100);
    setProgress(100, 'Done!');
    setTimeout(() => {
      cleanup();
      _lastResearchProfile = data.profile;
      document.getElementById('researcher-target-label').textContent = data.target;
      document.getElementById('researcher-profile').textContent = data.profile;
      renderResearchImages(data.images);
      progressEl.style.display = 'none';
      currentPct = 0;
      result.style.display = 'block';
    }, 600);
  };

  const onError = ({ message }) => {
    cleanup();
    setProgress(currentPct, `Error: ${message}`);
    logEl.lastChild && (logEl.lastChild.style.color = 'var(--red)');
  };

  sock.on('research:done', onDone);
  sock.on('research:error', onError);
  sock.on('research:progress', onProgress);

  try {
    const r = await fetch(`${API}/api/website/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!data.success) throw new Error(data.error || 'Research failed');
    // Job running — all updates via socket
  } catch (e) {
    cleanup();
    setProgress(currentPct, `Error: ${e.message}`);
    logEl.lastChild && (logEl.lastChild.style.color = 'var(--red)');
  }
}

function buildFromResearch() {
  if (!_lastResearchProfile) return;
  showWebTab('copier', document.getElementById('wtab-copier'));
  // Pre-fill the copier name based on target
  const targetLabel = document.getElementById('researcher-target-label')?.textContent || '';
  if (targetLabel) document.getElementById('copier-name').value = targetLabel.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
  // Show a note to the user
  document.getElementById('copier-url').placeholder = 'Enter URL to clone, informed by the research above...';
  document.getElementById('copier-url').focus();
}

// ── START ─────────────────────────────────────────────────────
init();

// ══════════════════════════════════════════════════════════════
// MOBILE PWA
// ══════════════════════════════════════════════════════════════

// ── Mobile bottom nav ─────────────────────────────────────────
function mobileNav(sectionId, tabEl) {
  // Update tab bar active state
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  // Mirror to desktop sidebar + show section
  showSection(sectionId, null);

  // Scroll stage-body to top on nav change
  const body = document.querySelector('.stage-body');
  if (body) body.scrollTop = 0;
}

// ── More sheet toggle ─────────────────────────────────────────
function toggleMobileMore() {
  const sheet = document.getElementById('mobile-more-sheet');
  const overlay = document.getElementById('mobile-more-overlay');
  if (!sheet) return;
  const isOpen = sheet.classList.contains('open');
  sheet.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
}

// ── Handle deep-link shortcuts from manifest ──────────────────
(function handleStartupSection() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  if (section) {
    setTimeout(() => {
      const tab = document.querySelector(`[onclick*="mobileNav('${section}'"]`);
      mobileNav(section, tab);
    }, 300);
  }
})();

// ── SW navigate message handler ───────────────────────────────
navigator.serviceWorker?.addEventListener('message', e => {
  if (e.data?.type === 'navigate' && e.data.section) {
    const tab = document.querySelector(`[onclick*="mobileNav('${e.data.section}'"]`);
    mobileNav(e.data.section, tab);
  }
});

// ══════════════════════════════════════════════════════════════
// SERVICE WORKER + PUSH NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

const VAPID_PUBLIC = 'BAGKkVE0RSicsHMPPN2N8gguROwBT3f3VF10SlS-xB9Je5hHj2ftMgkzSyHEBWkwcQ1zYehUZurAJbEtTVe3XDw';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function registerPush(reg) {
  try {
    // Check existing subscription
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      });
    }
    // Send subscription to server
    await fetch(`${API}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON())
    });
    console.log('[PWA] Push subscription registered');
  } catch (err) {
    console.warn('[PWA] Push subscription failed:', err.message);
  }
}

async function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    console.log('[PWA] Service worker registered');

    // Request push permission only on mobile or if already granted
    const isMobile = window.innerWidth <= 768;
    const alreadyGranted = Notification.permission === 'granted';

    if (alreadyGranted) {
      await registerPush(reg);
    } else if (isMobile && Notification.permission === 'default') {
      // On mobile, show a subtle prompt after 3 seconds
      setTimeout(async () => {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') await registerPush(reg);
      }, 3000);
    }
  } catch (err) {
    console.warn('[PWA] SW registration failed:', err.message);
  }
}

initPWA();
