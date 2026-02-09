export type ChainID = number

export interface RpcProvider {
    urlForChain(chainId: ChainID): string
}
