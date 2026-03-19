/**
 * Mission Control - Main Application
 * Manages dashboard functionality and data updates
 */

// Configuration
const CONFIG = {
    refreshInterval: 30000, // 30 seconds
    dataBasePath: './data/',
    pages: {
        'pulse': 'index.html',
        'command': 'command-center.html',
        'chain': 'chain-of-command.html',
        'operations': 'operations.html',
        'hub': 'claw-hub.html',
        'memory': 'memory-vault.html',
        'core': 'core-engine.html'
    }
};

// State
let currentView = 'pulse';
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadAllData();
    startAutoRefresh();
});

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('nav a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });
}

function navigateTo(page) {
    currentView = page;
    
    // Update active state
    document.querySelectorAll('nav a[data-page]').forEach(link => {
        link.classList.remove('active-nav');
        link.classList.add('text-slate-500', 'hover:text-black', 'hover:bg-slate-100');
    });
    
    const activeLink = document.querySelector(`nav a[data-page="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active-nav');
        activeLink.classList.remove('text-slate-500', 'hover:text-black', 'hover:bg-slate-100');
    }
    
    // Update page content
    updatePageContent(page);
    
    console.log(`[Mission Control] Navigated to: ${page}`);
}

function updatePageContent(page) {
    const title = document.getElementById('page-title');
    const subtitle = document.getElementById('page-subtitle');
    
    const pageInfo = {
        'pulse': { title: 'Mission Control', subtitle: 'Real-time neural monitoring & deployment oversight.' },
        'command': { title: 'Command Center', subtitle: 'Deploy and manage agent operations.' },
        'chain': { title: 'Chain of Command', subtitle: 'Agent hierarchy and role assignments.' },
        'operations': { title: 'Operations', subtitle: 'Task management and workflow overview.' },
        'hub': { title: 'Claw Hub', subtitle: 'Skill marketplace and tool repository.' },
        'memory': { title: 'Memory Vault', subtitle: 'Browse journals and conversation history.' },
        'core': { title: 'Core Engine', subtitle: 'System settings and configuration.' }
    };
    
    if (pageInfo[page]) {
        title.textContent = pageInfo[page].title;
        subtitle.textContent = pageInfo[page].subtitle;
    }
}

// Data Loading
async function loadAllData() {
    try {
        await Promise.all([
            loadCosts(),
            loadTasks(),
            loadErrors(),
            loadStatus()
        ]);
        console.log('[Mission Control] All data loaded successfully');
    } catch (error) {
        console.error('[Mission Control] Error loading data:', error);
    }
}

async function loadCosts() {
    try {
        const response = await fetch(`${CONFIG.dataBasePath}costs.json?t=${Date.now()}`);
        const data = await response.json();
        renderCosts(data);
    } catch (error) {
        console.error('Failed to load costs:', error);
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`${CONFIG.dataBasePath}tasks.json?t=${Date.now()}`);
        const data = await response.json();
        renderTasks(data);
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

async function loadErrors() {
    try {
        const response = await fetch(`${CONFIG.dataBasePath}errors.json?t=${Date.now()}`);
        const data = await response.json();
        renderErrors(data);
    } catch (error) {
        console.error('Failed to load errors:', error);
    }
}

async function loadStatus() {
    try {
        const response = await fetch(`${CONFIG.dataBasePath}status.json?t=${Date.now()}`);
        const data = await response.json();
        renderStatus(data);
    } catch (error) {
        console.error('Failed to load status:', error);
    }
}

// Rendering
function renderCosts(data) {
    const totalElement = document.getElementById('total-cost');
    const agentsContainer = document.getElementById('cost-agents');
    
    if (totalElement) {
        totalElement.textContent = `$${data.totalCost.toFixed(2)}`;
    }
    
    if (agentsContainer) {
        agentsContainer.innerHTML = data.agents.map(agent => `
            <div>
                <div class="flex justify-between text-[10px] mb-2">
                    <span class="text-slate-400 uppercase tracking-wide">${agent.name} (${agent.model})</span>
                    <span class="text-white">$${agent.cost.toFixed(2)}</span>
                </div>
                <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full glow-teal" 
                         style="width: ${agent.percentage}%; background-color: ${agent.color}"></div>
                </div>
            </div>
        `).join('');
    }
}

function renderTasks(data) {
    const accomplishedEl = document.getElementById('task-accomplished');
    const activeEl = document.getElementById('task-active');
    const scheduledEl = document.getElementById('task-scheduled');
    
    if (accomplishedEl) accomplishedEl.textContent = data.today.accomplished;
    if (activeEl) activeEl.textContent = data.today.activeNodes;
    if (scheduledEl) scheduledEl.textContent = data.today.scheduled;
}

function renderErrors(data) {
    const container = document.getElementById('error-log');
    if (!container) return;
    
    const levelStyles = {
        critical: { bg: 'bg-red-500/5', border: 'border-red-500/10', dot: 'bg-red-500', text: 'text-red-400' },
        warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/10', dot: 'bg-amber-500', text: 'text-amber-400' },
        info: { bg: 'bg-white/5', border: 'border-white/5', dot: 'bg-blue-400', text: 'text-blue-400' }
    };
    
    container.innerHTML = data.errors.map(err => {
        const style = levelStyles[err.level] || levelStyles.info;
        return `
            <div class="p-3 ${style.bg} border ${style.border} rounded-xl flex items-start space-x-3">
                <div class="w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 ${err.level === 'critical' || err.level === 'warning' ? 'shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}"></div>
                <div class="flex-1">
                    <div class="flex justify-between">
                        <span class="text-[9px] font-bold ${style.text} uppercase">${err.level}</span>
                        <span class="text-[9px] text-slate-500">${err.timestamp}</span>
                    </div>
                    <p class="text-[10px] text-slate-300 mt-0.5 leading-tight">${err.message}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderStatus(data) {
    const messageEl = document.getElementById('status-message');
    const syncEl = document.getElementById('last-sync');
    
    if (messageEl) {
        messageEl.innerHTML = `<span class="text-brand-teal font-medium">Hey Elvison,</span> ${data.message}`;
    }
    
    if (syncEl) {
        syncEl.textContent = `${data.syncId} // LAST_SYNC: ${new Date(data.lastSync).toLocaleTimeString()}`;
    }
}

// Auto Refresh
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        console.log('[Mission Control] Auto-refreshing data...');
        loadAllData();
    }, CONFIG.refreshInterval);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// Utility Functions
function formatCurrency(value) {
    return `$${value.toFixed(2)}`;
}

function formatTimeAgo(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Deploy Agent Button
function deployAgent() {
    console.log('[Mission Control] Deploying new agent...');
    alert('Deploy Agent functionality - Coming Soon');
}

// Export for global access
window.MissionControl = {
    navigateTo,
    deployAgent,
    loadAllData,
    startAutoRefresh,
    stopAutoRefresh
};