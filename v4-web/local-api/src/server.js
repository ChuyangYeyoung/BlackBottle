import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { initializeDatabase } from './init-db.js';
import { syncBrowserData } from './sync-browser-data.js';
import { syncBlockchainData } from './fetch-blockchain-data.js';

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'db.sqlite');

const app = express();

// Ensure DB directory exists when DB_PATH points to a folder
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database with full schema
const db = initializeDatabase(DB_PATH);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/users', (_req, res) => {
  const rows = db.prepare('select * from users order by id desc').all();
  res.json(rows);
});

app.post('/users', (req, res) => {
  const { email, name } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  try {
    const stmt = db.prepare('insert into users (email, name) values (?, ?)');
    const info = stmt.run(email, name ?? null);
    res.json({ id: info.lastInsertRowid, email, name });
  } catch (err) {
    res.status(400).json({ error: err?.message || 'failed to insert user' });
  }
});

app.get('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const row = db.prepare('select * from users where id = ?').get(id);
  if (!row) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json(row);
});

app.delete('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const stmt = db.prepare('delete from users where id = ?');
  const result = stmt.run(id);
  res.json({ deleted: result.changes > 0 });
});

// =============================================================================
// DATA SYNC ENDPOINTS
// =============================================================================

// Sync browser data (localStorage + Redux persist)
app.post('/sync/browser-data', (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.wallets || data.wallets.length === 0) {
      return res.status(400).json({ error: 'Invalid data: wallets array required' });
    }

    const result = syncBrowserData(db, data);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
});

// Get sync status for a wallet
app.get('/sync/status/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  try {
    const rows = db.prepare(`
      SELECT * FROM sync_metadata
      WHERE wallet_address = ?
      ORDER BY last_sync_at DESC
    `).all(walletAddress);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync blockchain data (Black Bottle)
app.post('/sync/blockchain-data', async (req, res) => {
  try {
    const { blackbottleAddress, indexerUrl } = req.body;

    if (!blackbottleAddress) {
      return res.status(400).json({ error: 'blackbottleAddress required' });
    }

    const result = await syncBlockchainData(
      db,
      blackbottleAddress,
      indexerUrl || 'https://indexer.v4testnet.blackbottle.trade'
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
});

// Get all wallet data for offline access
app.get('/wallet/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  try {
    const data = {
      walletAddress,
      wallets: db.prepare('SELECT * FROM user_wallets WHERE address = ?').all(walletAddress),
      preferences: db.prepare('SELECT * FROM user_preferences WHERE wallet_address = ?').get(walletAddress),
      tradingPreferences: db.prepare('SELECT * FROM trading_preferences WHERE wallet_address = ?').get(walletAddress),
      dismissedItems: db.prepare('SELECT * FROM dismissed_items WHERE wallet_address = ?').all(walletAddress),
      affiliates: db.prepare('SELECT * FROM affiliates WHERE wallet_address = ?').get(walletAddress),
      balances: db.prepare('SELECT * FROM account_balances WHERE wallet_address = ?').all(walletAddress),
      positions: db.prepare('SELECT * FROM positions WHERE wallet_address = ? AND status = ?').all(walletAddress, 'OPEN'),
      orders: db.prepare('SELECT * FROM orders WHERE wallet_address = ? AND status IN (?, ?, ?)').all(walletAddress, 'PENDING', 'OPEN', 'UNTRIGGERED'),
      recentTransfers: db.prepare('SELECT * FROM transfers WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 50').all(walletAddress),
      recentSwaps: db.prepare('SELECT * FROM swaps WHERE wallet_address = ? ORDER BY created_at DESC LIMIT 50').all(walletAddress),
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get markets data
app.get('/markets', (_req, res) => {
  try {
    const markets = db.prepare('SELECT * FROM markets ORDER BY market_id').all();
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Local API ready on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`SQLite file: ${DB_PATH}`);
});
