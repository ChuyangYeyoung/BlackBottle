/**
 * Offline Data Access Layer
 *
 * Provides a unified interface to access user data from the local database
 * when the application is offline or for faster loading times.
 */

const LOCAL_API_BASE = 'http://localhost:3001';

export interface WalletData {
  walletAddress: string;
  wallets: any[];
  preferences: any;
  tradingPreferences: any;
  dismissedItems: any[];
  affiliates: any;
  balances: any[];
  positions: any[];
  orders: any[];
  recentTransfers: any[];
  recentSwaps: any[];
}

export interface SyncResult {
  success: boolean;
  timestamp: string;
  synced: {
    [key: string]: number;
  };
  errors: string[];
}

export interface SyncStatus {
  wallet_address: string;
  data_type: string;
  last_sync_at: string;
  sync_status: string;
  records_synced: number;
}

/**
 * Check if the local API is available
 */
export async function isLocalApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_API_BASE}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Sync browser data (localStorage + Redux) to local database
 */
export async function syncBrowserData(data: any): Promise<SyncResult> {
  const response = await fetch(`${LOCAL_API_BASE}/sync/browser-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync browser data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Sync blockchain data (Black Bottle) to local database
 */
export async function syncBlockchainData(
  blackbottleAddress: string,
  indexerUrl?: string
): Promise<SyncResult> {
  const response = await fetch(`${LOCAL_API_BASE}/sync/blockchain-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blackbottleAddress, indexerUrl }),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync blockchain data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get sync status for a wallet
 */
export async function getSyncStatus(walletAddress: string): Promise<SyncStatus[]> {
  const response = await fetch(`${LOCAL_API_BASE}/sync/status/${walletAddress}`);

  if (!response.ok) {
    throw new Error(`Failed to get sync status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all wallet data from local database
 */
export async function getWalletData(walletAddress: string): Promise<WalletData> {
  const response = await fetch(`${LOCAL_API_BASE}/wallet/${walletAddress}`);

  if (!response.ok) {
    throw new Error(`Failed to get wallet data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get account balances from local database
 */
export async function getLocalBalances(walletAddress: string): Promise<any[]> {
  const data = await getWalletData(walletAddress);
  return data.balances;
}

/**
 * Get open positions from local database
 */
export async function getLocalPositions(walletAddress: string): Promise<any[]> {
  const data = await getWalletData(walletAddress);
  return data.positions;
}

/**
 * Get active orders from local database
 */
export async function getLocalOrders(walletAddress: string): Promise<any[]> {
  const data = await getWalletData(walletAddress);
  return data.orders;
}

/**
 * Get recent transfers from local database
 */
export async function getLocalTransfers(walletAddress: string): Promise<any[]> {
  const data = await getWalletData(walletAddress);
  return data.recentTransfers;
}

/**
 * Get recent swaps from local database
 */
export async function getLocalSwaps(walletAddress: string): Promise<any[]> {
  const data = await getWalletData(walletAddress);
  return data.recentSwaps;
}

/**
 * Get user preferences from local database
 */
export async function getLocalPreferences(walletAddress: string): Promise<any> {
  const data = await getWalletData(walletAddress);
  return data.preferences;
}

/**
 * Get trading preferences from local database
 */
export async function getLocalTradingPreferences(walletAddress: string): Promise<any> {
  const data = await getWalletData(walletAddress);
  return data.tradingPreferences;
}

/**
 * Get markets data from local database
 */
export async function getLocalMarkets(): Promise<any[]> {
  const response = await fetch(`${LOCAL_API_BASE}/markets`);

  if (!response.ok) {
    throw new Error(`Failed to get markets: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Auto-sync all data for a wallet
 * This function will sync both browser and blockchain data
 */
export async function autoSyncAllData(
  walletAddress: string,
  browserData: any,
  indexerUrl?: string
): Promise<{ browser: SyncResult; blockchain: SyncResult }> {
  console.log(`🔄 Auto-syncing all data for wallet: ${walletAddress}`);

  const results = {
    browser: null as SyncResult | null,
    blockchain: null as SyncResult | null,
  };

  // Sync browser data
  try {
    results.browser = await syncBrowserData(browserData);
    console.log('✅ Browser data synced successfully');
  } catch (err) {
    console.error('❌ Failed to sync browser data:', err);
    results.browser = {
      success: false,
      timestamp: new Date().toISOString(),
      synced: {},
      errors: [(err as Error).message],
    };
  }

  // Sync blockchain data
  try {
    results.blockchain = await syncBlockchainData(walletAddress, indexerUrl);
    console.log('✅ Blockchain data synced successfully');
  } catch (err) {
    console.error('❌ Failed to sync blockchain data:', err);
    results.blockchain = {
      success: false,
      timestamp: new Date().toISOString(),
      synced: {},
      errors: [(err as Error).message],
    };
  }

  return results;
}

/**
 * Get the timestamp of the last sync
 */
export async function getLastSyncTimestamp(
  walletAddress: string,
  dataType: 'browser_storage' | 'blockchain'
): Promise<string | null> {
  try {
    const statuses = await getSyncStatus(walletAddress);
    const status = statuses.find((s) => s.data_type === dataType);
    return status?.last_sync_at || null;
  } catch (err) {
    return null;
  }
}

/**
 * Check if data needs to be synced
 * Returns true if last sync was more than the specified interval ago
 */
export async function needsSync(
  walletAddress: string,
  dataType: 'browser_storage' | 'blockchain',
  intervalMs: number = 5 * 60 * 1000 // Default: 5 minutes
): Promise<boolean> {
  const lastSync = await getLastSyncTimestamp(walletAddress, dataType);

  if (!lastSync) {
    return true; // Never synced
  }

  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();

  return now - lastSyncTime > intervalMs;
}

/**
 * OfflineDataManager class for managing offline data access
 */
export class OfflineDataManager {
  private walletAddress: string;
  private cacheTimeout: number;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(walletAddress: string, cacheTimeout: number = 60000) {
    this.walletAddress = walletAddress;
    this.cacheTimeout = cacheTimeout;
    this.cache = new Map();
  }

  /**
   * Get data with caching
   */
  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all wallet data
   */
  async getWalletData(): Promise<WalletData> {
    return this.getCached('walletData', () => getWalletData(this.walletAddress));
  }

  /**
   * Get balances
   */
  async getBalances(): Promise<any[]> {
    return this.getCached('balances', () => getLocalBalances(this.walletAddress));
  }

  /**
   * Get positions
   */
  async getPositions(): Promise<any[]> {
    return this.getCached('positions', () => getLocalPositions(this.walletAddress));
  }

  /**
   * Get orders
   */
  async getOrders(): Promise<any[]> {
    return this.getCached('orders', () => getLocalOrders(this.walletAddress));
  }

  /**
   * Get transfers
   */
  async getTransfers(): Promise<any[]> {
    return this.getCached('transfers', () => getLocalTransfers(this.walletAddress));
  }

  /**
   * Get swaps
   */
  async getSwaps(): Promise<any[]> {
    return this.getCached('swaps', () => getLocalSwaps(this.walletAddress));
  }

  /**
   * Sync all data
   */
  async syncAll(browserData: any, indexerUrl?: string): Promise<any> {
    const result = await autoSyncAllData(this.walletAddress, browserData, indexerUrl);
    this.clearCache();
    return result;
  }

  /**
   * Check if sync is needed
   */
  async needsSync(dataType: 'browser_storage' | 'blockchain'): Promise<boolean> {
    return needsSync(this.walletAddress, dataType);
  }
}

/**
 * React Hook for offline data access (if using React)
 */
export function useOfflineData(walletAddress: string) {
  const manager = new OfflineDataManager(walletAddress);

  return {
    getWalletData: () => manager.getWalletData(),
    getBalances: () => manager.getBalances(),
    getPositions: () => manager.getPositions(),
    getOrders: () => manager.getOrders(),
    getTransfers: () => manager.getTransfers(),
    getSwaps: () => manager.getSwaps(),
    syncAll: (browserData: any, indexerUrl?: string) => manager.syncAll(browserData, indexerUrl),
    needsSync: (dataType: 'browser_storage' | 'blockchain') => manager.needsSync(dataType),
    clearCache: () => manager.clearCache(),
  };
}
