// ============================================================
// CHAINSENTINEL AI – MAIN SERVER  (server.js)
// Express REST API backend
//
// Endpoints:
//   POST /api/scan/contract       – scan by on-chain address
//   POST /api/scan/source         – scan raw Solidity source
//   GET  /api/scan/chains         – list supported chains
//   GET  /api/threats/feed        – live threat events
//   GET  /api/threats/latest      – newest single event
//   POST /api/threats/report      – community threat report
//   GET  /api/threats/stats       – threat statistics
//   POST /api/wallet/analyze      – wallet approval audit
//   GET  /api/dashboard/stats     – platform KPIs
//   GET  /api/dashboard/chains    – chain network status
//   GET  /api/dashboard/recent-scans – recent scan list
//   GET  /health                  – server health probe
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ── Routes ────────────────────────────────────────────────────
const scanRoutes = require('./routes/scan');
const threatRoutes = require('./routes/threats');
const walletRoutes = require('./routes/wallet');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
    origin: '*', // In production: restrict to your frontend domain
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));   // allow pasting large Solidity files

// ── Request logger ─────────────────────────────────────────────
app.use((req, _res, next) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/scan', scanRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health probe ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'ChainSentinel AI Backend',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()) + 's',
        time: new Date().toISOString(),
        endpoints: [
            'POST /api/scan/contract',
            'POST /api/scan/source',
            'GET  /api/scan/chains',
            'GET  /api/threats/feed',
            'GET  /api/threats/latest',
            'POST /api/threats/report',
            'GET  /api/threats/stats',
            'POST /api/wallet/analyze',
            'GET  /api/dashboard/stats',
            'GET  /api/dashboard/chains',
            'GET  /api/dashboard/recent-scans',
        ],
    });
});

// ── Root ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        name: '🛡️ ChainSentinel AI API',
        version: '1.0.0',
        docs: 'GET /health for endpoint list',
        status: 'operational',
    });
});

// ── 404 handler ────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ── Global error handler ───────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err);
    res.status(500).json({ success: false, error: 'Unexpected server error', detail: err.message });
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  🛡️  ChainSentinel AI Backend');
    console.log('  ─────────────────────────────────────────');
    console.log(`  Server  →  http://localhost:${PORT}`);
    console.log(`  Health  →  http://localhost:${PORT}/health`);
    console.log('  ─────────────────────────────────────────');
    console.log('  Endpoints:');
    console.log(`    POST http://localhost:${PORT}/api/scan/contract`);
    console.log(`    POST http://localhost:${PORT}/api/scan/source`);
    console.log(`    GET  http://localhost:${PORT}/api/threats/feed`);
    console.log(`    POST http://localhost:${PORT}/api/wallet/analyze`);
    console.log(`    GET  http://localhost:${PORT}/api/dashboard/stats`);
    console.log('  ─────────────────────────────────────────');
    console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? '✅ configured' : '⚠️  not set (rule-based fallback active)'}`);
    console.log(`  Etherscan: ${process.env.ETHERSCAN_API_KEY && !process.env.ETHERSCAN_API_KEY.startsWith('Your') ? '✅ configured' : '⚠️  not set (demo mode)'}`);
    console.log('');
});

module.exports = app;
