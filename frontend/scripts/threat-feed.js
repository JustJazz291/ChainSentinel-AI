// ============================================================
// CHAINSENTINEL AI – THREAT FEED JS
// ============================================================

const allThreats = [
    { id: 1, sev: 'critical', tag: 'rug', icon: '🪤', title: 'Rug Pull Executed — MoonElonDoge', desc: '0xd34f…9a0c removed 98% of LP. $3.2M USDC drained from investors in 47 seconds.', chain: 'BSC', time: '2m ago', addr: '0xd34f…9a0c', usd: '$3.2M' },
    { id: 2, sev: 'critical', tag: 'exploit', icon: '⚡', title: 'Flash Loan Attack — Compound Fork', desc: 'Reentrancy exploit via manipulated oracle. Single-block attack. $2.4M USDC stolen.', chain: 'ETH', time: '11m ago', addr: '0x1a2b…3c4d', usd: '$2.4M' },
    { id: 3, sev: 'warning', tag: 'phishing', icon: '🎣', title: 'Phishing Campaign Active — "MetaMask v12"', desc: '"metamask-offlcial.net" sending targeted emails. 847 wallets at risk. Drain confirmed on 23.', chain: 'Multi', time: '18m ago', addr: 'N/A', usd: '~$180K' },
    { id: 4, sev: 'critical', tag: 'exploit', icon: '🚨', title: 'NFT Marketplace Exploit — OpenC Fork', desc: 'transferFrom() bypass via low-level delegatecall. 142 NFTs swept. Floor: ~$4.1M.', chain: 'ETH', time: '34m ago', addr: '0x99fe…5510', usd: '$4.1M' },
    { id: 5, sev: 'warning', tag: 'rug', icon: '⚠️', title: 'Suspicious Liquidity Removal', desc: '0xabc1…2345 removed 72% liquidity. $890K at risk. Deployer wallet flagged.', chain: 'POL', time: '52m ago', addr: '0xabc1…2345', usd: '$890K' },
    { id: 6, sev: 'info', tag: 'info', icon: '🔍', title: 'New Exploit Signature Added to DB', desc: 'CVE-2024-Web3-0091: Callback function reentrance via ERC-777 tokens. DB updated.', chain: 'ALL', time: '1h ago', addr: 'N/A', usd: 'N/A' },
    { id: 7, sev: 'warning', tag: 'phishing', icon: '🎣', title: 'Fake Airdrop Campaign — SHIB2', desc: 'Unsolicited tokens sent to 50K wallets linking to drain site shib2-airdrop.xyz.', chain: 'ETH', time: '1h ago', addr: '0x3f8c…a901', usd: '~$50K' },
    { id: 8, sev: 'critical', tag: 'exploit', icon: '⚡', title: 'Price Oracle Manipulation — Aave Clone', desc: 'TWAP bypass via block-stuffing. Attacker borrowed $8M at artificial prices.', chain: 'ARB', time: '2h ago', addr: '0x5678…def0', usd: '$8.0M' },
    { id: 9, sev: 'info', tag: 'info', icon: '✅', title: 'Bridge Security Upgrade — Arbitrum', desc: 'Arbitrum One bridge validator set rotated. New MPC threshold: 7-of-12. Audit: CertiK.', chain: 'ARB', time: '2h ago', addr: 'N/A', usd: 'N/A' },
    { id: 10, sev: 'warning', tag: 'exploit', icon: '⚠️', title: 'Front-Running Bot Activity Spike', desc: 'Sandwich attack volume up 340% on Uniswap V3. ETH/USDC pair most targeted.', chain: 'ETH', time: '3h ago', addr: '0x7abc…1234', usd: '~$2M' },
    { id: 11, sev: 'critical', tag: 'rug', icon: '🪤', title: 'TokenX Rug Pull — Team Dumped', desc: 'Deployer wallet sold 98% of holdings (1.2B tokens). Price dropped 99.7% in 3 blocks.', chain: 'BSC', time: '4h ago', addr: '0xbeef…cafe', usd: '$1.8M' },
    { id: 12, sev: 'warning', tag: 'phishing', icon: '🎣', title: 'Discord Bot Scam — 12 NFT Servers', desc: 'Compromised Discord bots posting fake mint links. At least $320K claimed by victims.', chain: 'ETH', time: '5h ago', addr: 'N/A', usd: '$320K' },
    { id: 13, sev: 'info', tag: 'info', icon: '🔬', title: 'Exploit Pattern: Hidden Backdoor', desc: 'New pattern: contracts using CREATE2 to deploy hidden backdoors post-audit. 4 flagged.', chain: 'ALL', time: '6h ago', addr: 'N/A', usd: 'N/A' },
    { id: 14, sev: 'critical', tag: 'exploit', icon: '🚨', title: 'BNB Bridge Approval Exploit', desc: '7 wallets drained via malicious spender approved on BNB bridge. $650K lost.', chain: 'BSC', time: '7h ago', addr: '0xcafe…babe', usd: '$650K' },
    { id: 15, sev: 'warning', tag: 'rug', icon: '⚠️', title: 'GemToken — Honeypot Detected', desc: 'Buy only contract: sell function reverts for all non-owner wallets. 2,400 victims.', chain: 'BSC', time: '8h ago', addr: '0x1234…5678', usd: '~$420K' },
];

let activeFilter = 'all';
let displayCount = 8;

document.addEventListener('DOMContentLoaded', () => {
    // Animate stats
    setTimeout(() => {
        CS.animateCount(document.getElementById('countCritical'), 47);
        CS.animateCount(document.getElementById('countWarning'), 83);
        CS.animateCount(document.getElementById('countChains'), 6);
        document.getElementById('countUSD').textContent = '$24.8M';
    }, 300);

    renderFeed();
    buildActiveExploits();
    buildChainRiskMap();
    buildAttackVectors();
    startLiveFeed();
});

function filterFeed(type, btn) {
    activeFilter = type;
    document.querySelectorAll('#filterBtns .btn').forEach(b => {
        b.className = 'btn btn-ghost btn-sm';
    });
    btn.className = 'btn btn-danger btn-sm';
    displayCount = 8;
    renderFeed();
}

function renderFeed() {
    const chainF = document.getElementById('chainFilter')?.value || 'all';
    let filtered = allThreats.filter(t => {
        const matchSev = activeFilter === 'all' || t.sev === activeFilter || t.tag === activeFilter;
        const matchChain = chainF === 'all' || t.chain === chainF || t.chain === 'ALL' || t.chain === 'Multi';
        return matchSev && matchChain;
    });

    const container = document.getElementById('feedContainer');
    container.innerHTML = '';
    filtered.slice(0, displayCount).forEach(t => {
        const sevCls = t.sev === 'critical' ? 'badge-danger' : t.sev === 'warning' ? 'badge-warning' : 'badge-info';
        const tagCls = t.tag === 'rug' ? 'badge-warning' : t.tag === 'phishing' ? 'badge-purple' : t.tag === 'exploit' ? 'badge-danger' : 'badge-info';
        container.innerHTML += `
      <div class="threat-item ${t.sev}" style="cursor:default;">
        <div class="threat-icon ${t.sev}">${t.icon}</div>
        <div class="threat-body">
          <div class="threat-title">${t.title}</div>
          <div class="threat-desc" style="white-space:normal;font-size:0.82rem;margin:0.2rem 0 0.4rem;color:var(--text-secondary);">${t.desc}</div>
          <div class="threat-meta" style="flex-wrap:wrap">
            <span class="badge ${sevCls}">${t.sev}</span>
            <span class="badge ${tagCls}">${t.tag}</span>
            <span class="tag">${t.chain}</span>
            ${t.addr !== 'N/A' ? `<span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-cyan);">${t.addr}</span>` : ''}
            ${t.usd !== 'N/A' ? `<span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--accent-red);">${t.usd}</span>` : ''}
            <span class="threat-time">${t.time}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;min-width:80px;align-items:flex-end;">
          <button class="btn btn-ghost btn-sm" onclick="CS.toast('Opening contract scanner...','info'); setTimeout(()=>window.location='contract-scanner.html',800)">🔬 Scan</button>
          <button class="btn btn-ghost btn-sm" onclick="CS.toast('Threat bookmarked','success')">📌</button>
        </div>
      </div>`;
    });
    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted);">No events match this filter</div>`;
    }
}

function loadMore() {
    displayCount += 4;
    renderFeed();
    CS.toast('Loaded more events', 'info');
}

function buildActiveExploits() {
    const active = [
        { name: 'Compound Fork Flash Loan', chain: 'ETH', elapsed: '11m', risk: 94, icon: '⚡' },
        { name: 'NFT Marketplace Exploit', chain: 'ETH', elapsed: '34m', risk: 87, icon: '🖼️' },
        { name: 'Aave Oracle Manipulation', chain: 'ARB', elapsed: '2h', risk: 79, icon: '🔮' },
    ];
    const el = document.getElementById('activeExploits');
    active.forEach(a => {
        el.innerHTML += `
      <div style="background:rgba(255,45,85,0.08);border:1px solid rgba(255,45,85,0.2);border-radius:var(--r-md);padding:var(--sp-md);">
        <div class="flex-between" style="margin-bottom:0.3rem;">
          <div style="font-weight:600;font-size:0.82rem;">${a.icon} ${a.name}</div>
          <span class="badge badge-danger" style="font-size:0.65rem;">${a.risk}/100</span>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${a.chain} · Active for ${a.elapsed}</div>
        <div class="progress-wrap" style="margin-top:0.5rem;"><div class="progress-bar red" style="width:${a.risk}%"></div></div>
      </div>`;
    });
}

function buildChainRiskMap() {
    const chains = [
        { name: 'BNB Chain', level: 'Critical', pct: 91, color: 'var(--accent-red)' },
        { name: 'Ethereum', level: 'High', pct: 72, color: 'var(--accent-orange)' },
        { name: 'Polygon', level: 'Elevated', pct: 58, color: 'var(--accent-orange)' },
        { name: 'Arbitrum', level: 'Moderate', pct: 43, color: 'var(--accent-yellow)' },
        { name: 'Avalanche', level: 'Low', pct: 22, color: 'var(--accent-green)' },
        { name: 'Optimism', level: 'Low', pct: 18, color: 'var(--accent-green)' },
    ];
    const el = document.getElementById('chainRiskMap');
    chains.forEach(c => {
        el.innerHTML += `
      <div>
        <div class="flex-between" style="margin-bottom:0.2rem;">
          <span style="font-size:0.82rem;">${c.name}</span>
          <span style="font-size:0.75rem;font-family:var(--font-mono);color:${c.color};">${c.level}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${c.pct}%;background:${c.color};box-shadow:0 0 8px ${c.color}55;"></div></div>
      </div>`;
    });
}

function buildAttackVectors() {
    const vectors = [
        { name: 'Rug Pulls', count: 19, icon: '🪤', pct: 40 },
        { name: 'Flash Loan Attacks', count: 11, icon: '⚡', pct: 23 },
        { name: 'Phishing Campaigns', count: 8, icon: '🎣', pct: 17 },
        { name: 'Malicious Approvals', count: 6, icon: '✍️', pct: 13 },
        { name: 'Oracle Manipulation', count: 3, icon: '🔮', pct: 6 },
    ];
    const el = document.getElementById('attackVectors');
    vectors.forEach(v => {
        el.innerHTML += `
      <div>
        <div class="flex-between" style="margin-bottom:0.25rem;">
          <span style="font-size:0.8rem;">${v.icon} ${v.name}</span>
          <span style="font-size:0.78rem;font-family:var(--font-mono);color:var(--text-muted);">${v.count}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar cyan" style="width:${v.pct}%"></div></div>
      </div>`;
    });
}

// ---- Live feed: add new events periodically
let liveEventIdx = 0;
const liveEvents = [
    { sev: 'critical', icon: '🚨', msg: 'New rug pull: 0x' + CS.fakeAddr().slice(2, 10) + '… — BSC — $720K', type: 'danger' },
    { sev: 'warning', icon: '⚠️', msg: 'Unusual gas spike: Uniswap V3 ETH/USDT', type: 'warning' },
    { sev: 'info', icon: '🔍', msg: 'Contract ' + CS.fakeAddr().slice(0, 10) + 'scanned — Safe (score: 14)', type: 'info' },
    { sev: 'critical', icon: '⚡', msg: 'Flash loan: 0x' + CS.fakeAddr().slice(2, 10) + '… — ARB — $1.1M', type: 'danger' },
];

function startLiveFeed() {
    setInterval(() => {
        const ev = liveEvents[liveEventIdx % liveEvents.length];
        liveEventIdx++;
        const newThreat = {
            id: Date.now(),
            sev: ev.sev,
            tag: 'exploit',
            icon: ev.icon,
            title: 'Live Event: ' + ev.msg,
            desc: 'Real-time detection by ChainSentinel AI monitoring network. Flagged for review.',
            chain: 'MNT',
            time: 'just now',
            addr: CS.fakeAddr().slice(0, 10) + '…',
            usd: '$' + CS.randInt(50, 5000) + 'K',
        };
        allThreats.unshift(newThreat);
        renderFeed();
        CS.toast(ev.icon + ' ' + ev.msg.slice(0, 50) + '…', ev.type, 5000);
    }, 12000);
}
