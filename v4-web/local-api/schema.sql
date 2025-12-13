-- =============================================================================
-- DATABASE SCHEMA FOR OFFLINE USER DATA
-- =============================================================================
-- This schema stores both browser storage data and blockchain data locally
-- for offline access in the dYdX trading application.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CORE USER DATA
-- -----------------------------------------------------------------------------

-- Main users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- User wallet addresses
CREATE TABLE IF NOT EXISTS user_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  wallet_type TEXT NOT NULL, -- 'evm', 'solana', 'dydx', 'cosmos'
  address TEXT NOT NULL,
  chain_id TEXT, -- e.g., '1' for Ethereum mainnet, 'dydx-mainnet-1'
  is_primary BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(wallet_type, address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(address);

-- -----------------------------------------------------------------------------
-- USER PREFERENCES (from localStorage/Redux)
-- -----------------------------------------------------------------------------

-- General app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  wallet_address TEXT NOT NULL, -- Primary identifier from browser
  locale TEXT DEFAULT 'en',
  selected_network TEXT, -- 'mainnet', 'testnet'
  color_mode TEXT, -- 'light', 'dark', 'system'
  has_acknowledged_terms BOOLEAN DEFAULT 0,
  notifications_enabled BOOLEAN DEFAULT 1,
  gas_preferences TEXT, -- JSON: { priorityFee, etc }
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_wallet ON user_preferences(wallet_address);

-- Trading preferences
CREATE TABLE IF NOT EXISTS trading_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  wallet_address TEXT NOT NULL,
  default_slippage REAL DEFAULT 0.01,
  trade_layout TEXT, -- JSON: layout configuration
  chart_preferences TEXT, -- JSON: TradingView settings
  order_side_preference TEXT, -- 'buy', 'sell', or null
  display_unit TEXT DEFAULT 'ASSET', -- 'ASSET' or 'USD'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_trading_preferences_wallet ON trading_preferences(wallet_address);

-- Dismissed UI elements (from dismissable state)
CREATE TABLE IF NOT EXISTS dismissed_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  item_key TEXT NOT NULL, -- e.g., 'welcome_dialog', 'trading_tip_1'
  dismissed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(wallet_address, item_key)
);

CREATE INDEX IF NOT EXISTS idx_dismissed_items_wallet ON dismissed_items(wallet_address);

-- Affiliate data
CREATE TABLE IF NOT EXISTS affiliates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  affiliate_address TEXT,
  affiliate_metadata TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(wallet_address)
);

-- -----------------------------------------------------------------------------
-- BLOCKCHAIN DATA
-- -----------------------------------------------------------------------------

-- Account balances (multi-chain)
CREATE TABLE IF NOT EXISTS account_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  chain_id TEXT NOT NULL, -- 'dydx-mainnet-1', '1' (Ethereum), etc.
  token_symbol TEXT NOT NULL, -- 'USDC', 'DYDX', 'ETH'
  token_denom TEXT, -- IBC denom or contract address
  balance TEXT NOT NULL, -- Stored as string to preserve precision
  available_balance TEXT,
  locked_balance TEXT,
  last_updated TEXT DEFAULT (datetime('now')),
  UNIQUE(wallet_address, chain_id, token_symbol, token_denom)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_wallet ON account_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_account_balances_chain ON account_balances(chain_id);

-- Trading positions
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  position_id TEXT, -- dYdX position ID
  market TEXT NOT NULL, -- 'BTC-USD', 'ETH-USD'
  side TEXT NOT NULL, -- 'LONG', 'SHORT'
  status TEXT NOT NULL, -- 'OPEN', 'CLOSED', 'LIQUIDATED'
  size TEXT NOT NULL,
  max_size TEXT,
  entry_price TEXT,
  exit_price TEXT,
  realized_pnl TEXT,
  unrealized_pnl TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_positions_wallet ON positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions(market);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- Orders (open and historical)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  order_id TEXT NOT NULL, -- dYdX order ID
  client_id TEXT, -- Client-side order ID
  market TEXT NOT NULL,
  side TEXT NOT NULL, -- 'BUY', 'SELL'
  type TEXT NOT NULL, -- 'LIMIT', 'MARKET', 'STOP_LIMIT', 'STOP_MARKET'
  status TEXT NOT NULL, -- 'PENDING', 'OPEN', 'FILLED', 'CANCELED', 'UNTRIGGERED'
  price TEXT,
  trigger_price TEXT,
  size TEXT NOT NULL,
  remaining_size TEXT,
  post_only BOOLEAN DEFAULT 0,
  reduce_only BOOLEAN DEFAULT 0,
  time_in_force TEXT, -- 'GTT', 'IOC', 'FOK'
  good_til_block INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_wallet ON orders(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_market ON orders(market);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);

-- Fills (trade executions)
CREATE TABLE IF NOT EXISTS fills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  fill_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  market TEXT NOT NULL,
  side TEXT NOT NULL,
  size TEXT NOT NULL,
  price TEXT NOT NULL,
  fee TEXT NOT NULL,
  liquidity TEXT, -- 'TAKER', 'MAKER'
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(fill_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE INDEX IF NOT EXISTS idx_fills_wallet ON fills(wallet_address);
CREATE INDEX IF NOT EXISTS idx_fills_order ON fills(order_id);
CREATE INDEX IF NOT EXISTS idx_fills_market ON fills(market);

-- Transfers (deposits/withdrawals)
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  transfer_id TEXT, -- dYdX transfer ID
  tx_hash TEXT, -- Blockchain transaction hash
  type TEXT NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'
  status TEXT NOT NULL, -- 'PENDING', 'CONFIRMED', 'FAILED'
  from_address TEXT,
  to_address TEXT,
  from_chain TEXT,
  to_chain TEXT,
  amount TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_denom TEXT,
  fee TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transfers_wallet ON transfers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transfers_tx_hash ON transfers(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);

-- Swaps (from browser state)
CREATE TABLE IF NOT EXISTS swaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  swap_id TEXT,
  tx_hash TEXT,
  from_chain TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  from_amount TEXT NOT NULL,
  to_amount TEXT,
  estimated_to_amount TEXT,
  route_data TEXT, -- JSON: detailed swap route
  status TEXT NOT NULL, -- 'PENDING', 'SUCCESS', 'FAILED'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_swaps_wallet ON swaps(wallet_address);
CREATE INDEX IF NOT EXISTS idx_swaps_tx_hash ON swaps(tx_hash);

-- -----------------------------------------------------------------------------
-- MARKET DATA (for offline reference)
-- -----------------------------------------------------------------------------

-- Market configurations
CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id TEXT NOT NULL UNIQUE, -- 'BTC-USD', 'ETH-USD'
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL,
  tick_size TEXT NOT NULL,
  step_size TEXT NOT NULL,
  min_order_size TEXT NOT NULL,
  initial_margin_fraction TEXT,
  maintenance_margin_fraction TEXT,
  status TEXT DEFAULT 'ACTIVE',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Price snapshots (latest prices for offline mode)
CREATE TABLE IF NOT EXISTS price_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id TEXT NOT NULL,
  price TEXT NOT NULL,
  index_price TEXT,
  oracle_price TEXT,
  snapshot_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (market_id) REFERENCES markets(market_id)
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_market ON price_snapshots(market_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_time ON price_snapshots(snapshot_at);

-- -----------------------------------------------------------------------------
-- SYNC METADATA
-- -----------------------------------------------------------------------------

-- Track synchronization state
CREATE TABLE IF NOT EXISTS sync_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'browser_storage', 'balances', 'positions', 'orders', 'transfers'
  last_sync_at TEXT DEFAULT (datetime('now')),
  sync_status TEXT DEFAULT 'success', -- 'success', 'partial', 'failed'
  error_message TEXT,
  records_synced INTEGER DEFAULT 0,
  UNIQUE(wallet_address, data_type)
);

CREATE INDEX IF NOT EXISTS idx_sync_metadata_wallet ON sync_metadata(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_type ON sync_metadata(data_type);

-- -----------------------------------------------------------------------------
-- VIEWS FOR CONVENIENT QUERIES
-- -----------------------------------------------------------------------------

-- View: User portfolio summary
CREATE VIEW IF NOT EXISTS v_portfolio_summary AS
SELECT
  ab.wallet_address,
  ab.chain_id,
  COUNT(DISTINCT ab.token_symbol) as token_count,
  SUM(CAST(ab.balance AS REAL)) as total_balance_units,
  MAX(ab.last_updated) as last_updated
FROM account_balances ab
GROUP BY ab.wallet_address, ab.chain_id;

-- View: Open positions summary
CREATE VIEW IF NOT EXISTS v_open_positions AS
SELECT
  p.wallet_address,
  p.market,
  p.side,
  p.size,
  p.entry_price,
  p.unrealized_pnl,
  p.created_at
FROM positions p
WHERE p.status = 'OPEN'
ORDER BY p.created_at DESC;

-- View: Active orders
CREATE VIEW IF NOT EXISTS v_active_orders AS
SELECT
  o.wallet_address,
  o.order_id,
  o.market,
  o.side,
  o.type,
  o.status,
  o.price,
  o.size,
  o.remaining_size,
  o.created_at
FROM orders o
WHERE o.status IN ('PENDING', 'OPEN', 'UNTRIGGERED')
ORDER BY o.created_at DESC;

-- View: Recent transfers
CREATE VIEW IF NOT EXISTS v_recent_transfers AS
SELECT
  t.wallet_address,
  t.type,
  t.amount,
  t.token_symbol,
  t.from_chain,
  t.to_chain,
  t.status,
  t.tx_hash,
  t.created_at
FROM transfers t
ORDER BY t.created_at DESC;
