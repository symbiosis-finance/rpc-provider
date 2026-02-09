import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { RpcProxyProvider } from '../src/index.ts'

describe('RpcProxyProvider', () => {
    it('should return URL with chain ID appended', () => {
        const provider = new RpcProxyProvider('https://rpc-proxy.example.com')

        assert.equal(provider.urlForChain(1), 'https://rpc-proxy.example.com/1')
        assert.equal(provider.urlForChain(56), 'https://rpc-proxy.example.com/56')
        assert.equal(provider.urlForChain(42161), 'https://rpc-proxy.example.com/42161')
    })

    it('should handle base URL without trailing slash', () => {
        const provider = new RpcProxyProvider('https://example.com/rpc')

        assert.equal(provider.urlForChain(1), 'https://example.com/rpc/1')
    })

    it('should handle base URL with trailing slash', () => {
        const provider = new RpcProxyProvider('https://example.com/rpc/')

        // Note: trailing slash results in double slash, which may or may not be desired
        assert.equal(provider.urlForChain(1), 'https://example.com/rpc//1')
    })

    it('should work with localhost URLs', () => {
        const provider = new RpcProxyProvider('http://localhost:8545')

        assert.equal(provider.urlForChain(31337), 'http://localhost:8545/31337')
    })
})
