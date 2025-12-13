/**
 * Browser Data Export Script
 *
 * This script should be run in the browser console to export all user data
 * from localStorage and Redux persist to the local API.
 *
 * Usage:
 * 1. Open the Black Bottle web app in your browser
 * 2. Open Developer Tools (F12)
 * 3. Copy and paste this entire script into the console
 * 4. The script will automatically extract data and send it to the local API
 */

(async function exportBrowserData() {
  const API_BASE = 'http://localhost:3001';

  console.log('🚀 Starting browser data export...');

  // ==========================================================================
  // STEP 1: Extract localStorage data
  // ==========================================================================

  const localStorageData = {};
  const blackbottleKeys = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('blackbottle')) {
      blackbottleKeys.push(key);
      try {
        const value = localStorage.getItem(key);
        localStorageData[key] = JSON.parse(value);
      } catch (err) {
        localStorageData[key] = localStorage.getItem(key);
      }
    }
  }

  console.log(`📦 Found ${blackbottleKeys.length} Black Bottle localStorage keys:`, blackbottleKeys);

  // ==========================================================================
  // STEP 2: Extract Redux persist state
  // ==========================================================================

  let reduxState = null;
  try {
    const persistRoot = localStorage.getItem('persist:root');
    if (persistRoot) {
      reduxState = JSON.parse(persistRoot);
      // Parse nested JSON strings
      Object.keys(reduxState).forEach(key => {
        if (key !== '_persist') {
          try {
            reduxState[key] = JSON.parse(reduxState[key]);
          } catch (err) {
            // Keep as-is if not JSON
          }
        }
      });
      console.log('✅ Redux state extracted successfully');
      console.log('📊 Redux state keys:', Object.keys(reduxState));
    }
  } catch (err) {
    console.warn('⚠️  Could not extract Redux state:', err);
  }

  // ==========================================================================
  // STEP 3: Extract wallet addresses
  // ==========================================================================

  const walletData = {
    evmAddress: localStorageData['blackbottle.EvmAddress'] || reduxState?.wallet?.evmAddress,
    blackbottleAddress: localStorageData['blackbottle.DydxAddress'] || reduxState?.wallet?.blackbottleAddress,
    solanaAddress: localStorageData['blackbottle.SolAddress'] || reduxState?.wallet?.solAddress,
    nobleAddress: reduxState?.wallet?.nobleAddress,
  };

  console.log('🔑 Wallet addresses:', walletData);

  // ==========================================================================
  // STEP 4: Structure data for database
  // ==========================================================================

  const exportData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',

    // Wallet information
    wallets: [],

    // User preferences
    preferences: {
      locale: localStorageData['blackbottle.SelectedLocale'],
      network: localStorageData['blackbottle.SelectedNetwork'],
      colorMode: reduxState?.appUiConfigs?.theme,
      hasAcknowledgedTerms: localStorageData['blackbottle.OnboardingHasAcknowledgedTerms'],
      notificationsEnabled: true, // Default
    },

    // Trading preferences
    tradingPreferences: {
      defaultSlippage: reduxState?.appUiConfigs?.defaultSlippage,
      tradeLayout: reduxState?.appUiConfigs?.tradeLayout,
      chartPreferences: reduxState?.tradingView,
      displayUnit: reduxState?.appUiConfigs?.displayUnit,
    },

    // Dismissed UI elements
    dismissedItems: [],

    // Affiliate data
    affiliates: reduxState?.affiliates || {},

    // Recent transfers
    transfers: reduxState?.transfers || [],

    // Recent swaps
    swaps: reduxState?.swaps || [],

    // Account UI memory (trade form state, etc.)
    accountUiMemory: reduxState?.accountUiMemory || {},

    // Raw localStorage for reference
    localStorage: localStorageData,
  };

  // Add wallet addresses
  if (walletData.evmAddress) {
    exportData.wallets.push({
      type: 'evm',
      address: walletData.evmAddress,
      chainId: localStorageData['blackbottle.EvmChainId'] || '1',
    });
  }

  if (walletData.blackbottleAddress) {
    exportData.wallets.push({
      type: 'blackbottle',
      address: walletData.blackbottleAddress,
      chainId: 'blackbottle-mainnet-1',
    });
  }

  if (walletData.solanaAddress) {
    exportData.wallets.push({
      type: 'solana',
      address: walletData.solanaAddress,
      chainId: 'mainnet-beta',
    });
  }

  if (walletData.nobleAddress) {
    exportData.wallets.push({
      type: 'cosmos',
      address: walletData.nobleAddress,
      chainId: 'noble-1',
    });
  }

  // Extract dismissed items
  if (reduxState?.dismissable) {
    const dismissed = reduxState.dismissable;
    Object.keys(dismissed).forEach(key => {
      if (dismissed[key] === true) {
        exportData.dismissedItems.push({
          key,
          dismissedAt: new Date().toISOString(),
        });
      }
    });
  }

  console.log('📋 Export data prepared:', {
    wallets: exportData.wallets.length,
    dismissedItems: exportData.dismissedItems.length,
    transfers: Array.isArray(exportData.transfers) ? exportData.transfers.length : 0,
    swaps: Array.isArray(exportData.swaps) ? exportData.swaps.length : 0,
  });

  // ==========================================================================
  // STEP 5: Send to local API
  // ==========================================================================

  try {
    const response = await fetch(`${API_BASE}/sync/browser-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Browser data exported successfully!', result);

    // Also save to file as backup
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackbottle-browser-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Backup file downloaded');

  } catch (err) {
    console.error('❌ Failed to export browser data:', err);

    // Download as file anyway
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackbottle-browser-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Data saved to file. You can manually import it later.');
  }

  return exportData;
})();
