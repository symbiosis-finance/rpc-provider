# rpc-provider

RPC provider abstraction for Ethereum and EVM-compatible chains. Supports Alchemy and custom RPC proxy services.

Works with [viem](https://viem.sh/) and [Hardhat 3](https://hardhat.org/).

## Installation

```bash
pnpm add rpc-provider
```

## Usage

### Alchemy Provider

```typescript
import { AlchemyRpcProvider } from 'rpc-provider'

const provider = await AlchemyRpcProvider.create('your-alchemy-api-key')

// Get RPC URL for Ethereum mainnet (chain ID 1)
const ethUrl = provider.urlForChain(1)
// => https://eth-mainnet.g.alchemy.com/v2/your-alchemy-api-key

// Get RPC URL for Arbitrum (chain ID 42161)
const arbUrl = provider.urlForChain(42161)
// => https://arb-mainnet.g.alchemy.com/v2/your-alchemy-api-key
```

### RPC Proxy Provider

For custom RPC proxy services that route requests by chain ID:

```typescript
import { RpcProxyProvider } from 'rpc-provider'

const provider = new RpcProxyProvider('https://my-rpc-proxy.com')

// Get RPC URL for BSC (chain ID 56)
const url = provider.urlForChain(56)
// => https://my-rpc-proxy.com/56
```

### With viem

```typescript
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { AlchemyRpcProvider } from 'rpc-provider'

const rpcProvider = await AlchemyRpcProvider.create('your-alchemy-api-key')

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcProvider.urlForChain(mainnet.id)),
})
```

### Alchemy Network Info

Query Alchemy's supported networks:

```typescript
import { AlchemyNetworksInfo } from 'rpc-provider'

// Get block explorer URL for a chain
const explorerUrl = await AlchemyNetworksInfo.explorerUrl(1)
// => https://etherscan.io

// Get full network map
const networks = await AlchemyNetworksInfo.networkMap()
```

## API

### `AlchemyRpcProvider`

#### `AlchemyRpcProvider.create(apiKey, options?)`

Creates an Alchemy RPC provider instance.

- `apiKey` - Your Alchemy API key
- `options.cachePath` - Directory for caching network metadata (default: `'./memoized'`)

Returns `Promise<AlchemyRpcProvider>`

#### `provider.urlForChain(chainId)`

Returns the Alchemy RPC URL for the given chain ID.

Throws if Alchemy doesn't support the chain.

### `RpcProxyProvider`

#### `new RpcProxyProvider(baseUrl)`

Creates an RPC proxy provider.

- `baseUrl` - Base URL of your RPC proxy service

#### `provider.urlForChain(chainId)`

Returns `${baseUrl}/${chainId}`

### `AlchemyNetworksInfo`

#### `AlchemyNetworksInfo.networkMap(cachePath?)`

Returns a `Map<ChainID, AlchemyNetworkInfo>` of all Alchemy-supported networks.

#### `AlchemyNetworksInfo.explorerUrl(chainId, cachePath?)`

Returns the block explorer URL for the given chain, or `undefined` if not supported.

### `RpcProvider` Interface

Both providers implement this interface:

```typescript
interface RpcProvider {
  urlForChain(chainId: number): string
}
```

## License

MIT
