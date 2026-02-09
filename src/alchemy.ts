import memoizeFs from 'memoize-fs'
import type { ChainID, RpcProvider } from './types.ts'

const ALCHEMY_NETWORKS_URL = 'https://app-api.alchemy.com/trpc/config.getNetworkConfig'

type AlchemyProduct = 'node-api' | 'block-timestamp-api'
type AlchemyRpcSubdomain = string

interface AlchemyNetworkInfo {
    id: string
    name: string
    chainId: string
    networkChainId: ChainID
    kebabCaseId: AlchemyRpcSubdomain
    explorerUrl: string
    blockSpeed: string
    supportedProducts: AlchemyProduct[]
    availability: 'public'
    currency: string
}

interface AlchemyNetworksResponse {
    result: { data: AlchemyNetworkInfo[] }
}

export interface AlchemyRpcProviderOptions {
    /** Directory path for caching network metadata. Defaults to './memoized' */
    cachePath?: string
}

async function fetchAlchemyNetworks(): Promise<AlchemyNetworkInfo[]> {
    const resp = await fetch(ALCHEMY_NETWORKS_URL)
    return ((await resp.json()) as AlchemyNetworksResponse).result.data
}

// Module-level cache for network map
let networkMapCache: Map<ChainID, AlchemyNetworkInfo> | null = null
let memoizer: ReturnType<typeof memoizeFs> | null = null

function getMemoizer(cachePath: string): ReturnType<typeof memoizeFs> {
    if (!memoizer) {
        memoizer = memoizeFs({ cachePath, noBody: true, cacheId: 'alchemy-networks' })
    }
    return memoizer
}

export class AlchemyNetworksInfo {
    static async networkMap(cachePath = './memoized'): Promise<Map<ChainID, AlchemyNetworkInfo>> {
        if (networkMapCache) return networkMapCache

        const memoizerInstance = getMemoizer(cachePath)
        const getAlchemyNetworks = await memoizerInstance.fn(fetchAlchemyNetworks)
        const networks = await getAlchemyNetworks()
        networkMapCache = new Map(networks.map((n) => [n.networkChainId, n]))
        return networkMapCache
    }

    static async explorerUrl(chainId: ChainID, cachePath = './memoized'): Promise<string | undefined> {
        return (await AlchemyNetworksInfo.networkMap(cachePath)).get(chainId)?.explorerUrl
    }

    /** Clear the in-memory cache. Useful for testing. */
    static clearCache(): void {
        networkMapCache = null
        memoizer = null
    }
}

export class AlchemyRpcProvider implements RpcProvider {
    networks: Map<ChainID, AlchemyRpcSubdomain>

    private constructor(
        private apiKey: string,
        networks: Map<ChainID, AlchemyNetworkInfo>,
    ) {
        this.networks = new Map(
            [...networks.values()]
                .filter((n) => n.supportedProducts.includes('node-api'))
                .map((n) => [n.networkChainId, n.kebabCaseId]),
        )
    }

    static async create(apiKey: string, options: AlchemyRpcProviderOptions = {}): Promise<AlchemyRpcProvider> {
        return new AlchemyRpcProvider(apiKey, await AlchemyNetworksInfo.networkMap(options.cachePath))
    }

    urlForChain(chainId: ChainID): string {
        const subdomain = this.networks.get(chainId)
        if (!subdomain) throw new Error(`alchemy does not support chain ${chainId}`)
        return `https://${subdomain}.g.alchemy.com/v2/${this.apiKey}`
    }
}
