// ============================================================
// CHAINSENTINEL AI – CONTRACT SCAN ROUTES
// POST /api/scan/contract   — scan by address + chain
// POST /api/scan/source     — scan raw Solidity source
// GET  /api/scan/chains     — list supported chains
// ============================================================

const express = require('express');
const router = express.Router();

const { fetchContractData, validateAddress, supportedChains } = require('../src/contractFetcher');
const { analyzeContract } = require('../src/riskEngine');
const { generateAIExplanation } = require('../src/aiExplainer');

// ── GET /api/scan/chains ─────────────────────────────────────
router.get('/chains', (req, res) => {
    res.json({ success: true, chains: supportedChains() });
});

// ── POST /api/scan/contract ──────────────────────────────────
router.post('/contract', async (req, res) => {
    const { address, chain = 'eth' } = req.body;

    if (!address) {
        return res.status(400).json({ success: false, error: 'address is required' });
    }
    if (!validateAddress(address)) {
        return res.status(400).json({ success: false, error: 'Invalid Ethereum address format (must be 0x + 40 hex chars)' });
    }

    try {
        console.log(`[scan] Scanning ${address} on ${chain}…`);

        // Step 1 – Fetch contract data from block explorer
        const contractData = await fetchContractData(address, chain);

        // Step 2 – Run risk analysis
        const scanResult = analyzeContract(
            contractData.source,
            address,
            chain,
            {
                contractName: contractData.contractName,
                compilerVersion: contractData.compilerVersion,
                isVerified: contractData.isVerified,
                creator: contractData.creator,
                chainName: contractData.chainInfo.name,
            }
        );

        // Step 3 – Generate AI explanation (with OpenAI fallback)
        const explanation = await generateAIExplanation(scanResult, scanResult.explanation);

        // Step 4 – Build annotated code view (safe preview of source)
        const codePreview = buildCodePreview(
            contractData.source,
            scanResult.findings,
            contractData.contractName
        );

        // Step 5 – Return unified JSON response
        return res.json({
            success: true,
            data: {
                // Overview
                address,
                chain,
                chainInfo: contractData.chainInfo,
                contractName: contractData.contractName,
                compilerVersion: contractData.compilerVersion,
                isVerified: contractData.isVerified,
                creator: contractData.creator,

                // Risk summary
                score: scanResult.score,
                riskLevel: scanResult.riskLevel,
                isKnownMalicious: scanResult.isKnownMalicious,

                // Detailed findings
                findings: scanResult.findings,
                breakdown: scanResult.breakdown,

                // AI explanation
                explanation,

                // Code snippet (first 30 annotated lines)
                codePreview,

                // Metadata
                scannedAt: scanResult.metadata.scannedAt,
                findingCount: scanResult.metadata.findingCount,
                criticalCount: scanResult.metadata.criticalCount,
                highCount: scanResult.metadata.highCount,
            },
        });

    } catch (err) {
        console.error('[scan/contract] Error:', err);
        return res.status(500).json({ success: false, error: 'Internal scan error', detail: err.message });
    }
});

// ── POST /api/scan/source ────────────────────────────────────
router.post('/source', async (req, res) => {
    const { source, chain = 'eth' } = req.body;

    if (!source || source.trim().length < 10) {
        return res.status(400).json({ success: false, error: 'source code is required (min 10 chars)' });
    }

    try {
        console.log(`[scan] Analyzing pasted source (${source.length} chars)…`);

        const syntheticAddress = '0x' + Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16)).join('');

        const scanResult = analyzeContract(source, syntheticAddress, chain, { isVerified: true });
        const explanation = await generateAIExplanation(scanResult, scanResult.explanation);
        const codePreview = buildCodePreview(source, scanResult.findings, 'PastedContract');

        return res.json({
            success: true,
            data: {
                address: syntheticAddress,
                chain,
                isVerified: true,
                contractName: extractContractName(source) || 'PastedContract',
                compilerVersion: extractCompilerVersion(source) || 'Unknown',
                score: scanResult.score,
                riskLevel: scanResult.riskLevel,
                isKnownMalicious: false,
                findings: scanResult.findings,
                breakdown: scanResult.breakdown,
                explanation,
                codePreview,
                scannedAt: scanResult.metadata.scannedAt,
                findingCount: scanResult.metadata.findingCount,
                criticalCount: scanResult.metadata.criticalCount,
                highCount: scanResult.metadata.highCount,
            },
        });

    } catch (err) {
        console.error('[scan/source] Error:', err);
        return res.status(500).json({ success: false, error: 'Internal scan error', detail: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function buildCodePreview(source, findings, contractName) {
    if (!source || source.trim().length === 0) {
        // No source — return generic unverified stub
        return [
            { cls: 'cm', text: `// Contract: ${contractName}` },
            { cls: 'warn', text: '// ⚠️  Source code is NOT verified on explorer' },
            { cls: 'kw', text: '// Only bytecode is available — limited analysis' },
            { cls: 'cm', text: '// Deploy bytecode pattern analysis completed.' },
        ];
    }

    const findingLines = new Set(findings.filter(f => f.line).map(f => f.line));
    const lines = source.split('\n').slice(0, 35); // Show first 35 lines

    return lines.map((text, idx) => {
        const lineNo = idx + 1;
        let cls = '';
        if (text.trim().startsWith('//')) cls = 'cm';
        else if (/\bfunction\b/i.test(text)) cls = 'fn';
        else if (/\bpragma|contract|import|interface|library\b/i.test(text)) cls = 'kw';

        if (findingLines.has(lineNo)) cls = 'err';

        return { lineNo, cls, text };
    });
}

function extractContractName(source) {
    const m = source.match(/\bcontract\s+(\w+)/);
    return m ? m[1] : null;
}

function extractCompilerVersion(source) {
    const m = source.match(/pragma solidity\s+([^\s;]+)/);
    return m ? m[1] : null;
}

module.exports = router;
