# Quick Start Guide: Local Database for Offline Access

This guide will help you quickly set up and use the local database system for offline access to your Black Bottle trading data.

## What Was Built

A complete offline data system that stores:
- ✅ Browser data (localStorage, Redux state)
- ✅ Blockchain data (balances, positions, orders, transfers)
- ✅ All user preferences and trading settings
- ✅ Market configurations and price data

## Architecture

```
Browser Data + Blockchain Data → Local SQLite DB → Offline Access
```

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
cd v4-web/local-api
npm install
```

### Step 2: Initialize Database

```bash
npm run init-db
```

You should see output like:
```
Executing 50+ schema statements...
Database schema initialized successfully!

Database contains 18 tables:
  - users: 0 rows
  - user_wallets: 0 rows
  - account_balances: 0 rows
  ...
```

### Step 3: Start the Local API

```bash
npm run dev
```

You should see:
```
Local API ready on http://localhost:3001
SQLite file: /path/to/db.sqlite
```

## Usage

### Option A: Export Browser Data (Browser Console)

1. Open Black Bottle web app in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Copy and paste the entire contents of `local-api/src/export-browser-data.js`
5. Press Enter

The script will:
- Extract all localStorage and Redux data
- Send it to your local API
- Download a backup JSON file

### Option B: Sync Blockchain Data (Terminal)

If you have Node.js set up, you can sync blockchain data directly:

```bash
cd v4-web/local-api

# Replace with your actual Black Bottle address
node src/fetch-blockchain-data.js dydx1abc123...
```

For mainnet:
```bash
node src/fetch-blockchain-data.js dydx1abc123... https://indexer.dydx.trade
```

### Option C: Use API Endpoints

Sync browser data:
```bash
curl -X POST http://localhost:3001/sync/browser-data \
  -H "Content-Type: application/json" \
  -d @exported-data.json
```

Sync blockchain data:
```bash
curl -X POST http://localhost:3001/sync/blockchain-data \
  -H "Content-Type: application/json" \
  -d '{"dydxAddress": "dydx1abc123..."}'
```

Get all wallet data:
```bash
curl http://localhost:3001/wallet/dydx1abc123...
```

## Integration with Black Bottle App

### In Your React Components

```typescript
import { useOfflineData } from '@/lib/offlineDataAccess';

function TradingDashboard() {
  const walletAddress = 'dydx1abc123...';
  const offlineData = useOfflineData(walletAddress);

  // Check if we need to sync
  const needsSync = await offlineData.needsSync('blockchain');

  if (needsSync) {
    // Sync data
    await offlineData.syncAll(browserData);
  }

  // Get data for display
  const balances = await offlineData.getBalances();
  const positions = await offlineData.getPositions();
  const orders = await offlineData.getOrders();

  return (
    <div>
      <h2>Balances</h2>
      {balances.map(b => <div>{b.tokenSymbol}: {b.balance}</div>)}

      <h2>Open Positions</h2>
      {positions.map(p => <div>{p.market}: {p.size}</div>)}
    </div>
  );
}
```

### Check if Local API is Available

```typescript
import { isLocalApiAvailable } from '@/lib/offlineDataAccess';

async function checkOfflineMode() {
  const isAvailable = await isLocalApiAvailable();

  if (isAvailable) {
    console.log('✅ Local database available - using offline mode');
    // Use local data
  } else {
    console.log('⚠️  Local database not available - using remote API');
    // Use remote API
  }
}
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API health |
| POST | `/sync/browser-data` | Sync browser data |
| POST | `/sync/blockchain-data` | Sync blockchain data |
| GET | `/sync/status/:address` | Get sync status |
| GET | `/wallet/:address` | Get all wallet data |
| GET | `/markets` | Get markets data |

## Data Tables

### Core Tables
- `user_wallets` - All wallet addresses
- `user_preferences` - App settings
- `trading_preferences` - Trading settings

### Trading Data
- `account_balances` - Token balances
- `positions` - Open/closed positions
- `orders` - Order history
- `fills` - Trade executions
- `transfers` - Deposits/withdrawals
- `swaps` - Token swaps

### Reference Data
- `markets` - Market configurations
- `sync_metadata` - Sync tracking

## Viewing the Database

### Using SQLite CLI

```bash
sqlite3 v4-web/local-api/db.sqlite

# List all tables
.tables

# View table structure
.schema user_wallets

# Query data
SELECT * FROM user_wallets;
SELECT * FROM account_balances WHERE wallet_address = 'dydx1abc123...';

# Exit
.quit
```

### Using DB Browser for SQLite

1. Download from: https://sqlitebrowser.org/
2. Open `v4-web/local-api/db.sqlite`
3. Browse tables and data visually

## Troubleshooting

### "node not found" or "npm not found"

You need Node.js v22. Install from: https://nodejs.org/

Or use nvm:
```bash
nvm install 22
nvm use 22
```

### API Returns Empty Data

1. Check if data was synced:
```bash
curl http://localhost:3001/sync/status/dydx1abc123...
```

2. If no sync records, run sync again:
```bash
# Browser data
# Run export script in browser console

# Blockchain data
node src/fetch-blockchain-data.js dydx1abc123...
```

### CORS Errors

Make sure:
- API is running on `localhost:3001`
- Web app is accessing from same origin
- CORS is enabled in server (it is by default)

### Database Locked

Stop all running processes:
```bash
pkill -f "node src/server.js"
npm run dev  # Restart
```

## Next Steps

1. **Set up automatic sync**: Configure the app to sync data periodically
2. **Add offline indicator**: Show users when they're using offline data
3. **Implement sync button**: Let users manually trigger sync
4. **Add data export**: Allow users to export their data as JSON/CSV
5. **Set up background sync**: Use service workers for automatic background sync

## File Locations

```
v4-web/
├── local-api/
│   ├── src/
│   │   ├── server.js                    # Main API server
│   │   ├── init-db.js                   # Database initialization
│   │   ├── sync-browser-data.js         # Browser sync handler
│   │   ├── fetch-blockchain-data.js     # Blockchain sync
│   │   └── export-browser-data.js       # Browser export script
│   ├── schema.sql                        # Database schema
│   ├── db.sqlite                         # SQLite database (created on init)
│   ├── package.json
│   └── README.md                         # Full documentation
└── src/
    └── lib/
        └── offlineDataAccess.ts          # Frontend API client

```

## Support

For issues or questions:
1. Check the full README: `v4-web/local-api/README.md`
2. Review the database schema: `v4-web/local-api/schema.sql`
3. Check API server logs in the terminal

## Summary

You now have a complete offline data system that:
- ✅ Stores all user data locally
- ✅ Syncs browser and blockchain data
- ✅ Provides fast offline access
- ✅ Has a clean TypeScript API
- ✅ Includes automatic sync checking
- ✅ Works with the existing Black Bottle app

Enjoy your offline-capable trading app! 🚀
