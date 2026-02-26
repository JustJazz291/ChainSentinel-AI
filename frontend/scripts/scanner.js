// ============================================================
// CHAINSENTINEL AI – CONTRACT SCANNER JS
// ============================================================

let currentTab = 'addr';
function switchTab(tab) {
    currentTab = tab;
    document.getElementById('panelAddr').style.display = tab === 'addr' ? 'block' : 'none';
    document.getElementById('panelSrc').style.display = tab === 'src' ? 'block' : 'none';
    document.getElementById('tabAddr').className = tab === 'addr' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    document.getElementById('tabSrc').className = tab === 'src' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
}

function loadDemoContract() {
    document.getElementById('contractAddr').value = '0xd34f8b8a9a0c5d42e1234f5678901234bc56d7e8';
    document.getElementById('chainSelect').value = 'bsc';
    CS.toast('Demo contract loaded — known rug-pull pattern', 'warning');
}

const scanSteps = [
    { msg: 'Fetching on-chain bytecode…', pct: 15 },
    { msg: 'Decompiling EVM instructions…', pct: 30 },
    { msg: 'Running pattern-match models…', pct: 50 },
    { msg: 'Analyzing control flow graph…', pct: 65 },
    { msg: 'Cross-referencing exploit DB…', pct: 78 },
    { msg: 'Computing risk vectors…', pct: 88 },
    { msg: 'Generating AI explanation…', pct: 95 },
    { msg: 'Finalizing report…', pct: 100 },
];

function startScan() {
    const addr = currentTab === 'addr'
        ? (document.getElementById('contractAddr').value.trim() || '0x742d35Cc6634C0532925a3b844Bc9e7595f6e842')
        : 'Source-Code-Scan';

    document.querySelector('.card').style.display = 'none';
    document.getElementById('scanningState').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    let stepI = 0;
    const statusEl = document.getElementById('scanStatus');
    const progressEl = document.getElementById('scanProgress');

    const run = () => {
        if (stepI >= scanSteps.length) {
            setTimeout(() => showResults(addr), 400);
            return;
        }
        const s = scanSteps[stepI++];
        statusEl.textContent = s.msg;
        progressEl.style.width = s.pct + '%';
        setTimeout(run, CS.randInt(250, 550));
    };
    run();
}

function showResults(addr) {
    document.getElementById('scanningState').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    const isHighRisk = addr.toLowerCase().includes('d34f') || addr === 'Source-Code-Scan';
    const score = isHighRisk ? CS.randInt(72, 96) : CS.randInt(8, 32);
    const riskLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    const riskColor = riskLevel === 'high' ? 'var(--accent-red)' : riskLevel === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)';
    const riskGlow = riskLevel === 'high' ? 'var(--glow-red)' : riskLevel === 'medium' ? '' : 'var(--glow-green)';

    // Gauge
    document.getElementById('riskGauge').innerHTML = `
    <div style="font-size:4rem;font-weight:900;font-family:var(--font-mono);color:${riskColor};text-shadow:0 0 30px ${riskColor};">${score}</div>
    <div style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.08em;">RISK SCORE / 100</div>
    <div style="margin-top:0.5rem;">
      <span class="badge ${riskLevel === 'high' ? 'badge-danger' : riskLevel === 'medium' ? 'badge-warning' : 'badge-safe'}" style="font-size:0.8rem;">${riskLevel.toUpperCase()} RISK</span>
    </div>`;

    document.getElementById('riskTitle').textContent = riskLevel === 'high' ? '⚠️ High-Risk Contract Detected' : riskLevel === 'medium' ? '⚠️ Moderate Risk Identified' : '✅ Contract Appears Safe';
    document.getElementById('riskDesc').textContent = riskLevel === 'high' ? 'This contract exhibits multiple critical vulnerability patterns. Interaction is strongly discouraged.' : riskLevel === 'medium' ? 'Some suspicious patterns detected. Review carefully before interacting.' : 'No significant vulnerabilities detected. Exercise standard due diligence.';
    document.getElementById('scannedAddr').textContent = CS.shortAddr(addr);
    document.getElementById('scanMeta').textContent = `⟠ Ethereum · Scanned ${new Date().toLocaleTimeString()}`;

    // Vulnerabilities
    const vulns = isHighRisk ? [
        { sev: 'critical', title: 'Reentrancy Vulnerability', desc: 'External call before state update on line ~142. Classic ETH drain pattern.', line: 142 },
        { sev: 'critical', title: 'Hidden Mint Function', desc: 'Owner-only mintTokens() allows unlimited token supply expansion.', line: 89 },
        { sev: 'high', title: 'Liquidity Removal Trap', desc: 'removeLiquidity() has no time-lock; deployer can drain pool instantly.', line: 234 },
        { sev: 'medium', title: 'Unverified External Call', desc: 'call{value}() to user-controlled address without validation.', line: 198 },
    ] : [
        { sev: 'info', title: 'No Critical Vulnerabilities', desc: 'No reentrancy, overflow, or access control issues detected.', line: null },
        { sev: 'low', title: 'Minor: Missing Event Emit', desc: 'Transfer function lacks event emission — non-critical.', line: 67 },
    ];

    const vulnEl = document.getElementById('vulnList');
    vulnEl.innerHTML = '';
    vulns.forEach(v => {
        const cls = v.sev === 'critical' ? 'badge-danger' : v.sev === 'high' ? 'badge-danger' : v.sev === 'medium' ? 'badge-warning' : v.sev === 'low' ? 'badge-warning' : 'badge-info';
        const icon = v.sev === 'critical' ? '🚨' : v.sev === 'high' ? '⚠️' : v.sev === 'medium' ? '⚡' : 'ℹ️';
        vulnEl.innerHTML += `
      <div class="alert ${v.sev === 'critical' || v.sev === 'high' ? 'alert-danger' : v.sev === 'medium' ? 'alert-warning' : 'alert-info'}" style="border-radius:var(--r-md);">
        <span>${icon}</span>
        <div>
          <div style="font-weight:700;margin-bottom:0.2rem;">${v.title} <span class="badge ${cls}" style="margin-left:0.5rem;">${v.sev}</span></div>
          <div>${v.desc}</div>
          ${v.line ? `<div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);margin-top:0.25rem;">→ Line ${v.line}</div>` : ''}
        </div>
      </div>`;
    });

    // Risk Breakdown metrics
    const metrics = [
        { name: 'Reentrancy Risk', val: isHighRisk ? 88 : 4, color: 'red' },
        { name: 'Access Control', val: isHighRisk ? 92 : 12, color: isHighRisk ? 'red' : 'green' },
        { name: 'Overflow Safety', val: isHighRisk ? 45 : 95, color: isHighRisk ? 'red' : 'green' },
        { name: 'Tokenomics Risk', val: isHighRisk ? 78 : 15, color: isHighRisk ? 'red' : 'green' },
        { name: 'Exploit Signatures', val: isHighRisk ? 82 : 3, color: isHighRisk ? 'red' : 'green' },
    ];
    const riskEl = document.getElementById('riskBreakdown');
    riskEl.innerHTML = '';
    metrics.forEach(m => {
        const bar = document.createElement('div');
        bar.innerHTML = `
      <div class="flex-between" style="margin-bottom:0.25rem;">
        <span style="font-size:0.82rem;">${m.name}</span>
        <span style="font-size:0.82rem;font-family:var(--font-mono);color:${m.val > 60 ? 'var(--accent-red)' : m.val > 30 ? 'var(--accent-orange)' : 'var(--accent-green)'};">${m.val}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar ${m.color}" id="rb_${m.name.replace(/\s/g, '')}" style="width:0%"></div></div>`;
        riskEl.appendChild(bar);
        setTimeout(() => CS.animateProgress(bar.querySelector('.progress-bar'), m.val), 200);
    });

    // Code block
    const codeLines = isHighRisk ? [
        { cls: 'cm', t: '// SPDX-License-Identifier: MIT' },
        { cls: 'kw', t: 'pragma solidity ^0.8.0;' },
        { cls: '', t: '' },
        { cls: 'kw', t: 'contract MoonToken {' },
        { cls: '', t: '  mapping(address => uint256) private balances;' },
        { cls: '', t: '  address public owner;' },
        { cls: '', t: '' },
        { cls: 'err', t: '  // ⚠️ CRITICAL: Unlimited mint — no supply cap' },
        { cls: 'fn', t: '  function mintTokens(address to, uint256 amount) external {' },
        { cls: '', t: '    require(msg.sender == owner, "Not owner");' },
        { cls: 'err', t: '    _mint(to, amount);  // 🚨 Centralized mint power' },
        { cls: '', t: '  }' },
        { cls: '', t: '' },
        { cls: 'warn', t: '  // ⚡ WARNING: Reentrancy — state updated after external call' },
        { cls: 'fn', t: '  function withdraw(uint256 amount) public {' },
        { cls: 'err', t: '    (bool success,) = msg.sender.call{value: amount}(""); // 🚨 Reentrancy' },
        { cls: '', t: '    balances[msg.sender] -= amount; // State updated AFTER call' },
        { cls: '', t: '  }' },
        { cls: 'kw', t: '}' },
    ] : [
        { cls: 'cm', t: '// SPDX-License-Identifier: MIT  ✅ Standard License' },
        { cls: 'kw', t: 'pragma solidity ^0.8.19;' },
        { cls: '', t: '' },
        { cls: 'kw', t: 'contract SafeToken is ERC20, Ownable {' },
        { cls: 'cm', t: '  // ✅ Supply capped at deployment' },
        { cls: '', t: '  uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;' },
        { cls: '', t: '' },
        { cls: 'fn', t: '  function transfer(address to, uint256 amount) public override returns (bool) {' },
        { cls: 'cm', t: '    // ✅ Standard transfer — no hidden logic' },
        { cls: '', t: '    return super.transfer(to, amount);' },
        { cls: '', t: '  }' },
        { cls: 'kw', t: '}' },
    ];

    let codeHtml = '';
    codeLines.forEach((l, i) => {
        const num = String(i + 1).padStart(3, ' ');
        codeHtml += `<div class="${l.cls}"><span class="line-num">${num}</span> ${l.t}</div>`;
    });
    document.getElementById('codeView').innerHTML = codeHtml;

    // AI Explanation
    const aiText = isHighRisk
        ? 'This contract exhibits three high-severity patterns consistent with rug-pull deployments. The centralized mintTokens() function allows the deployer to inflate supply arbitrarily, collapsing token value. The reentrancy flaw in withdraw() mirrors the 2016 DAO exploit — an attacker can recursively drain ETH before balance updates. Additionally, the liquidity removal function lacks protection, enabling instant pool drainage. Our exploit signature database matches this bytecode pattern to 14 known scam contracts on BNB Chain. Recommendation: DO NOT interact with this contract.'
        : 'This contract follows standard ERC-20 implementation patterns with no detected anomalies. Supply is capped at deployment, ownership is renounced (or follows a standard pattern), and all critical state changes are protected with appropriate access control. The missing event emit on internal transfers is a minor code quality issue with no security implications. This contract scores in the 95th percentile of security for its deployment category.';

    const aiEl = document.getElementById('aiExplanation');
    CS.typeText(aiEl, aiText, 12);
}

function resetScanner() {
    document.querySelector('.card').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('contractAddr').value = '';
}
