// ============================================================
// CHAINSENTINEL AI – DASHBOARD STATS ROUTE
// GET /api/dashboard/stats — aggregated platform metrics
// ============================================================

const express = require('express');
const router = express.Router();

// Simulated real-time stat base (in production: pulled from DB)
const BASE_STATS = {
    contractsScanned: 2_419_847,
    threatsDetected: 47,
    accuracyPct: 99.3,
    savedUSD: '840M',
};

let scansSinceBoot = 0;
let threatsSinceBoot = 0;

// ── GET /api/dashboard/stats ──────────────────────────────────
router.get('/stats', (req, res) => {
    // Fake incremental growth — gives a "live" feel
    const uptimeMs = process.uptime() * 1000;
    const scansGrowth = Math.floor(uptimeMs / 2000);   // ~1 scan every 2 sec
    const threatGrowth = Math.floor(uptimeMs / 60000);  // ~1 threat per min

    res.json({
        success: true,
        data: {
            contractsScanned: BASE_STATS.contractsScanned + scansGrowth,
            threatsDetected: BASE_STATS.threatsDetected + threatGrowth,
            accuracy: BASE_STATS.accuracyPct,
            savedUSD: `$${BASE_STATS.savedUSD}+`,
            chainsMonitored: 6,
            sessionScans: scansGrowth,
            lastUpdated: new Date().toISOString(),
        },
    });
});

// ── GET /api/dashboard/chains ─────────────────────────────────
router.get('/chains', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'eth', name: 'Ethereum', icon: '⟠', status: 'nominal', statusColor: 'green', threats: 4, avgBlockTime: '12s' },
            { id: 'arb', name: 'Arbitrum', icon: '🟣', status: 'nominal', statusColor: 'green', threats: 2, avgBlockTime: '0.25s' },
            { id: 'pol', name: 'Polygon', icon: '🦊', status: 'elevated', statusColor: 'yellow', threats: 7, avgBlockTime: '2s' },
            { id: 'bsc', name: 'BNB Chain', icon: '🌙', status: 'critical', statusColor: 'red', threats: 18, avgBlockTime: '3s' },
            { id: 'opt', name: 'Optimism', icon: '🔴', status: 'nominal', statusColor: 'green', threats: 1, avgBlockTime: '2s' },
            { id: 'avax', name: 'Avalanche', icon: '❄️', status: 'nominal', statusColor: 'green', threats: 3, avgBlockTime: '2s' },
        ],
        updatedAt: new Date().toISOString(),
    });
});

// ── GET /api/dashboard/recent-scans ──────────────────────────
router.get('/recent-scans', (req, res) => {
    const scans = [
        { address: '0x7f4a…3c2e', chain: 'ETH', risk: 'safe', score: 8, scannedAt: new Date(Date.now() - 2 * 60000).toISOString() },
        { address: '0xd34f…9a0c', chain: 'BSC', risk: 'high', score: 94, scannedAt: new Date(Date.now() - 5 * 60000).toISOString() },
        { address: '0x1e8b…a012', chain: 'ARB', risk: 'medium', score: 45, scannedAt: new Date(Date.now() - 12 * 60000).toISOString() },
        { address: '0x99fe…5510', chain: 'ETH', risk: 'high', score: 78, scannedAt: new Date(Date.now() - 18 * 60000).toISOString() },
        { address: '0x3e8c…f902', chain: 'POL', risk: 'safe', score: 12, scannedAt: new Date(Date.now() - 24 * 60000).toISOString() },
        { address: '0xabc1…d234', chain: 'ETH', risk: 'medium', score: 61, scannedAt: new Date(Date.now() - 31 * 60000).toISOString() },
    ];
    res.json({ success: true, data: scans });
});

module.exports = router;
