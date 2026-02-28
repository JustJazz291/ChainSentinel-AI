// ============================================================
// CHAINSENTINEL AI – CONTRACT FETCHER
// Fetches verified source code from block explorer APIs
// ============================================================

const axios = require('axios');

// Block explorer API endpoints per chain
const EXPLORERS = {
    eth: { base: 'https://api.etherscan.io/api', keyEnv: 'ETHERSCAN_API_KEY', name: 'Ethereum Mainnet', icon: '⟠' },
    bsc: { base: 'https://api.bscscan.com/api', keyEnv: 'BSCSCAN_API_KEY', name: 'BNB Smart Chain', icon: '🌙' },
    pol: { base: 'https://api.polygonscan.com/api', keyEnv: 'POLYGONSCAN_API_KEY', name: 'Polygon PoS', icon: '🦊' },
    arb: { base: 'https://api.arbiscan.io/api', keyEnv: 'ARBISCAN_API_KEY', name: 'Arbitrum One', icon: '🟣' },
    opt: { base: 'https://api-optimistic.etherscan.io/api', keyEnv: 'OPTIMISM_API_KEY', name: 'Optimism', icon: '🔴' },
    avax: { base: 'https://api.snowtrace.io/api', keyEnv: 'SNOWTRACE_API_KEY', name: 'Avalanche C-Chain', icon: '❄️' },
};

/**
 * fetchContractData
 * Pulls verified source code, ABI, creation tx, and basic metadata from a
 * block explorer API.
 *
 * @param {string} address  – 0x… contract address
 * @param {string} chain    – one of the keys in EXPLORERS
 * @returns {object}        – { source, abi, contractName, compilerVersion, isVerified, txCount, creator, chainInfo }
 */
async function fetchContractData(address, chain = 'eth') {
    const explorer = EXPLORERS[chain] || EXPLORERS.eth;
    const apiKey = process.env[explorer.keyEnv] || '';

    const result = {
        source: '',
        abi: [],
        contractName: 'Unknown',
        compilerVersion: 'Unknown',
        isVerified: false,
        creator: null,
        txCount: null,
        chainInfo: { name: explorer.name, icon: explorer.icon, id: chain },
        rawApiResponse: null,
        fetchError: null,
    };

    // Skip real API call if no key is configured (demo mode)
    if (!apiKey || apiKey === 'YourEtherscanKeyHere' || apiKey.startsWith('Your')) {
        console.log(`[fetcher] No real API key for ${chain} — returning demo mode data`);
        return { ...result, fetchError: 'no_api_key', isVerified: false };
    }

    try {
        // ── Source code + ABI ──────────────────────────────────────────────────
        const srcRes = await axios.get(explorer.base, {
            params: {
                module: 'contract',
                action: 'getsourcecode',
                address,
                apikey: apiKey,
            },
            timeout: 8000,
        });

        if (srcRes.data?.status === '1' && srcRes.data?.result?.length > 0) {
            const info = srcRes.data.result[0];
            if (info.SourceCode && info.SourceCode !== '') {
                result.isVerified = true;
                result.contractName = info.ContractName || 'Unknown';
                result.compilerVersion = info.CompilerVersion || 'Unknown';

                // Source can be plain text or a JSON multi-file object wrapped in {{ }}
                let src = info.SourceCode;
                if (src.startsWith('{{')) {
                    try {
                        const parsed = JSON.parse(src.slice(1, -1));
                        // Flatten all source files into one blob for pattern matching
                        src = Object.values(parsed.sources || {})
                            .map(f => f.content || '')
                            .join('\n\n');
                    } catch (_) { /* leave as-is */ }
                }
                result.source = src;

                try {
                    result.abi = JSON.parse(info.ABI || '[]');
                } catch (_) { }
            }
        }

        // ── Contract creation + creator ────────────────────────────────────────
        try {
            const creatorRes = await axios.get(explorer.base, {
                params: {
                    module: 'contract',
                    action: 'getcontractcreation',
                    contractaddresses: address,
                    apikey: apiKey,
                },
                timeout: 5000,
            });
            if (creatorRes.data?.status === '1' && creatorRes.data?.result?.length > 0) {
                result.creator = creatorRes.data.result[0].contractCreator;
            }
        } catch (_) { }

    } catch (err) {
        result.fetchError = err.message;
        console.error(`[fetcher] API error for ${address} on ${chain}:`, err.message);
    }

    return result;
}

/**
 * validateAddress
 * Basic Ethereum-style address format check.
 */
function validateAddress(addr) {
    return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/**
 * supportedChains
 * Returns metadata for all supported chains.
 */
function supportedChains() {
    return Object.entries(EXPLORERS).map(([id, info]) => ({
        id,
        name: info.name,
        icon: info.icon,
    }));
}

module.exports = { fetchContractData, validateAddress, supportedChains };
