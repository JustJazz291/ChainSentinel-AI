// ============================================================
// CHAINSENTINEL AI – PHISHING SIMULATOR JS
// ============================================================

const scenarios = [
    {
        type: 'phishing-site',
        difficulty: 'Easy',
        question: 'You receive an email: "Your MetaMask wallet needs urgent verification. Click below to prevent suspension." The link goes to: metamask-offlcial.net — Is this legitimate?',
        options: ['✅ Yes — MetaMask sends these verification emails', '🚨 No — This is a phishing attempt', '🤔 Maybe — I should connect my wallet and check', '💡 Yes — "official" is in the domain name'],
        correct: 1,
        explanation: 'Phishing alert! The domain is "metamask-offlcial.net" (note the typo: "offlcial"). MetaMask never sends email verifications or threats of suspension. Connecting your wallet here would drain all funds.',
        redFlags: ['Typosquatted domain (offlcial ≠ official)', 'Urgency tactic ("prevent suspension")', 'Email from MetaMask (they don\'t email users)', 'Requests wallet connection on external site'],
    },
    {
        type: 'token-approval',
        difficulty: 'Medium',
        question: 'A new DeFi protocol "MegaYield Finance" asks for UNLIMITED USDC approval to earn 892% APY. What should you do?',
        options: ['✅ Approve — 892% APY sounds amazing!', '⚠️ Approve a small test amount first', '🚨 Reject — unlimited approval + extreme APY is a red flag', '🤔 Approve but monitor the wallet closely'],
        correct: 2,
        explanation: 'Red flags everywhere! Unlimited ERC-20 approval to an unaudited contract means they can drain ALL your USDC anytime. 892% APY is mathematically impossible to sustain legitimately — this is a classic yield farm rug pull setup.',
        redFlags: ['Unlimited token approval requested', '892% APY is unsustainable and deceptive', 'No audit links or team information', 'New protocol with no on-chain history'],
    },
    {
        type: 'airdrop-scam',
        difficulty: 'Medium',
        question: 'Your wallet received 50,000 tokens named "FREE-ETH.claim-now.xyz" worth "$12,000". To claim, you must visit the token\'s website and approve a transaction. What do you do?',
        options: ['✅ Visit the site immediately — free money!', '💡 Wait for official announcement from the project', '🚨 Ignore — this is an airdrop phishing scam', '⚠️ Try to sell the tokens on Uniswap directly'],
        correct: 2,
        explanation: 'Airdrop scam! Fake tokens are sent to wallets to lure users to phishing sites. The "claim" transaction is typically a malicious approval that drains your real assets. Trying to sell on Uniswap could also trigger approve() vulnerabilities on some tokens.',
        redFlags: ['Token name contains a domain URL', 'Unsolicited "free" high-value airdrop', 'Requires visiting external site to claim', 'Transaction approval needed for "claiming"'],
    },
    {
        type: 'contract-interaction',
        difficulty: 'Hard',
        question: 'A contract function called transferFrom() is asking for permission. The calldata shows: spender=0x00000000219ab540356cBB839Cbe05303d7705Fa, value=115792089237316195423570985008687907853269984665640564039457584007913129639935 (uint256 max). What is this?',
        options: ['✅ Normal DeFi transaction — uint256 max is common', '🚨 UNLIMITED approval — uint256 max means infinite spend limit', '🤔 A staking contract locking my tokens permanently', '💡 NFT minting fee — decimal looks big but it\'s normal'],
        correct: 1,
        explanation: 'uint256 max (2²⁵⁶ - 1) is the standard encoding for "unlimited" ERC-20 approval. This means the spender can withdraw ALL tokens of this type from your wallet forever. Always set exact amounts unless you understand the protocol deeply.',
        redFlags: ['uint256 max value = unlimited allowance', 'Always verify the spender contract', 'Check if spender is a known/audited protocol', 'Set exact amount per transaction instead'],
    },
    {
        type: 'rug-pull',
        difficulty: 'Hard',
        question: 'MoonElonDoge token: Team wallet holds 72%, locked for "6 months" via self-created lock contract, liquidity added $50K, 10,000 Telegram members, no audit. Should you invest?',
        options: ['✅ Yes — strong community, locked liquidity', '🚨 No — multiple rug pull signals detected', '⚠️ Maybe — wait for the audit results', '💡 Yes — 72% team hold means they\'re committed'],
        correct: 1,
        explanation: 'Classic rug pull signals: 72% team wallet concentration (they can dump at any time), self-created lock contract (can be bypassed), low $50K liquidity (easy to drain), and no independent audit. Only $50K of liquidity against a token marketing to thousands means a 10x sell could crash the price 90%. Walk away.',
        redFlags: ['72% team wallet concentration', 'Self-created lock contract (not Unicrypt/Team.Finance)', 'No third-party audit', 'Low absolute liquidity ($50K)', 'Meme-named token with no utility'],
    },
];

let currentIdx = 0;
let score = 0;
let correct = 0;
let wrong = 0;
let fastestTime = null;
let timer = null;
let timeRemain = 30;
let questionStart = Date.now();

document.getElementById('totalQ').textContent = scenarios.length;
document.addEventListener('DOMContentLoaded', () => renderQuestion());

function renderQuestion() {
    clearInterval(timer);
    if (currentIdx >= scenarios.length) { showResults(); return; }

    const s = scenarios[currentIdx];
    const pct = (currentIdx / scenarios.length) * 100;
    CS.animateProgress(document.getElementById('quizProgress'), pct);
    document.getElementById('currentQ').textContent = currentIdx + 1;

    const diffColor = s.difficulty === 'Easy' ? 'var(--accent-green)' : s.difficulty === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-red)';
    const diffCls = s.difficulty === 'Easy' ? 'badge-safe' : s.difficulty === 'Medium' ? 'badge-warning' : 'badge-danger';

    const card = document.getElementById('quizCard');
    card.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--sp-md); margin-bottom:var(--sp-lg);">
      <span class="badge ${diffCls}" style="font-size:0.8rem;">${s.difficulty}</span>
      <span class="badge badge-purple" style="font-size:0.8rem;">${s.type.replace('-', ' ').toUpperCase()}</span>
      <span style="margin-left:auto; font-size:0.78rem; color:var(--text-muted);">Scenario ${currentIdx + 1}/${scenarios.length}</span>
    </div>
    <h3 style="margin-bottom:var(--sp-xl); line-height:1.5; font-size:1rem; font-weight:600;">${s.question}</h3>
    <div id="optionsList">
      ${s.options.map((opt, i) => `
        <div class="quiz-option" id="opt_${i}" onclick="selectAnswer(${i})">
          <div class="opt-letter">${String.fromCharCode(65 + i)}</div>
          ${opt}
        </div>`).join('')}
    </div>`;

    // Timer
    timeRemain = 30;
    questionStart = Date.now();
    updateTimer();
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    document.getElementById('timeLeft').textContent = `⏱ ${timeRemain}s`;
    if (timeRemain <= 0) { clearInterval(timer); selectAnswer(-1); }
    timeRemain--;
}

function selectAnswer(chosen) {
    clearInterval(timer);
    const s = scenarios[currentIdx];
    const timeTaken = ((Date.now() - questionStart) / 1000).toFixed(1);
    const isCorrect = chosen === s.correct;

    // Highlight answers
    s.options.forEach((_, i) => {
        const el = document.getElementById(`opt_${i}`);
        if (!el) return;
        el.style.pointerEvents = 'none';
        if (i === s.correct) el.classList.add('correct');
        else if (i === chosen && !isCorrect) el.classList.add('wrong');
    });

    if (isCorrect) {
        correct++;
        score += Math.max(100, 300 - Math.round(parseFloat(timeTaken) * 5));
        if (fastestTime === null || parseFloat(timeTaken) < parseFloat(fastestTime)) fastestTime = timeTaken;
        CS.toast(`✅ Correct! +${Math.max(100, 300 - Math.round(parseFloat(timeTaken) * 5))} pts`, 'success');
    } else {
        wrong++;
        if (chosen === -1) CS.toast('⏰ Time ran out!', 'warning');
        else CS.toast('❌ Incorrect — see explanation below', 'danger');
    }

    // Update stats
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('statCorrect').textContent = correct;
    document.getElementById('statWrong').textContent = wrong;
    const total = correct + wrong;
    const acc = total ? Math.round((correct / total) * 100) : 0;
    document.getElementById('statAccuracy').textContent = acc + '%';
    document.getElementById('statFastest').textContent = fastestTime ? fastestTime + 's' : '—';
    CS.animateProgress(document.getElementById('statCorrectBar'), total ? (correct / scenarios.length) * 100 : 0);
    CS.animateProgress(document.getElementById('statWrongBar'), total ? (wrong / scenarios.length) * 100 : 0);

    // Show explanation
    const card = document.getElementById('quizCard');
    const redFlagHtml = s.redFlags.map(f => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;font-size:0.82rem;"><span style="color:var(--accent-red);">🚩</span><span>${f}</span></div>`).join('');
    const explDiv = document.createElement('div');
    explDiv.innerHTML = `
    <div class="divider" style="margin:var(--sp-lg) 0;"></div>
    <div class="ai-insight">
      <div class="ai-icon">🧠</div>
      <div>
        <div class="ai-insight-label">AI Explanation</div>
        <p style="margin:0 0 0.75rem; font-size:0.85rem;">${s.explanation}</p>
        <div style="font-size:0.78rem; font-weight:700; color:var(--accent-red); margin-bottom:0.4rem; letter-spacing:0.05em;">RED FLAGS DETECTED:</div>
        ${redFlagHtml}
      </div>
    </div>
    <div style="margin-top:var(--sp-lg);">
      <button class="btn btn-primary" onclick="nextQuestion()" style="width:100%;">
        ${currentIdx < scenarios.length - 1 ? '→ Next Scenario' : '🏁 See Results'}
      </button>
    </div>`;
    card.appendChild(explDiv);
}

function nextQuestion() {
    currentIdx++;
    renderQuestion();
}

function showResults() {
    document.getElementById('simLayout').style.display = 'none';
    document.getElementById('resultsPanel').style.display = 'block';
    CS.animateProgress(document.getElementById('quizProgress'), 100);

    const total = scenarios.length;
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'D';
    const icon = pct >= 80 ? '🛡️' : pct >= 60 ? '⚡' : '🎓';
    const title = pct >= 80 ? 'Excellent Security Awareness!' : pct >= 60 ? 'Good Progress — Keep Training' : 'More Training Needed';

    document.getElementById('finalIcon').textContent = icon;
    document.getElementById('finalTitle').textContent = title;
    document.getElementById('finalScore').innerHTML = `<span class="text-gradient-${pct >= 80 ? 'green' : pct >= 60 ? 'cyan' : 'purple'}">${score}</span>`;
    document.getElementById('finalSubtitle').textContent = `You correctly identified ${correct} out of ${total} scenarios (${pct}%). Grade: ${grade}`;

    document.getElementById('finalStats').innerHTML = `
    <div class="stat-card"><div style="font-size:1.5rem;">✅</div><div class="stat-value" style="color:var(--accent-green);">${correct}/${total}</div><div class="stat-label">Correct</div></div>
    <div class="stat-card"><div style="font-size:1.5rem;">🎯</div><div class="stat-value text-gradient-cyan">${pct}%</div><div class="stat-label">Accuracy</div></div>
    <div class="stat-card"><div style="font-size:1.5rem;">⚡</div><div class="stat-value" style="color:var(--accent-purple);">${fastestTime || '—'}s</div><div class="stat-label">Best Time</div></div>`;

    const aiTexts = {
        high: `Outstanding performance! You correctly flagged ${correct} of ${total} Web3 threats. Your strongest skills are in identifying phishing domains and token approval risks. Recommendation: Study advanced flash loan mechanics and cross-chain bridge attack vectors to reach expert level. Your current security awareness would protect most real-world wallets.`,
        mid: `Good attempt! You correctly identified ${correct} of ${total} threats. You show solid awareness for obvious phishing signals but struggled with the more technical contract-level risks (uint256 max approvals, tokenomics analysis). We recommend reviewing our Smart Contract Scanner to understand how risk scores are calculated.`,
        low: `Security training needed. You only identified ${correct} of ${total} threats — this puts your wallet at real risk. Common misses: trusting urgency tactics, not recognizing unlimited approvals, and missing tokenomics red flags. Start with our beginner guide and retake this simulation. Remember: in Web3, one wrong approval can drain your entire wallet permanently.`,
    };
    const aiKey = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
    CS.typeText(document.getElementById('finalAI'), aiTexts[aiKey], 14);
}
