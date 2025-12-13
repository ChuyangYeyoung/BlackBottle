/**
 * Blockchain Data Fetcher
 *
 * Fetches user data from Black Bottle, Ethereum, and Solana blockchains
 * and stores it in the local database for offline access.
 */

import Database from 'better-sqlite3';

const DEFAULT_INDEXER_API = 'https://indexer.v4testnet.blackbottle.trade';
const MAINNET_INDEXER_API = 'https://indexer.blackbottle.trade';

/**
 * Fetch data from Black Bottle Indexer API
 * @param {string} endpoint - API endpoint path
 * @param {string} baseUrl - Base URL for the indexer
 * @returns {Promise<any>}
 */
async function fetchFromIndexer(endpoint, baseUrl = DEFAULT_INDEXER_API) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch account balances from Black Bottle
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @returns {Promise<Array>}
 */
export async function fetchAccountBalances(blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API) {
  try {
    const data = await fetchFromIndexer(`/v4/addresses/${blackbottleAddress}`, indexerUrl);

    if (!data || !data.subaccounts) {
      return [];
    }

    const balances = [];

    for (const subaccount of data.subaccounts) {
      if (subaccount.equity) {
        balances.push({
          walletAddress: blackbottleAddress,
          chainId: 'blackbottle-mainnet-1',
          tokenSymbol: 'USDC',
          tokenDenom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
          balance: subaccount.equity,
          availableBalance: subaccount.freeCollateral || subaccount.equity,
          lockedBalance: '0',
        });
      }
    }

    return balances;
  } catch (err) {
    console.error(`Failed to fetch balances for ${blackbottleAddress}:`, err.message);
    return [];
  }
}

/**
 * Fetch open positions from Black Bottle
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @returns {Promise<Array>}
 */
export async function fetchPositions(blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API) {
  try {
    const data = await fetchFromIndexer(`/v4/addresses/${blackbottleAddress}`, indexerUrl);

    if (!data || !data.subaccounts) {
      return [];
    }

    const positions = [];

    for (const subaccount of data.subaccounts) {
      if (subaccount.openPerpetualPositions) {
        for (const [market, position] of Object.entries(subaccount.openPerpetualPositions)) {
          positions.push({
            walletAddress: blackbottleAddress,
            positionId: `${subaccount.address}-${market}`,
            market,
            side: parseFloat(position.size) > 0 ? 'LONG' : 'SHORT',
            status: 'OPEN',
            size: Math.abs(parseFloat(position.size)).toString(),
            maxSize: position.maxSize || position.size,
            entryPrice: position.entryPrice,
            exitPrice: null,
            realizedPnl: position.realizedPnl || '0',
            unrealizedPnl: position.unrealizedPnl || '0',
            createdAt: position.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            closedAt: null,
          });
        }
      }
    }

    return positions;
  } catch (err) {
    console.error(`Failed to fetch positions for ${blackbottleAddress}:`, err.message);
    return [];
  }
}

/**
 * Fetch orders from Black Bottle
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @param {number} limit - Number of orders to fetch
 * @returns {Promise<Array>}
 */
export async function fetchOrders(blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API, limit = 100) {
  try {
    // Fetch open orders
    const subaccountsData = await fetchFromIndexer(`/v4/addresses/${blackbottleAddress}`, indexerUrl);
    const orders = [];

    if (subaccountsData?.subaccounts) {
      for (const subaccount of subaccountsData.subaccounts) {
        // Fetch orders for each subaccount
        try {
          const ordersData = await fetchFromIndexer(
            `/v4/orders?address=${subaccount.address}&limit=${limit}`,
            indexerUrl
          );

          if (ordersData && Array.isArray(ordersData)) {
            for (const order of ordersData) {
              orders.push({
                walletAddress: blackbottleAddress,
                orderId: order.id,
                clientId: order.clientId || null,
                market: order.ticker || order.market,
                side: order.side,
                type: order.type,
                status: order.status,
                price: order.price || null,
                triggerPrice: order.triggerPrice || null,
                size: order.size,
                remainingSize: order.remainingSize || order.size,
                postOnly: order.postOnly ? 1 : 0,
                reduceOnly: order.reduceOnly ? 1 : 0,
                timeInForce: order.timeInForce || null,
                goodTilBlock: order.goodTilBlock || null,
                createdAt: order.createdAt || new Date().toISOString(),
                updatedAt: order.updatedAt || new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch orders for subaccount ${subaccount.address}:`, err.message);
        }
      }
    }

    return orders;
  } catch (err) {
    console.error(`Failed to fetch orders for ${blackbottleAddress}:`, err.message);
    return [];
  }
}

/**
 * Fetch fills (trade history) from Black Bottle
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @param {number} limit - Number of fills to fetch
 * @returns {Promise<Array>}
 */
export async function fetchFills(blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API, limit = 100) {
  try {
    const data = await fetchFromIndexer(
      `/v4/fills?address=${blackbottleAddress}&limit=${limit}`,
      indexerUrl
    );

    if (!data || !data.fills) {
      return [];
    }

    return data.fills.map(fill => ({
      walletAddress: blackbottleAddress,
      fillId: fill.id,
      orderId: fill.orderId,
      market: fill.market || fill.ticker,
      side: fill.side,
      size: fill.size,
      price: fill.price,
      fee: fill.fee || '0',
      liquidity: fill.liquidity || fill.type,
      createdAt: fill.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`Failed to fetch fills for ${blackbottleAddress}:`, err.message);
    return [];
  }
}

/**
 * Fetch transfers from Black Bottle
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @param {number} limit - Number of transfers to fetch
 * @returns {Promise<Array>}
 */
export async function fetchTransfers(blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API, limit = 100) {
  try {
    const data = await fetchFromIndexer(
      `/v4/transfers?address=${blackbottleAddress}&limit=${limit}`,
      indexerUrl
    );

    if (!data || !data.transfers) {
      return [];
    }

    return data.transfers.map(transfer => ({
      walletAddress: blackbottleAddress,
      transferId: transfer.id,
      txHash: transfer.transactionHash || null,
      type: transfer.type || 'TRANSFER',
      status: transfer.status || 'CONFIRMED',
      fromAddress: transfer.sender?.address || null,
      toAddress: transfer.recipient?.address || null,
      fromChain: transfer.sender?.chain || 'blackbottle-mainnet-1',
      toChain: transfer.recipient?.chain || 'blackbottle-mainnet-1',
      amount: transfer.size || transfer.amount || '0',
      tokenSymbol: transfer.symbol || 'USDC',
      tokenDenom: transfer.denom || null,
      fee: transfer.fee || null,
      createdAt: transfer.createdAt || new Date().toISOString(),
      updatedAt: transfer.updatedAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.error(`Failed to fetch transfers for ${blackbottleAddress}:`, err.message);
    return [];
  }
}

/**
 * Fetch market configurations from Black Bottle
 * @param {string} indexerUrl - Indexer API base URL
 * @returns {Promise<Array>}
 */
export async function fetchMarkets(indexerUrl = DEFAULT_INDEXER_API) {
  try {
    const data = await fetchFromIndexer('/v4/perpetualMarkets', indexerUrl);

    if (!data || !data.markets) {
      return [];
    }

    return Object.entries(data.markets).map(([marketId, market]) => ({
      marketId,
      baseAsset: market.baseAsset || marketId.split('-')[0],
      quoteAsset: market.quoteAsset || marketId.split('-')[1] || 'USD',
      tickSize: market.tickSize || market.priceChange24H,
      stepSize: market.stepSize || market.quantum,
      minOrderSize: market.minOrderSize || market.stepSize,
      initialMarginFraction: market.initialMarginFraction || null,
      maintenanceMarginFraction: market.maintenanceMarginFraction || null,
      status: market.status || 'ACTIVE',
    }));
  } catch (err) {
    console.error('Failed to fetch markets:', err.message);
    return [];
  }
}

/**
 * Sync all blockchain data for a given wallet address
 * @param {Database} db - SQLite database instance
 * @param {string} blackbottleAddress - Black Bottle account address
 * @param {string} indexerUrl - Indexer API base URL
 * @returns {Promise<object>} Sync result
 */
export async function syncBlockchainData(db, blackbottleAddress, indexerUrl = DEFAULT_INDEXER_API) {
  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    synced: {
      balances: 0,
      positions: 0,
      orders: 0,
      fills: 0,
      transfers: 0,
      markets: 0,
    },
    errors: [],
  };

  console.log(`\n🔗 Syncing blockchain data for: ${blackbottleAddress}`);
  console.log(`📡 Using indexer: ${indexerUrl}\n`);

  try {
    // Fetch all data in parallel
    const [balances, positions, orders, fills, transfers, markets] = await Promise.all([
      fetchAccountBalances(blackbottleAddress, indexerUrl),
      fetchPositions(blackbottleAddress, indexerUrl),
      fetchOrders(blackbottleAddress, indexerUrl),
      fetchFills(blackbottleAddress, indexerUrl),
      fetchTransfers(blackbottleAddress, indexerUrl),
      fetchMarkets(indexerUrl),
    ]);

    console.log(`✅ Fetched data:
  - Balances: ${balances.length}
  - Positions: ${positions.length}
  - Orders: ${orders.length}
  - Fills: ${fills.length}
  - Transfers: ${transfers.length}
  - Markets: ${markets.length}
`);

    // Insert data into database
    const transaction = db.transaction(() => {
      // Insert balances
      const balanceStmt = db.prepare(`
        INSERT INTO account_balances (
          wallet_address, chain_id, token_symbol, token_denom,
          balance, available_balance, locked_balance, last_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(wallet_address, chain_id, token_symbol, token_denom) DO UPDATE SET
          balance = excluded.balance,
          available_balance = excluded.available_balance,
          locked_balance = excluded.locked_balance,
          last_updated = excluded.last_updated
      `);

      for (const balance of balances) {
        try {
          balanceStmt.run(
            balance.walletAddress,
            balance.chainId,
            balance.tokenSymbol,
            balance.tokenDenom,
            balance.balance,
            balance.availableBalance,
            balance.lockedBalance
          );
          result.synced.balances++;
        } catch (err) {
          result.errors.push(`Balance: ${err.message}`);
        }
      }

      // Insert positions
      const positionStmt = db.prepare(`
        INSERT INTO positions (
          wallet_address, position_id, market, side, status,
          size, max_size, entry_price, exit_price, realized_pnl, unrealized_pnl,
          created_at, updated_at, closed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(wallet_address, position_id) DO UPDATE SET
          size = excluded.size,
          unrealized_pnl = excluded.unrealized_pnl,
          updated_at = excluded.updated_at
      `);

      for (const position of positions) {
        try {
          positionStmt.run(
            position.walletAddress,
            position.positionId,
            position.market,
            position.side,
            position.status,
            position.size,
            position.maxSize,
            position.entryPrice,
            position.exitPrice,
            position.realizedPnl,
            position.unrealizedPnl,
            position.createdAt,
            position.updatedAt,
            position.closedAt
          );
          result.synced.positions++;
        } catch (err) {
          result.errors.push(`Position ${position.positionId}: ${err.message}`);
        }
      }

      // Insert orders
      const orderStmt = db.prepare(`
        INSERT INTO orders (
          wallet_address, order_id, client_id, market, side, type, status,
          price, trigger_price, size, remaining_size, post_only, reduce_only,
          time_in_force, good_til_block, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET
          status = excluded.status,
          remaining_size = excluded.remaining_size,
          updated_at = excluded.updated_at
      `);

      for (const order of orders) {
        try {
          orderStmt.run(
            order.walletAddress,
            order.orderId,
            order.clientId,
            order.market,
            order.side,
            order.type,
            order.status,
            order.price,
            order.triggerPrice,
            order.size,
            order.remainingSize,
            order.postOnly,
            order.reduceOnly,
            order.timeInForce,
            order.goodTilBlock,
            order.createdAt,
            order.updatedAt
          );
          result.synced.orders++;
        } catch (err) {
          if (!err.message.includes('UNIQUE constraint')) {
            result.errors.push(`Order ${order.orderId}: ${err.message}`);
          }
        }
      }

      // Insert fills
      const fillStmt = db.prepare(`
        INSERT INTO fills (
          wallet_address, fill_id, order_id, market, side,
          size, price, fee, liquidity, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(fill_id) DO NOTHING
      `);

      for (const fill of fills) {
        try {
          fillStmt.run(
            fill.walletAddress,
            fill.fillId,
            fill.orderId,
            fill.market,
            fill.side,
            fill.size,
            fill.price,
            fill.fee,
            fill.liquidity,
            fill.createdAt
          );
          result.synced.fills++;
        } catch (err) {
          if (!err.message.includes('UNIQUE constraint')) {
            result.errors.push(`Fill ${fill.fillId}: ${err.message}`);
          }
        }
      }

      // Insert transfers
      const transferStmt = db.prepare(`
        INSERT INTO transfers (
          wallet_address, transfer_id, tx_hash, type, status,
          from_address, to_address, from_chain, to_chain,
          amount, token_symbol, token_denom, fee, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(tx_hash) DO UPDATE SET
          status = excluded.status,
          updated_at = excluded.updated_at
      `);

      for (const transfer of transfers) {
        try {
          transferStmt.run(
            transfer.walletAddress,
            transfer.transferId,
            transfer.txHash,
            transfer.type,
            transfer.status,
            transfer.fromAddress,
            transfer.toAddress,
            transfer.fromChain,
            transfer.toChain,
            transfer.amount,
            transfer.tokenSymbol,
            transfer.tokenDenom,
            transfer.fee,
            transfer.createdAt,
            transfer.updatedAt
          );
          result.synced.transfers++;
        } catch (err) {
          if (!err.message.includes('UNIQUE constraint')) {
            result.errors.push(`Transfer ${transfer.transferId}: ${err.message}`);
          }
        }
      }

      // Insert markets
      const marketStmt = db.prepare(`
        INSERT INTO markets (
          market_id, base_asset, quote_asset, tick_size, step_size,
          min_order_size, initial_margin_fraction, maintenance_margin_fraction,
          status, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(market_id) DO UPDATE SET
          tick_size = excluded.tick_size,
          step_size = excluded.step_size,
          min_order_size = excluded.min_order_size,
          initial_margin_fraction = excluded.initial_margin_fraction,
          maintenance_margin_fraction = excluded.maintenance_margin_fraction,
          status = excluded.status,
          updated_at = excluded.updated_at
      `);

      for (const market of markets) {
        try {
          marketStmt.run(
            market.marketId,
            market.baseAsset,
            market.quoteAsset,
            market.tickSize,
            market.stepSize,
            market.minOrderSize,
            market.initialMarginFraction,
            market.maintenanceMarginFraction,
            market.status
          );
          result.synced.markets++;
        } catch (err) {
          result.errors.push(`Market ${market.marketId}: ${err.message}`);
        }
      }

      // Update sync metadata
      const syncMetaStmt = db.prepare(`
        INSERT INTO sync_metadata (
          wallet_address, data_type, last_sync_at, sync_status, records_synced
        )
        VALUES (?, 'blockchain', datetime('now'), 'success', ?)
        ON CONFLICT(wallet_address, data_type) DO UPDATE SET
          last_sync_at = datetime('now'),
          sync_status = 'success',
          records_synced = excluded.records_synced
      `);

      const totalRecords = Object.values(result.synced).reduce((a, b) => a + b, 0);
      syncMetaStmt.run(blackbottleAddress, totalRecords);
    });

    // Execute transaction
    transaction();

    console.log(`✅ Blockchain data synced successfully!\n`);

  } catch (err) {
    result.success = false;
    result.errors.push(`Sync failed: ${err.message}`);
    console.error('❌ Blockchain data sync failed:', err);
  }

  return result;
}

/**
 * CLI Usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const blackbottleAddress = process.argv[2];
  const indexerUrl = process.argv[3] || DEFAULT_INDEXER_API;
  const dbPath = process.env.DB_PATH || './db.sqlite';

  if (!blackbottleAddress) {
    console.error('Usage: node fetch-blockchain-data.js <blackbottle_address> [indexer_url]');
    console.error('Example: node fetch-blockchain-data.js blackbottle1abc123... https://indexer.v4testnet.blackbottle.trade');
    process.exit(1);
  }

  const db = new Database(dbPath);
  const result = await syncBlockchainData(db, blackbottleAddress, indexerUrl);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}
