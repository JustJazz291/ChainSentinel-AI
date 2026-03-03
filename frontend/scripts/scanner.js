// ============================================================
// CHAINSENTINEL AI – CONTRACT SCANNER JS (BACKEND-INTEGRATED)
// ============================================================

let currentTab = 'addr';

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('panelAddr').style.display = tab === 'addr' ? 'block' : 'none';
    document.getElementById('panelSrc').style.display = tab === 'src' ? 'block' : 'none';
    document.getElementById('tabAddr').className = tab === 'addr' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    document.getElementById('tabSrc').className = tab === 'src' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
}

// Malicious demo: known rug-pull address (matches backend KNOWN_MALICIOUS)
function loadDemoContract() {
    document.getElementById('contractAddr').value = '0xd34f8b8a9a0c5d42e1234f5678901234bc56d7e8';
    document.getElementById('chainSelect').value = 'bsc';
    switchTab('addr');
    CS.toast('Malicious demo loaded — known rug-pull pattern', 'warning');
}

// Safe demo: well-structured ERC-20 style contract with no obvious vulns
function loadSafeDemo() {
    const safeSrc = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}

contract SafeToken is IERC20 {
    string public name = "SafeToken";
    string public symbol = "SAFE";
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    address public owner;
    mapping(address => uint256) private _balances;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 10_000_000 * 1e18);
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "Zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(_totalSupply + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}`;

    switchTab('src');
    document.getElementById('sourceCode').value = safeSrc;
    CS.toast('Safe demo source loaded — low-risk reference contract', 'success');
}

const scanSteps = [
    { msg: 'Fetching on-chain metadata…', pct: 15 },
    { msg: 'Decompiling / parsing contract source…', pct: 30 },
    { msg: 'Running pattern-based feature extraction…', pct: 50 },
    { msg: 'Computing multi-vector risk score…', pct: 70 },
    { msg: 'Generating AI explanation…', pct: 90 },
    { msg: 'Finalizing report…', pct: 100 },
];

async function startScan() {
    const addrInput = document.getElementById('contractAddr');
    const chainSelect = document.getElementById('chainSelect');
    const sourceInput = document.getElementById('sourceCode');

    const address = (addrInput?.value || '').trim();
    const chain = chainSelect?.value || 'eth';
    const source = (sourceInput?.value || '').trim();

    try {
        document.getElementById('scanInputCard').style.display = 'none';
        document.getElementById('scanningState').style.display = 'block';
        document.getElementById('results').style.display = 'none';

        // Animate scan steps independently of backend latency
        let stepI = 0;
        const statusEl = document.getElementById('scanStatus');
        const progressEl = document.getElementById('scanProgress');
        const stepTimer = setInterval(() => {
            const s = scanSteps[Math.min(stepI, scanSteps.length - 1)];
            statusEl.textContent = s.msg;
            progressEl.style.width = s.pct + '%';
            if (stepI >= scanSteps.length - 1) {
                clearInterval(stepTimer);
            }
            stepI++;
        }, 400);

        const isSourceScan = currentTab === 'src';
        const endpoint = isSourceScan ? '/api/scan/source' : '/api/scan/contract';
        const payload = isSourceScan
            ? { source, chain }
            : { address: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f6e842', chain };

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }

        const json = await resp.json();
        if (!json.success) {
            throw new Error(json.error || 'Scan failed');
        }

        showResults(json.data);
    } catch (err) {
        console.error('Scan error:', err);
        CS.toast(`Scan failed: ${err.message}`, 'danger');
        document.getElementById('scanInputCard').style.display = 'block';
        document.getElementById('scanningState').style.display = 'none';
        document.getElementById('results').style.display = 'none';
    }
}

function showResults(data) {
    document.getElementById('scanningState').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    const score = data.score ?? 0;
    const riskLevel = data.riskLevel || 'low';
    const riskColor = riskLevel === 'high'
        ? 'var(--accent-red)'
        : riskLevel === 'medium'
            ? 'var(--accent-orange)'
            : 'var(--accent-green)';

    // Gauge
    document.getElementById('riskGauge').innerHTML = `
    <div style="font-size:4rem;font-weight:900;font-family:var(--font-mono);color:${riskColor};text-shadow:0 0 30px ${riskColor};">${score}</div>
    <div style="font-size:0.72rem;color:var(--text-muted);letter-spacing:0.08em;">RISK SCORE / 100</div>
    <div style="margin-top:0.5rem;">
      <span class="badge ${riskLevel === 'high' ? 'badge-danger' : riskLevel === 'medium' ? 'badge-warning' : 'badge-safe'}" style="font-size:0.8rem;">${riskLevel.toUpperCase()} RISK</span>
    </div>`;

    const isKnownMalicious = !!data.isKnownMalicious;
    document.getElementById('riskTitle').textContent =
        riskLevel === 'high'
            ? (isKnownMalicious ? '🚨 Known Malicious Contract Detected' : '⚠️ High-Risk Contract Detected')
            : riskLevel === 'medium'
                ? '⚠️ Moderate Risk Identified'
                : '✅ Contract Appears Low-Risk';

    document.getElementById('riskDesc').textContent =
        riskLevel === 'high'
            ? 'This contract exhibits multiple high-severity findings. Interaction is strongly discouraged and approvals should be revoked immediately.'
            : riskLevel === 'medium'
                ? 'Some suspicious patterns were detected. Review the findings and audit history carefully before interacting.'
                : 'No critical vulnerabilities detected by the analysis engine. Standard DeFi and market risks still apply.';

    const addr = data.address || '';
    document.getElementById('scannedAddr').textContent = addr ? CS.shortAddr(addr) : 'N/A';

    const chainName = data.chainInfo?.name || (data.chain || 'Unknown chain').toUpperCase();
    const scannedAt = data.scannedAt || data.metadata?.scannedAt || new Date().toISOString();
    document.getElementById('scanMeta').textContent = `${chainName} · Scanned ${new Date(scannedAt).toLocaleTimeString()}`;

    // Vulnerabilities from backend findings
    const findings = Array.isArray(data.findings) ? data.findings : [];
    const vulnEl = document.getElementById('vulnList');
    vulnEl.innerHTML = '';

    if (findings.length === 0) {
        vulnEl.innerHTML = `
      <div class="alert alert-info" style="border-radius:var(--r-md);">
        <span>✅</span>
        <div>
          <div style="font-weight:700;margin-bottom:0.2rem;">No Significant Vulnerabilities Detected</div>
          <div>The risk engine did not identify any critical or high-severity issues in this contract.</div>
        </div>
      </div>`;
    } else {
        findings.forEach(f => {
            const sev = (f.severity || 'info').toLowerCase();
            const cls = sev === 'critical' || sev === 'high'
                ? 'badge-danger'
                : sev === 'medium' || sev === 'low'
                    ? 'badge-warning'
                    : 'badge-info';
            const alertCls = sev === 'critical' || sev === 'high'
                ? 'alert-danger'
                : sev === 'medium'
                    ? 'alert-warning'
                    : 'alert-info';
            const icon = sev === 'critical'
                ? '🚨'
                : sev === 'high'
                    ? '⚠️'
                    : sev === 'medium'
                        ? '⚡'
                        : 'ℹ️';

            vulnEl.innerHTML += `
        <div class="alert ${alertCls}" style="border-radius:var(--r-md);">
          <span>${icon}</span>
          <div>
            <div style="font-weight:700;margin-bottom:0.2rem;">${f.title || 'Issue'} <span class="badge ${cls}" style="margin-left:0.5rem;">${sev}</span></div>
            <div>${f.desc || ''}</div>
            ${f.line ? `<div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);margin-top:0.25rem;">→ Line ${f.line}</div>` : ''}
          </div>
        </div>`;
        });
    }

    // Risk breakdown from backend
    const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
    const riskEl = document.getElementById('riskBreakdown');
    riskEl.innerHTML = '';

    breakdown.forEach(m => {
        const val = m.value ?? 0;
        const colorClass = (m.color || 'green').toLowerCase();
        const pctColor = val > 60 ? 'var(--accent-red)' : val > 30 ? 'var(--accent-orange)' : 'var(--accent-green)';

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
      <div class="flex-between" style="margin-bottom:0.25rem;">
        <span style="font-size:0.82rem;">${m.name}</span>
        <span style="font-size:0.82rem;font-family:var(--font-mono);color:${pctColor};">${val}%</span>
      </div>
      <div class="progress-wrap"><div class="progress-bar ${colorClass}" style="width:0%"></div></div>`;
        riskEl.appendChild(wrapper);
        const bar = wrapper.querySelector('.progress-bar');
        setTimeout(() => CS.animateProgress(bar, val), 200);
    });

    // Annotated code view from backend
    const codePreview = Array.isArray(data.codePreview) ? data.codePreview : [];
    const codeEl = document.getElementById('codeView');
    codeEl.innerHTML = '';

    if (codePreview.length === 0) {
        codeEl.innerHTML = '<div class="cm">// No verified source code available for this contract.</div>';
    } else {
        let codeHtml = '';
        codePreview.forEach((line, idx) => {
            const num = String(line.lineNo || idx + 1).padStart(3, ' ');
            const cls = line.cls || '';
            const text = line.text || '';
            codeHtml += `<div class="${cls}"><span class="line-num">${num}</span> ${text}</div>`;
        });
        codeEl.innerHTML = codeHtml;
    }

    // AI explanation (from backend AI explainer / rule-based engine)
    const aiText = data.explanation || 'No explanation available for this scan.';
    const aiEl = document.getElementById('aiExplanation');
    CS.typeText(aiEl, aiText, 14);
}

function resetScanner() {
    document.getElementById('scanInputCard').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('scanningState').style.display = 'none';
    document.getElementById('contractAddr').value = '';
    document.getElementById('sourceCode').value = '';
}

