// ============================================================
// CHAINSENTINEL AI – DASHBOARD JS
// ============================================================

// ---- Animate stat counters
document.addEventListener('DOMContentLoaded', () => {
    CS.animateCount(document.getElementById('stat-contracts'), 2419847, 2000);
    CS.animateCount(document.getElementById('stat-threats'), 47, 1500);
    CS.animateCount(document.getElementById('stat-accuracy'), 0, 1200, '%');

    // Special for saved (dollar amount)
    const savedEl = document.getElementById('stat-saved');
    const targets = [100, 500, 2000, 10000, 50000, 200000, 840000];
    let i = 0;
    const speedUp = setInterval(() => {
        if (i < targets.length) { savedEl.textContent = '$' + targets[i++].toLocaleString() + 'K+'; }
        else { savedEl.textContent = '$840M+'; clearInterval(speedUp); }
    }, 250);

    // After 1.2s set accuracy
    setTimeout(() => { document.getElementById('stat-accuracy').textContent = '99.3%'; }, 1300);

    // Progress bars
    setTimeout(() => {
        CS.animateProgress(document.getElementById('pb1'), 64);
        CS.animateProgress(document.getElementById('pb2'), 28);
        CS.animateProgress(document.getElementById('pb3'), 52);
        CS.animateProgress(document.getElementById('pb4'), 81);
        CS.animateProgress(document.getElementById('pb5'), 17);
    }, 400);

    drawTrendChart();
    populateRecentScans();
    startLiveFeed();
    buildChainStatus();
});

// ---- Trend Chart
function drawTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400;
    const H = 180;
    canvas.width = W; canvas.height = H;

    const critData = [4, 7, 5, 12, 8, 6, 15, 11, 9, 18, 14, 7, 10, 22, 16, 8, 12, 19, 15, 11, 24, 18, 13, 20, 16, 10, 14, 28, 21, 17];
    const warnData = [12, 18, 14, 22, 16, 11, 24, 20, 15, 28, 22, 14, 18, 32, 25, 14, 20, 28, 24, 18, 35, 28, 20, 30, 24, 16, 22, 40, 32, 26];

    const all = [...critData, ...warnData];
    const minV = Math.min(...all), maxV = Math.max(...all);
    const pad = 30;

    const sx = (i) => pad + (i / (critData.length - 1)) * (W - pad * 2);
    const sy = (v) => H - pad - ((v - minV) / (maxV - minV + 1)) * (H - pad * 2);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,212,255,0.07)'; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
        const y = pad + (g / 4) * (H - pad * 2);
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    // Warning area
    const gradW = ctx.createLinearGradient(0, 0, 0, H);
    gradW.addColorStop(0, 'rgba(255,140,0,0.2)'); gradW.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.beginPath();
    warnData.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v)));
    ctx.lineTo(sx(warnData.length - 1), H - pad); ctx.lineTo(sx(0), H - pad);
    ctx.fillStyle = gradW; ctx.fill();
    ctx.beginPath();
    warnData.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v)));
    ctx.strokeStyle = 'rgba(255,140,0,0.7)'; ctx.lineWidth = 2; ctx.stroke();

    // Critical area
    const gradC = ctx.createLinearGradient(0, 0, 0, H);
    gradC.addColorStop(0, 'rgba(255,45,85,0.25)'); gradC.addColorStop(1, 'rgba(255,45,85,0)');
    ctx.beginPath();
    critData.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v)));
    ctx.lineTo(sx(critData.length - 1), H - pad); ctx.lineTo(sx(0), H - pad);
    ctx.fillStyle = gradC; ctx.fill();
    ctx.beginPath();
    critData.forEach((v, i) => i === 0 ? ctx.moveTo(sx(i), sy(v)) : ctx.lineTo(sx(i), sy(v)));
    ctx.strokeStyle = 'rgba(255,45,85,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();

    // X axis labels
    ctx.fillStyle = 'rgba(143,163,192,0.6)'; ctx.font = '10px JetBrains Mono, monospace';
    const days = ['Jan 28', 'Feb 3', 'Feb 10', 'Feb 17', 'Feb 24', 'Feb 27'];
    days.forEach((d, i) => {
        const idx = Math.round((i / (days.length - 1)) * (critData.length - 1));
        ctx.fillText(d, sx(idx) - 18, H - 4);
    });
}

// ---- Recent Scans table
const scans = [
    { addr: '0x7f4a…3c2e', chain: 'ETH', risk: 'safe', score: 8 },
    { addr: '0xd34f…9a0c', chain: 'BSC', risk: 'high', score: 94 },
    { addr: '0x1e8b…a012', chain: 'ARB', risk: 'medium', score: 45 },
    { addr: '0x99fe…5510', chain: 'ETH', risk: 'high', score: 78 },
    { addr: '0x3e8c…f902', chain: 'POL', risk: 'safe', score: 12 },
    { addr: '0xabc1…d234', chain: 'ETH', risk: 'medium', score: 61 },
];

function populateRecentScans() {
    const tbody = document.getElementById('recentScansTable');
    if (!tbody) return;
    scans.forEach(s => {
        const cls = s.risk === 'safe' ? 'badge-safe' : s.risk === 'high' ? 'badge-danger' : 'badge-warning';
        tbody.innerHTML += `<tr>
      <td style="color:var(--accent-cyan)">${s.addr}</td>
      <td>${s.chain}</td>
      <td><span class="badge ${cls}">${s.risk}</span></td>
      <td style="color:${s.score > 70 ? 'var(--accent-red)' : s.score > 40 ? 'var(--accent-orange)' : 'var(--accent-green)'}">${s.score}/100</td>
    </tr>`;
    });
}

// ---- Live Feed
const feedEvents = [
    { type: 'critical', icon: '🚨', text: 'Flash loan attack on Fork-XYZ', time: 'now', chain: 'ETH' },
    { type: 'warning', icon: '⚠️', text: 'Liquidity drain 87% — MoonToken/ETH', time: '2m', chain: 'BSC' },
    { type: 'info', icon: '🔬', text: 'New contract scanned — Risk: 12/100', time: '5m', chain: 'ARB' },
    { type: 'warning', icon: '🎣', text: 'Phishing domain flagged: verify-mm.xyz', time: '11m', chain: 'Multi' },
    { type: 'info', icon: '✅', text: 'Approval revoked — 0x34ab…cc01', time: '18m', chain: 'POL' },
];

let feedIndex = 0;
function startLiveFeed() {
    const container = document.getElementById('liveFeed');
    if (!container) return;
    // Initial load
    feedEvents.slice(0, 4).forEach(e => addFeedItem(container, e));
    // Add new items periodically
    setInterval(() => {
        const newEvents = [
            { type: 'critical', icon: '🚨', text: 'Reentrancy exploit attempt blocked', time: 'just now', chain: 'ETH' },
            { type: 'info', icon: '🔍', text: '0x' + Math.random().toString(16).slice(2, 10) + '… scanned — Safe', time: 'just now', chain: 'ARB' },
            { type: 'warning', icon: '⚡', text: 'Abnormal gas spike — possible MEV bot', time: 'just now', chain: 'ETH' },
        ];
        const ev = newEvents[feedIndex % newEvents.length];
        feedIndex++;
        const items = container.querySelectorAll('.threat-item');
        if (items.length >= 5) items[items.length - 1].remove();
        const el = document.createElement('div');
        el.innerHTML = buildFeedItem(ev);
        el.firstChild.style.transform = 'translateY(-20px)'; el.firstChild.style.opacity = '0';
        container.insertBefore(el.firstChild, container.firstChild);
        requestAnimationFrame(() => {
            const inserted = container.firstChild;
            inserted.style.transition = 'all 0.4s ease';
            inserted.style.transform = 'none'; inserted.style.opacity = '1';
        });
    }, 4000);
}

function buildFeedItem(e) {
    return `<div class="threat-item ${e.type}" style="padding:0.6rem 0.75rem;">
    <div class="threat-icon ${e.type}" style="width:30px;height:30px;">${e.icon}</div>
    <div class="threat-body">
      <div class="threat-title" style="font-size:0.8rem;">${e.text}</div>
      <div class="threat-meta">
        <span class="tag" style="font-size:0.65rem;">${e.chain}</span>
        <span class="threat-time">${e.time}</span>
      </div>
    </div>
  </div>`;
}

function addFeedItem(container, e) {
    container.innerHTML += buildFeedItem(e);
}

// ---- Chain Status
function buildChainStatus() {
    const chains = [
        { name: 'Ethereum', icon: '⟠', color: 'var(--accent-cyan)', status: '🟢 Nominal', threats: 4 },
        { name: 'Arbitrum', icon: '🟣', color: 'var(--accent-purple)', status: '🟢 Nominal', threats: 2 },
        { name: 'Polygon', icon: '🦊', color: '#8247e5', status: '🟡 Elevated', threats: 7 },
        { name: 'BNB Chain', icon: '🌙', color: 'var(--accent-yellow)', status: '🔴 Critical', threats: 18 },
    ];
    const grid = document.getElementById('chainStatus');
    if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;grid-column:1/-1;';
    chains.forEach(c => {
        grid.innerHTML += `
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-md);text-align:center;">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">${c.icon}</div>
        <div style="font-weight:700; font-size:0.875rem; margin-bottom:0.25rem;">${c.name}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem;">${c.status}</div>
        <div style="font-family:var(--font-mono); font-size:0.8rem; color:${c.threats > 10 ? 'var(--accent-red)' : c.threats > 5 ? 'var(--accent-orange)' : 'var(--accent-green)'};">${c.threats} threats</div>
      </div>`;
    });
}
