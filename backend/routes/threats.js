// ============================================================
// CHAINSENTINEL AI – THREAT FEED ROUTES
// GET /api/threats/feed    — recent threat events
// GET /api/threats/latest  — single newest threat
// POST /api/threats/report — submit a user-reported threat
// ============================================================

const express = require('express');
const router = express.Router();

// In-memory threat log (production: replace with database/event-bus)
const threatLog = [
    {
        id: 't001',
        type: 'critical',
        icon: '🚨',
        title: 'Flash Loan Attack — Fork-XYZ Protocol',
        detail: 'Attacker exploited price oracle manipulation to drain $4.7M from Fork-XYZ lending pool via flash loan.',
        chain: 'ETH',
        contract: '0xd34f8b…d7e8',
        timestamp: new Date(Date.now() - 3 * 60000).toISOString(),  // 3 min ago
        loss: '$4.7M',
        txHash: '0xabc123…',
        source: 'ChainSentinel Detection Engine',
    },
    {
        id: 't002',
        type: 'warning',
        icon: '⚠️',
        title: 'Liquidity Drain 87% — MoonToken/ETH',
        detail: 'Deployer-controlled removeLiquidity() called without time-lock. Pool drained to near zero.',
        chain: 'BSC',
        contract: '0x99fe12…5510',
        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        loss: '$820K',
        txHash: '0xdef456…',
        source: 'Rug-pull Pattern Monitor',
    },
    {
        id: 't003',
        type: 'info',
        icon: '🔬',
        title: 'New Contract Deployed — Risk Score 12/100',
        detail: 'ERC-20 token deployed on Arbitrum. Source verified. Pattern analysis shows standard OpenZeppelin implementation.',
        chain: 'ARB',
        contract: '0x3e8cf9…902',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        loss: null,
        txHash: '0xghi789…',
        source: 'Deployment Monitor',
    },
    {
        id: 't004',
        type: 'warning',
        icon: '🎣',
        title: 'Phishing Domain Flagged — verify-mm.xyz',
        detail: 'Domain verify-mm.xyz mimicking MetaMask UI. Linked to wallet-drainer JavaScript. 47 victims reported.',
        chain: 'Multi',
        contract: null,
        timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
        loss: '$210K',
        txHash: null,
        source: 'Phishing Intelligence Feed',
    },
    {
        id: 't005',
        type: 'info',
        icon: '✅',
        title: 'Token Approval Revoke — 0x34ab…cc01',
        detail: 'Dangerous USDT approval to 0x89ab (Fake Uniswap) successfully revoked by user.',
        chain: 'POL',
        contract: '0x89ab34…def',
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        loss: null,
        txHash: '0xjkl012…',
        source: 'Wallet Guard Events',
    },
    {
        id: 't006',
        type: 'critical',
        icon: '🚨',
        title: 'Reentrancy Exploit — ShadowLend',
        detail: 'Classic re-entrancy pattern exploited in ShadowLend withdraw() before balance update. ETH drained recursively.',
        chain: 'ETH',
        contract: '0x7f4a3c…2e',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        loss: '$1.2M',
        txHash: '0xmno345…',
        source: 'ChainSentinel Detection Engine',
    },
];

// User-reported threats queue
const reportedThreats = [];

// ── GET /api/threats/feed ─────────────────────────────────────
router.get('/feed', (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const type = req.query.type;   // optional: 'critical' | 'warning' | 'info'
    const chain = req.query.chain;  // optional: 'ETH' | 'BSC' | …

    let feed = [...threatLog, ...reportedThreats];
    if (type) feed = feed.filter(t => t.type === type);
    if (chain) feed = feed.filter(t => t.chain === chain || t.chain === 'Multi');

    feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    feed = feed.slice(0, limit);

    return res.json({
        success: true,
        count: feed.length,
        data: feed,
        updatedAt: new Date().toISOString(),
    });
});

// ── GET /api/threats/latest ───────────────────────────────────
router.get('/latest', (req, res) => {
    const latest = [...threatLog].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    return res.json({ success: true, data: latest });
});

// ── POST /api/threats/report ──────────────────────────────────
router.post('/report', (req, res) => {
    const { address, chain, description, type = 'warning' } = req.body;

    if (!description) {
        return res.status(400).json({ success: false, error: 'description is required' });
    }

    const newThreat = {
        id: 'u' + Date.now(),
        type: ['critical', 'warning', 'info'].includes(type) ? type : 'warning',
        icon: type === 'critical' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️',
        title: `User Report: ${description.slice(0, 60)}`,
        detail: description,
        chain: chain || 'Unknown',
        contract: address || null,
        timestamp: new Date().toISOString(),
        loss: null,
        txHash: null,
        source: 'Community Report',
        userSubmitted: true,
    };

    reportedThreats.unshift(newThreat);
    if (reportedThreats.length > 100) reportedThreats.pop(); // cap in-memory log

    return res.status(201).json({ success: true, data: newThreat, message: 'Threat reported. Thank you for keeping the community safe!' });
});

// ── GET /api/threats/stats ────────────────────────────────────
router.get('/stats', (req, res) => {
    const all = [...threatLog, ...reportedThreats];
    return res.json({
        success: true,
        data: {
            total: all.length,
            critical: all.filter(t => t.type === 'critical').length,
            warning: all.filter(t => t.type === 'warning').length,
            info: all.filter(t => t.type === 'info').length,
            byChain: {
                ETH: all.filter(t => t.chain === 'ETH').length,
                BSC: all.filter(t => t.chain === 'BSC').length,
                ARB: all.filter(t => t.chain === 'ARB').length,
                POL: all.filter(t => t.chain === 'POL').length,
                Multi: all.filter(t => t.chain === 'Multi').length,
            },
            totalLossUSD: '$6.93M',
        },
    });
});

module.exports = router;
