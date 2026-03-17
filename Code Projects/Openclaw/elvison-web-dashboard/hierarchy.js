document.addEventListener('DOMContentLoaded', () => {
    initHierarchyEngine();
    lucide.createIcons();
    // Initial conduit draw
    setTimeout(updateConduits, 100);
});

// --- ⚙ HIERARCHY ENGINE (Zoom/Pan/Conduits) ---
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

    // 1. Mouse Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale *= delta;
        scale = Math.min(Math.max(0.3, scale), 2);
        applyTransform();
    }, { passive: false });

    // 2. Click-and-Drag Pan
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

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    window.addEventListener('resize', updateConduits);
}

// --- 🏷 PORT-TO-PORT CONDUITS ---
function updateConduits() {
    const svg = document.getElementById('conduit-svg');
    if (!svg) return;
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
        const cp2y = y1 + (y2 - y1) / 2;
        
        path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`);
        path.setAttribute("class", "conduit");
        svg.appendChild(path);

        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        arrow.setAttribute("cx", x2);
        arrow.setAttribute("cy", y2);
        arrow.setAttribute("r", "2");
        arrow.setAttribute("fill", "#14b8a6");
        svg.appendChild(arrow);
    });
}

function adjustZoom(amount) {
    scale += amount;
    scale = Math.min(Math.max(0.3, scale), 2);
    const canvas = document.getElementById('hierarchy-canvas');
    if (canvas) {
        canvas.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        updateConduits();
    }
}
window.adjustZoom = adjustZoom;

// --- 🕵️ AGENT DEEP-DIVE MODAL ---
function openAgentDeepDive(agentName) {
    const modal = document.getElementById('modal-deep-dive');
    const nameElem = document.getElementById('modal-agent-name');
    const roleElem = document.getElementById('modal-agent-role');

    if (!modal || !nameElem) return;

    nameElem.innerHTML = `Agent <span class="font-normal text-white">${agentName}</span>`;
    if (agentName === 'Project Manager') {
        roleElem.innerText = 'Master Orchestration Hub';
    } else if (agentName === 'Chief of Staff') {
         roleElem.innerText = 'Operations Flow Control';
    } else {
         roleElem.innerText = 'Financial Strategy Ledger';
    }

    modal.style.display = 'flex';
}
window.openAgentDeepDive = openAgentDeepDive;

function closeAgentDeepDive(e) {
    const modal = document.getElementById('modal-deep-dive');
    if (modal) modal.style.display = 'none';
}
window.closeAgentDeepDive = closeAgentDeepDive;

function closeModalDirect() {
    const modal = document.getElementById('modal-deep-dive');
    if (modal) modal.style.display = 'none';
}
window.closeModalDirect = closeModalDirect;
