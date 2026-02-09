import type { ChainID, RpcProvider } from './types.ts'

export class RpcProxyProvider implements RpcProvider {
    constructor(private baseUrl: string) {}

    urlForChain(chainId: ChainID): string {
        return `${this.baseUrl}/${chainId}`
    }
}
