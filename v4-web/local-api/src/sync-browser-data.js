/**
 * Browser Data Sync Handler
 * Processes browser-exported data and stores it in the local database
 */

/**
 * @param {import('better-sqlite3').Database} db
 * @param {object} data - Exported browser data
 * @returns {object} Sync result
 */
export function syncBrowserData(db, data) {
  const result = {
    success: true,
    timestamp: new Date().toISOString(),
    synced: {
      wallets: 0,
      preferences: 0,
      tradingPreferences: 0,
      dismissedItems: 0,
      affiliates: 0,
      transfers: 0,
      swaps: 0,
    },
    errors: [],
  };

  try {
    // Start a transaction for data consistency
    const transaction = db.transaction(() => {
      // Determine primary wallet address (use dYdX address as primary)
      const primaryWallet = data.wallets?.find(w => w.type === 'dydx')
        || data.wallets?.find(w => w.type === 'evm')
        || data.wallets?.[0];

      if (!primaryWallet) {
        throw new Error('No wallet address found in export data');
      }

      const walletAddress = primaryWallet.address;
      console.log(`Processing data for wallet: ${walletAddress}`);

      // ======================================================================
      // 1. Insert/Update Wallet Addresses
      // ======================================================================

      const walletStmt = db.prepare(`
        INSERT INTO user_wallets (wallet_type, address, chain_id, is_primary)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(wallet_type, address, chain_id) DO UPDATE SET
          is_primary = excluded.is_primary
      `);

      if (data.wallets && Array.isArray(data.wallets)) {
        for (const wallet of data.wallets) {
          try {
            walletStmt.run(
              wallet.type,
              wallet.address,
              wallet.chainId || null,
              wallet.address === walletAddress ? 1 : 0
            );
            result.synced.wallets++;
          } catch (err) {
            result.errors.push(`Wallet ${wallet.address}: ${err.message}`);
          }
        }
      }

      // ======================================================================
      // 2. Insert/Update User Preferences
      // ======================================================================

      if (data.preferences) {
        try {
          const prefStmt = db.prepare(`
            INSERT INTO user_preferences (
              wallet_address, locale, selected_network, color_mode,
              has_acknowledged_terms, notifications_enabled, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(wallet_address) DO UPDATE SET
              locale = excluded.locale,
              selected_network = excluded.selected_network,
              color_mode = excluded.color_mode,
              has_acknowledged_terms = excluded.has_acknowledged_terms,
              notifications_enabled = excluded.notifications_enabled,
              updated_at = excluded.updated_at
          `);

          prefStmt.run(
            walletAddress,
            data.preferences.locale || null,
            data.preferences.network || null,
            data.preferences.colorMode || null,
            data.preferences.hasAcknowledgedTerms ? 1 : 0,
            data.preferences.notificationsEnabled ? 1 : 0
          );
          result.synced.preferences++;
        } catch (err) {
          result.errors.push(`Preferences: ${err.message}`);
        }
      }

      // ======================================================================
      // 3. Insert/Update Trading Preferences
      // ======================================================================

      if (data.tradingPreferences) {
        try {
          const tradePrefStmt = db.prepare(`
            INSERT INTO trading_preferences (
              wallet_address, default_slippage, trade_layout,
              chart_preferences, display_unit, updated_at
            )
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(wallet_address) DO UPDATE SET
              default_slippage = excluded.default_slippage,
              trade_layout = excluded.trade_layout,
              chart_preferences = excluded.chart_preferences,
              display_unit = excluded.display_unit,
              updated_at = excluded.updated_at
          `);

          tradePrefStmt.run(
            walletAddress,
            data.tradingPreferences.defaultSlippage || null,
            JSON.stringify(data.tradingPreferences.tradeLayout || {}),
            JSON.stringify(data.tradingPreferences.chartPreferences || {}),
            data.tradingPreferences.displayUnit || 'ASSET'
          );
          result.synced.tradingPreferences++;
        } catch (err) {
          result.errors.push(`Trading preferences: ${err.message}`);
        }
      }

      // ======================================================================
      // 4. Insert Dismissed Items
      // ======================================================================

      if (data.dismissedItems && Array.isArray(data.dismissedItems)) {
        const dismissedStmt = db.prepare(`
          INSERT INTO dismissed_items (wallet_address, item_key, dismissed_at)
          VALUES (?, ?, ?)
          ON CONFLICT(wallet_address, item_key) DO NOTHING
        `);

        for (const item of data.dismissedItems) {
          try {
            dismissedStmt.run(
              walletAddress,
              item.key,
              item.dismissedAt || new Date().toISOString()
            );
            result.synced.dismissedItems++;
          } catch (err) {
            result.errors.push(`Dismissed item ${item.key}: ${err.message}`);
          }
        }
      }

      // ======================================================================
      // 5. Insert/Update Affiliate Data
      // ======================================================================

      if (data.affiliates && Object.keys(data.affiliates).length > 0) {
        try {
          const affiliateStmt = db.prepare(`
            INSERT INTO affiliates (wallet_address, affiliate_address, affiliate_metadata)
            VALUES (?, ?, ?)
            ON CONFLICT(wallet_address) DO UPDATE SET
              affiliate_address = excluded.affiliate_address,
              affiliate_metadata = excluded.affiliate_metadata
          `);

          affiliateStmt.run(
            walletAddress,
            data.affiliates.address || null,
            JSON.stringify(data.affiliates)
          );
          result.synced.affiliates++;
        } catch (err) {
          result.errors.push(`Affiliates: ${err.message}`);
        }
      }

      // ======================================================================
      // 6. Insert Transfers (from Redux state)
      // ======================================================================

      if (data.transfers && Array.isArray(data.transfers)) {
        const transferStmt = db.prepare(`
          INSERT INTO transfers (
            wallet_address, transfer_id, tx_hash, type, status,
            from_address, to_address, from_chain, to_chain,
            amount, token_symbol, token_denom, fee, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tx_hash) DO NOTHING
        `);

        for (const transfer of data.transfers) {
          try {
            transferStmt.run(
              walletAddress,
              transfer.id || null,
              transfer.txHash || null,
              transfer.type || 'TRANSFER',
              transfer.status || 'PENDING',
              transfer.fromAddress || null,
              transfer.toAddress || null,
              transfer.fromChainId || null,
              transfer.toChainId || null,
              transfer.amount || '0',
              transfer.token || transfer.symbol || null,
              transfer.denom || null,
              transfer.fee || null,
              transfer.createdAt || new Date().toISOString(),
              transfer.updatedAt || new Date().toISOString()
            );
            result.synced.transfers++;
          } catch (err) {
            // Skip duplicates silently
            if (!err.message.includes('UNIQUE constraint')) {
              result.errors.push(`Transfer ${transfer.id}: ${err.message}`);
            }
          }
        }
      }

      // ======================================================================
      // 7. Insert Swaps (from Redux state)
      // ======================================================================

      if (data.swaps && Array.isArray(data.swaps)) {
        const swapStmt = db.prepare(`
          INSERT INTO swaps (
            wallet_address, swap_id, tx_hash, from_chain, to_chain,
            from_token, to_token, from_amount, to_amount, estimated_to_amount,
            route_data, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(tx_hash) DO NOTHING
        `);

        for (const swap of data.swaps) {
          try {
            swapStmt.run(
              walletAddress,
              swap.id || null,
              swap.txHash || null,
              swap.fromChainId || null,
              swap.toChainId || null,
              swap.fromToken || null,
              swap.toToken || null,
              swap.fromAmount || '0',
              swap.toAmount || null,
              swap.estimatedToAmount || null,
              JSON.stringify(swap.route || {}),
              swap.status || 'PENDING',
              swap.createdAt || new Date().toISOString(),
              swap.updatedAt || new Date().toISOString()
            );
            result.synced.swaps++;
          } catch (err) {
            // Skip duplicates silently
            if (!err.message.includes('UNIQUE constraint')) {
              result.errors.push(`Swap ${swap.id}: ${err.message}`);
            }
          }
        }
      }

      // ======================================================================
      // 8. Update Sync Metadata
      // ======================================================================

      const syncMetaStmt = db.prepare(`
        INSERT INTO sync_metadata (
          wallet_address, data_type, last_sync_at, sync_status, records_synced
        )
        VALUES (?, 'browser_storage', datetime('now'), 'success', ?)
        ON CONFLICT(wallet_address, data_type) DO UPDATE SET
          last_sync_at = datetime('now'),
          sync_status = 'success',
          records_synced = excluded.records_synced
      `);

      const totalRecords = Object.values(result.synced).reduce((a, b) => a + b, 0);
      syncMetaStmt.run(walletAddress, totalRecords);

    });

    // Execute transaction
    transaction();

  } catch (err) {
    result.success = false;
    result.errors.push(`Transaction failed: ${err.message}`);
    console.error('Browser data sync failed:', err);
  }

  return result;
}

/**
 * Load browser data from a JSON file
 * @param {import('better-sqlite3').Database} db
 * @param {string} filePath - Path to the JSON export file
 */
export function loadBrowserDataFromFile(db, filePath) {
  const fs = await import('node:fs/promises');
  const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  return syncBrowserData(db, data);
}
