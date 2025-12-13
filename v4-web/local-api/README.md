# Local Database & Offline Access System

This system enables the dYdX web app to store all user data (browser storage and blockchain data) in a local SQLite database for offline access and faster loading times.

## Overview

The offline data system consists of:

1. **SQLite Database** - Local storage for all user data
2. **Express API Server** - REST API to interact with the database
3. **Browser Data Export** - Extract localStorage and Redux state
4. **Blockchain Data Fetcher** - Fetch data from dYdX Chain indexer
5. **Offline Data Access Layer** - TypeScript API for the frontend

## Architecture

```
┌─────────────────┐
│   dYdX Web App  │
│   (React/TS)    │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Local API      │◄────►│ SQLite Database  │
│  (Express)      │      │  (db.sqlite)     │
└────────┬────────┘      └──────────────────┘
         │
         │ Fetch Blockchain Data
         ▼
┌─────────────────┐
│  dYdX Indexer   │
│  API            │
└─────────────────┘
```

## Database Schema

The database includes tables for:

### User Data
- `users` - Basic user information
- `user_wallets` - Wallet addresses (EVM, dYdX, Solana, Cosmos)
- `user_preferences` - App preferences and settings
- `trading_preferences` - Trading-specific settings
- `dismissed_items` - Dismissed UI elements
- `affiliates` - Affiliate program data

### Blockchain Data
- `account_balances` - Token balances across chains
- `positions` - Open and closed trading positions
- `orders` - Order history and active orders
- `fills` - Trade execution history
- `transfers` - Deposit/withdrawal history
- `swaps` - Token swap history
- `markets` - Market configurations

### Metadata
- `sync_metadata` - Track synchronization status
- `price_snapshots` - Price data for offline reference

## Setup

### Prerequisites

- Node.js v22 (as specified in `.nvmrc`)
- npm or pnpm

### Installation

```bash
cd local-api
npm install
```

### Initialize Database

```bash
npm run init-db
```

This will create the SQLite database with all necessary tables.

### Start the API Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3001`.

## Usage

### 1. Export Browser Data

Run the browser export script in the dYdX web app console:

```javascript
// 1. Open the dYdX web app in your browser
// 2. Open Developer Tools (F12)
// 3. Go to the Console tab
// 4. Paste the contents of src/export-browser-data.js
```

This will:
- Extract all localStorage data
- Extract Redux persist state
- Send data to the local API
- Download a backup JSON file

### 2. Sync Blockchain Data

#### Via API Endpoint

```bash
curl -X POST http://localhost:3001/sync/blockchain-data \
  -H "Content-Type: application/json" \
  -d '{"dydxAddress": "dydx1abc123...", "indexerUrl": "https://indexer.v4testnet.dydx.exchange"}'
```

#### Via CLI

```bash
node src/fetch-blockchain-data.js dydx1abc123... https://indexer.v4testnet.dydx.exchange
```

### 3. Access Data from Frontend

```typescript
import { useOfflineData } from '@/lib/offlineDataAccess';

function MyComponent() {
  const { getBalances, getPositions, syncAll } = useOfflineData(walletAddress);

  // Get data from local database
  const balances = await getBalances();
  const positions = await getPositions();

  // Sync all data
  await syncAll(browserData, indexerUrl);
}
```

## API Endpoints

### Health Check
```
GET /health
```

### User Management
```
GET    /users           - Get all users
POST   /users           - Create user
GET    /users/:id       - Get user by ID
DELETE /users/:id       - Delete user
```

### Data Synchronization
```
POST /sync/browser-data     - Sync browser data (localStorage + Redux)
POST /sync/blockchain-data  - Sync blockchain data (dYdX Chain)
GET  /sync/status/:address  - Get sync status for wallet
```

### Data Access
```
GET /wallet/:address  - Get all wallet data
GET /markets          - Get markets data
```

## Data Synchronization

### Browser Data

Browser data includes:
- Wallet addresses (EVM, dYdX, Solana, Cosmos)
- User preferences (locale, network, theme)
- Trading preferences (slippage, layout, chart settings)
- Dismissed UI elements
- Affiliate data
- Recent transfers and swaps from Redux state

### Blockchain Data

Blockchain data includes:
- Account balances (USDC, DYDX, etc.)
- Open and closed positions
- Order history (filled, canceled, open)
- Trade fills (executions)
- Transfer history (deposits/withdrawals)
- Market configurations

### Automatic Sync

You can set up automatic synchronization:

```typescript
import { OfflineDataManager } from '@/lib/offlineDataAccess';

const manager = new OfflineDataManager(walletAddress);

// Check if sync is needed (default: 5 minutes)
if (await manager.needsSync('blockchain')) {
  await manager.syncAll(browserData);
}
```

## Offline Access

When the application is offline or the remote API is unavailable, the frontend can:

1. Check if local API is available:
```typescript
import { isLocalApiAvailable } from '@/lib/offlineDataAccess';

if (await isLocalApiAvailable()) {
  // Use local data
} else {
  // Show offline message
}
```

2. Retrieve cached data:
```typescript
const walletData = await getWalletData(walletAddress);
```

## Configuration

### Database Path

Set the database path via environment variable:

```bash
DB_PATH=/path/to/custom/db.sqlite npm start
```

### API Port

```bash
PORT=3002 npm start
```

### Indexer URL

When syncing blockchain data, you can specify the indexer URL:

- **Testnet**: `https://indexer.v4testnet.dydx.exchange`
- **Mainnet**: `https://indexer.dydx.trade`

## Development

### Project Structure

```
local-api/
├── src/
│   ├── server.js                  # Main Express server
│   ├── init-db.js                 # Database initialization
│   ├── sync-browser-data.js       # Browser data sync handler
│   ├── fetch-blockchain-data.js   # Blockchain data fetcher
│   └── export-browser-data.js     # Browser console script
├── schema.sql                      # Database schema definition
├── package.json
└── README.md
```

### Adding New Tables

1. Add table definition to `schema.sql`
2. Update `init-db.js` if needed
3. Add sync logic to appropriate handler
4. Update API endpoints in `server.js`
5. Update TypeScript types in `offlineDataAccess.ts`

### Testing

```bash
# Test database initialization
npm run init-db

# Test API health
curl http://localhost:3001/health

# Test browser data sync
curl -X POST http://localhost:3001/sync/browser-data \
  -H "Content-Type: application/json" \
  -d @test-data.json

# Test blockchain data sync
node src/fetch-blockchain-data.js dydx1abc123...
```

## Troubleshooting

### Database Locked

If you get "database is locked" errors:

```bash
# Close all connections to the database
pkill -f "node src/server.js"

# Restart the server
npm run dev
```

### CORS Errors

The API has CORS enabled by default. If you encounter CORS errors:

1. Ensure the API is running on `localhost:3001`
2. Check browser console for specific CORS error messages
3. The web app must be running on `localhost` (not `127.0.0.1`)

### Indexer API Errors

If blockchain data sync fails:

1. Check if the indexer URL is correct
2. Verify the dYdX address format
3. Check indexer API status: https://status.v4testnet.dydx.exchange/
4. Try using testnet indexer first for testing

### Empty Database

If queries return empty results:

1. Verify data was synced: `GET /sync/status/:address`
2. Check sync logs in server console
3. Verify wallet address format matches exactly
4. Re-sync data using sync endpoints

## Security Considerations

- The local API runs on `localhost` only (no external access)
- No authentication required (local development only)
- Never commit `db.sqlite` to version control
- Backup the database before major updates
- Do not expose sensitive keys in localStorage exports

## Performance

- SQLite provides fast local queries (< 1ms for most queries)
- Database is optimized with indexes on common query columns
- Transactions ensure data consistency
- Browser data export is asynchronous and non-blocking

## Future Enhancements

Potential improvements:
- [ ] Encryption at rest for sensitive data
- [ ] Delta sync (only sync changed data)
- [ ] Background sync worker
- [ ] Service worker integration for true offline support
- [ ] Data compression for large datasets
- [ ] Multi-wallet support with user switching
- [ ] Historical price data caching
- [ ] WebSocket support for real-time updates

## License

This local database system is part of the dYdX Chain V4 web application and follows the same AGPL-3.0 license.
