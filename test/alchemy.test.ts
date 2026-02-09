import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { AlchemyRpcProvider, AlchemyNetworksInfo } from '../src/index.ts'

const mockNetworkResponse = {
    result: {
        data: [
            {
                id: 'eth-mainnet',
                name: 'Ethereum Mainnet',
                chainId: '1',
                networkChainId: 1,
                kebabCaseId: 'eth-mainnet',
                explorerUrl: 'https://etherscan.io',
                blockSpeed: '12',
                supportedProducts: ['node-api', 'block-timestamp-api'],
                availability: 'public',
                currency: 'ETH',
            },
            {
                id: 'arb-mainnet',
                name: 'Arbitrum Mainnet',
                chainId: '42161',
                networkChainId: 42161,
                kebabCaseId: 'arb-mainnet',
                explorerUrl: 'https://arbiscan.io',
                blockSpeed: '0.25',
                supportedProducts: ['node-api'],
                availability: 'public',
                currency: 'ETH',
            },
            {
                id: 'some-unsupported',
                name: 'Some Network',
                chainId: '99999',
                networkChainId: 99999,
                kebabCaseId: 'some-unsupported',
                explorerUrl: 'https://example.com',
                blockSpeed: '1',
                supportedProducts: ['block-timestamp-api'], // no node-api
                availability: 'public',
                currency: 'ETH',
            },
        ],
    },
}

describe('AlchemyRpcProvider', () => {
    let originalFetch: typeof globalThis.fetch
    let fetchMock: ReturnType<typeof mock.fn>

    beforeEach(() => {
        originalFetch = globalThis.fetch
        fetchMock = mock.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockNetworkResponse),
            } as Response),
        )
        globalThis.fetch = fetchMock
        AlchemyNetworksInfo.clearCache()
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should create provider and return correct URL for supported chain', async () => {
        const provider = await AlchemyRpcProvider.create('test-api-key', {
            cachePath: '/tmp/rpc-provider-test-cache',
        })

        const url = provider.urlForChain(1)
        assert.equal(url, 'https://eth-mainnet.g.alchemy.com/v2/test-api-key')
    })

    it('should return correct URL for Arbitrum', async () => {
        const provider = await AlchemyRpcProvider.create('my-key', {
            cachePath: '/tmp/rpc-provider-test-cache',
        })

        const url = provider.urlForChain(42161)
        assert.equal(url, 'https://arb-mainnet.g.alchemy.com/v2/my-key')
    })

    it('should throw for unsupported chain', async () => {
        const provider = await AlchemyRpcProvider.create('test-key', {
            cachePath: '/tmp/rpc-provider-test-cache',
        })

        assert.throws(
            () => provider.urlForChain(12345),
            /alchemy does not support chain 12345/,
        )
    })

    it('should exclude networks without node-api support', async () => {
        const provider = await AlchemyRpcProvider.create('test-key', {
            cachePath: '/tmp/rpc-provider-test-cache',
        })

        // Chain 99999 only has block-timestamp-api, not node-api
        assert.throws(
            () => provider.urlForChain(99999),
            /alchemy does not support chain 99999/,
        )
    })

    it('should expose networks map', async () => {
        const provider = await AlchemyRpcProvider.create('test-key', {
            cachePath: '/tmp/rpc-provider-test-cache',
        })

        assert.equal(provider.networks.size, 2) // only networks with node-api
        assert.equal(provider.networks.get(1), 'eth-mainnet')
        assert.equal(provider.networks.get(42161), 'arb-mainnet')
    })
})

describe('AlchemyNetworksInfo', () => {
    let originalFetch: typeof globalThis.fetch
    let fetchMock: ReturnType<typeof mock.fn>

    beforeEach(() => {
        originalFetch = globalThis.fetch
        fetchMock = mock.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockNetworkResponse),
            } as Response),
        )
        globalThis.fetch = fetchMock
        AlchemyNetworksInfo.clearCache()
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    it('should return explorer URL for supported chain', async () => {
        const url = await AlchemyNetworksInfo.explorerUrl(1, '/tmp/rpc-provider-test-cache')
        assert.equal(url, 'https://etherscan.io')
    })

    it('should return undefined for unsupported chain', async () => {
        const url = await AlchemyNetworksInfo.explorerUrl(12345, '/tmp/rpc-provider-test-cache')
        assert.equal(url, undefined)
    })

    it('should return network map with all networks', async () => {
        const networks = await AlchemyNetworksInfo.networkMap('/tmp/rpc-provider-test-cache')

        assert.equal(networks.size, 3) // includes network without node-api
        assert.ok(networks.has(1))
        assert.ok(networks.has(42161))
        assert.ok(networks.has(99999))
    })
})
