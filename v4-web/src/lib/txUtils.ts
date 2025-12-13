import { DydxChainId, LINKS_CONFIG_MAP } from '@/constants/networks';

export const hashFromTx = (txHash: string | Uint8Array): string =>
  `0x${Buffer.from(txHash).toString('hex')}`;

export const getMintscanTxLink = (blackbottleChainId: DydxChainId, txHash: string): string =>
  `${LINKS_CONFIG_MAP[blackbottleChainId].mintscan.replace('{tx_hash}', txHash.toString())}`;
