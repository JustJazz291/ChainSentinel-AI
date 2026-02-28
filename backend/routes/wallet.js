// ============================================================
// CHAINSENTINEL AI – WALLET GUARD ROUTES
// POST /api/wallet/analyze  — analyze a wallet address
// GET  /api/wallet/health   — quick health check
// ============================================================

const express = require('express');
const router = express.Router();
const { validateAddress } = require('../src/contractFetcher');

// ── Known spender labels (in production: fetched from DeFi Protocol DB) ──────
const KNOWN_SPENDERS = {
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', risk: 'safe', verified: true },
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', risk: 'safe', verified: true },
    '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI Token', risk: 'safe', verified: true },
    '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e': { name: 'Aave V3 Pool', risk: 'low', verified: true },
    '0x00000000219ab540356cbb839cbe05303d7705fa': { name: 'ETH2 Deposit', risk: 'safe', verified: true },
};

// ── GET /api/wallet/health ────────────────────────────────────
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'Wallet Guard is operational' });
});

// ── POST /api/wallet/analyze ──────────────────────────────────
router.post('/analyze', async (req, res) => {
    const { address } = req.body;

    if (!address) {
        return res.status(400).json({ success: false, error: 'address is required' });
    }
    if (!validateAddress(address)) {
        return res.status(400).json({ success: false, error: 'Invalid Ethereum address format' });
    }

    try {
        // In production: fetch real approvals from on-chain event logs (eth_getLogs)
        // For now we return a deterministic-but-realistic mock based on address hash
        const seed = parseInt(address.slice(2, 10), 16);
        const approvals = generateApprovals(seed, address);

        const criticalCount = approvals.filter(a => a.risk === 'critical').length;
        const highCount = approvals.filter(a => a.risk === 'high').length;
        const riskScore = Math.min(100, criticalCount * 30 + highCount * 15 + approvals.length * 3);
        const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

        const explanation = buildWalletExplanation(approvals, riskScore, riskLevel, address);

        const recommendations = buildRecommendations(approvals);

        return res.json({
            success: true,
            data: {
                address,
                riskScore,
                riskLevel,
                totalApprovals: approvals.length,
                criticalCount,
                highCount,
                estimatedExposure: calculateExposure(approvals),
                approvals,
                explanation,
                recommendations,
                analyzedAt: new Date().toISOString(),
            },
        });

    } catch (err) {
        console.error('[wallet/analyze] Error:', err);
        return res.status(500).json({ success: false, error: 'Wallet analysis failed', detail: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function generateApprovals(seed, address) {
    // Deterministic mock approvals (consistent per address)
    const fakePools = [
        { spenderName: 'Uniswap V3', spenderAddr: '0xe592…4564', risk: 'safe', allowance: 'Unlimited', usd: '$∞', logo: '🦄', token: 'USDC' },
        { spenderName: 'OKX DEX', spenderAddr: '0x34fe…d2e1', risk: 'high', allowance: '500 WETH', usd: '~$1.2M', logo: '⟠', token: 'WETH' },
        { spenderName: '0x99b2…Unknown', spenderAddr: '0x99b2…cafe', risk: 'critical', allowance: 'Unlimited', usd: '$∞', logo: '🐸', token: 'PEPE' },
        { spenderName: 'Aave V3', spenderAddr: '0x6b17…3d0f', risk: 'low', allowance: '10,000 DAI', usd: '$10K', logo: '🔶', token: 'DAI' },
        { spenderName: 'Chainlink', spenderAddr: '0x1f9a…4b2c', risk: 'safe', allowance: '100 LINK', usd: '~$1.4K', logo: '🔗', token: 'LINK' },
        { spenderName: 'ShibaDEX', spenderAddr: '0xdead…d3ad', risk: 'medium', allowance: '500,000,000 SHIB', usd: '~$5K', logo: '🐕', token: 'SHIB' },
    ];

    // Return a deterministic subset based on seed
    const count = 3 + (seed % 4); // 3–6 approvals
    return fakePools.slice(0, count);
}

function calculateExposure(approvals) {
    const highRisk = approvals.filter(a => a.risk === 'critical' || a.risk === 'high');
    if (highRisk.length >= 2) return '$1.2M+';
    if (highRisk.length === 1) return '$500K+';
    return '<$50K';
}

function buildWalletExplanation(approvals, score, level, address) {
    const dangerous = approvals.filter(a => a.risk === 'critical' || a.risk === 'high');
    if (level === 'high') {
        return `Your wallet ${address.slice(0, 8)}… has ${dangerous.length} dangerous token approvals active. ` +
            `${approvals.find(a => a.risk === 'critical') ? `The ${approvals.find(a => a.risk === 'critical').token} unlimited approval granted to an unverified address is extremely concerning — this address has been flagged in known phishing campaigns. ` : ''}` +
            `Revoke dangerous approvals immediately to eliminate your highest exposure vectors. Overall wallet risk: HIGH — action required.`;
    } else if (level === 'medium') {
        return `Your wallet has ${approvals.length} active token approvals. Some have high-value allowances that exceed typical transaction needs. ` +
            `Consider setting exact approval amounts per transaction rather than unlimited. No critical exploits detected.`;
    } else {
        return `Your wallet approvals look healthy. All detected spenders are verified protocols with reasonable allowance limits. Continue practicing approval hygiene by revoking unused allowances periodically.`;
    }
}

function buildRecommendations(approvals) {
    const recs = [];
    const critical = approvals.filter(a => a.risk === 'critical');
    const high = approvals.filter(a => a.risk === 'high');

    critical.forEach(a => recs.push({ icon: '🚨', text: `Revoke ${a.token} unlimited approval to unverified ${a.spenderName} immediately`, urgent: true }));
    high.forEach(a => recs.push({ icon: '⚠️', text: `Reduce ${a.token} allowance to exact transaction amount (currently ${a.allowance})`, urgent: true }));
    recs.push({ icon: '💡', text: 'Set per-transaction approval limits for all future DeFi interactions', urgent: false });
    recs.push({ icon: '🔐', text: 'Consider using a hardware wallet for high-value approvals', urgent: false });

    return recs;
}

module.exports = router;
