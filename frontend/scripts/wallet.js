// ============================================================
// CHAINSENTINEL AI – WALLET GUARD JS
// ============================================================

function loadDemoWallet() {
    document.getElementById('walletInput').value = '0x742d35Cc6634C0532925a3b844Bc9e7595f6e842';
    loadWalletData();
}

const approvals = [
    { token: 'USDC', symbol: 'USDC', spender: '0x89ab…Uniswap V3', allowance: 'Unlimited', risk: 'high', usd: '$∞', logo: '💵' },
    { token: 'WETH', symbol: 'WETH', spender: '0x34fe…OKX-DEX', allowance: '500 WETH', risk: 'high', usd: '~$1.2M', logo: '⟠' },
    { token: 'PEPE', symbol: 'PEPE', spender: '0x99b2…Unknown', allowance: 'Unlimited', risk: 'critical', usd: '$∞', logo: '🐸' },
    { token: 'DAI', symbol: 'DAI', spender: '0x6b17…Aave V3', allowance: '10,000 DAI', risk: 'low', usd: '$10K', logo: '🔶' },
    { token: 'LINK', symbol: 'LINK', spender: '0x1f9a…Chainlink', allowance: '100 LINK', risk: 'safe', usd: '~$1.4K', logo: '🔗' },
    { token: 'SHIB', symbol: 'SHIB', spender: '0xdead…ShibaDEX', allowance: '500,000,000 SHIB', risk: 'medium', usd: '~$5K', logo: '🐕' },
];

function loadWalletData() {
    const addr = document.getElementById('walletInput').value.trim() || '0x742d35Cc6634C0532925a3b844Bc9e7595f6e842';

    // Animate wallet display
    document.getElementById('walletDisplay').textContent = CS.shortAddr(addr);
    document.getElementById('walletResults').style.display = 'block';

    // Stats
    document.getElementById('wlTotalAppr').textContent = approvals.length;
    document.getElementById('wlHighRisk').textContent = approvals.filter(a => a.risk === 'high' || a.risk === 'critical').length;
    document.getElementById('wlExposure').textContent = '$1.2M+';

    // Risk ring
    const riskPct = 74;
    const circumference = 326.7;
    const offset = circumference - (riskPct / 100) * circumference;
    setTimeout(() => {
        document.getElementById('ringCircle').style.strokeDashoffset = offset;
        document.getElementById('ringCircle').style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)';
        document.getElementById('ringPct').textContent = riskPct;
    }, 300);

    // Alert
    document.getElementById('walletAlert').style.display = 'flex';
    document.getElementById('walletAlertMsg').textContent = 'PEPE approval to unknown 0x99b2 has UNLIMITED allowance. This spender is NOT a verified protocol. Immediate revocation recommended.';

    // Table
    const tbody = document.getElementById('approvalsTable');
    tbody.innerHTML = '';
    approvals.forEach((a, i) => {
        const cls = a.risk === 'critical' ? 'badge-danger' : a.risk === 'high' ? 'badge-danger' : a.risk === 'medium' ? 'badge-warning' : a.risk === 'low' ? 'badge-warning' : 'badge-safe';
        const riskTxt = a.risk.toUpperCase();
        tbody.innerHTML += `<tr id="row_${i}">
      <td><span style="margin-right:0.4rem;">${a.logo}</span> ${a.token}</td>
      <td style="color:var(--accent-cyan);">${a.spender}</td>
      <td>${a.allowance} <span style="font-size:0.72rem;color:var(--text-muted);">(${a.usd})</span></td>
      <td><span class="badge ${cls}">${riskTxt}</span></td>
      <td><button class="btn btn-sm ${a.risk === 'safe' || a.risk === 'low' ? 'btn-ghost' : 'btn-danger'}" onclick="revokeApproval(${i},'${a.token}')">${a.risk === 'safe' || a.risk === 'low' ? '✅ Keep' : '🗑️ Revoke'}</button></td>
    </tr>`;
    });

    // Timeline
    const events = [
        { time: '2h ago', text: 'PEPE approved 0x99b2…unknown — UNLIMITED', warn: true },
        { time: '1d ago', text: 'WETH approved 0x34fe…OKX-DEX — 500 WETH', warn: true },
        { time: '3d ago', text: 'USDC approved 0x89ab…Uniswap V3 — Unlimited', warn: false },
        { time: '1wk ago', text: 'DAI approved 0x6b17…Aave V3 — 10,000 DAI', warn: false },
        { time: '2wk ago', text: 'LINK approved 0x1f9a…Chainlink — 100 LINK', warn: false },
    ];
    const tlEl = document.getElementById('walletTimeline');
    tlEl.innerHTML = '';
    events.forEach(e => {
        tlEl.innerHTML += `
      <div class="timeline-item">
        <div style="font-size:0.8rem; font-weight:600; ${e.warn ? 'color:var(--accent-orange)' : ''}">${e.text}</div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem; font-family:var(--font-mono);">${e.time}</div>
      </div>`;
    });

    // AI Analysis
    const aiText = 'Your wallet has 2 critical and 1 high-risk token approvals active. The PEPE unlimited approval granted to 0x99b2 is extremely concerning — this address is unverified and has been flagged in 3 known phishing campaigns. The WETH 500 ETH approval to OKX DEX is also high-value and should be set to the exact amount needed per transaction. Revoke the PEPE approval immediately to eliminate the highest exposure vector. Overall wallet risk: HIGH — action required.';
    CS.typeText(document.getElementById('walletAI'), aiText, 14);

    // Recommendations
    const recs = [
        { icon: '🚨', text: 'Revoke PEPE unlimited approval to unknown spender immediately', urgent: true },
        { icon: '⚠️', text: 'Reduce WETH allowance to exact transaction amount', urgent: true },
        { icon: '💡', text: 'Set per-transaction approval limits for all future DeFi interactions', urgent: false },
        { icon: '🔐', text: 'Consider using a hardware wallet for high-value approvals', urgent: false },
    ];
    const recsEl = document.getElementById('walletRecs');
    recsEl.innerHTML = '';
    recs.forEach(r => {
        recsEl.innerHTML += `
      <div class="${r.urgent ? 'alert alert-warning' : 'alert alert-info'}" style="border-radius:var(--r-sm); padding:0.6rem 0.8rem;">
        <span>${r.icon}</span><span>${r.text}</span>
      </div>`;
    });

    CS.toast('Wallet analysis complete — 3 critical approvals found', 'danger');
}

function revokeApproval(idx, token) {
    const row = document.getElementById(`row_${idx}`);
    if (row) {
        row.style.transition = 'all 0.4s';
        row.style.opacity = '0.3';
        row.style.transform = 'translateX(30px)';
        setTimeout(() => { row.style.display = 'none'; }, 400);
    }
    CS.toast(`${token} approval revoked successfully`, 'success');
}

function revokeAll() {
    const highRisk = [0, 1, 2, 5]; // indices of high/critical
    highRisk.forEach((idx, i) => setTimeout(() => revokeApproval(idx, approvals[idx]?.token), i * 300));
    setTimeout(() => CS.toast('All dangerous approvals revoked! 🛡️', 'success'), 1500);
}
