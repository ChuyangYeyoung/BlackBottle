export enum LocalStorageKey {
  // Onboarding / Accounts
  EvmAddress = 'blackbottle.EvmAddress',
  SolAddress = 'blackbottle.SolAddress',
  DydxAddress = 'blackbottle.DydxAddress',
  OnboardingSelectedWallet = 'blackbottle.OnboardingSelectedWallet',
  OnboardingHasAcknowledgedTerms = 'blackbottle.OnboardingHasAcknowledgedTerms',
  EvmDerivedAddresses = 'blackbottle.EvmDerivedAddresses', // Deprecated
  KeplrCompliance = 'blackbottle.KeplrCompliance',
  SolDerivedAddresses = 'blackbottle.SolDerivedAddresses',

  // Gas
  SelectedGasDenom = 'blackbottle.SelectedGasDenom',

  // Notifications
  Notifications = 'blackbottle.Notifications',
  NotificationsLastUpdated = 'blackbottle.NotificationsLastUpdated',
  AppInitialized = 'blackbottle.AppInitialized',
  PushNotificationsEnabled = 'blackbottle.PushNotificationsEnabled',
  PushNotificationsLastUpdated = 'blackbottle.PushNotificationsLastUpdated',
  TransferNotifications = 'blackbottle.TransferNotifications',
  NotificationPreferences = 'blackbottle.NotificationPreferences',

  // UI State
  LastViewedMarket = 'blackbottle.LastViewedMarket',
  LastViewedSpotToken = 'blackbottle.LastViewedSpotToken',
  SelectedLocale = 'blackbottle.SelectedLocale',
  SelectedNetwork = 'blackbottle.SelectedNetwork',
  SelectedTradeLayout = 'blackbottle.SelectedTradeLayout',

  HasSeenUiRefresh = 'blackbottle.HasSeenUiRefresh',
  // Discoverability
  HasSeenElectionBannerTRUMPWIN = 'blackbottle.HasSeenElectionBannerTRUMPWIN',
  HasSeenTradeFormMessageTRUMPWIN = 'blackbottle.HasSeenTradeFormMessageTRUMPWIN',
  HasSeenSurgeBanner = 'blackbottle.HasSeenSurgeBanner',

  CustomFlags = 'blackbottle.CustomFlags',
}

export const LOCAL_STORAGE_VERSIONS = {
  [LocalStorageKey.EvmDerivedAddresses]: 'v2',
  [LocalStorageKey.SolDerivedAddresses]: 'v1',
  [LocalStorageKey.NotificationPreferences]: 'v2',
  [LocalStorageKey.TransferNotifications]: 'v1',
  [LocalStorageKey.Notifications]: 'v1',
  [LocalStorageKey.KeplrCompliance]: 'v1',
  [LocalStorageKey.SelectedTradeLayout]: 'v1',
  // TODO: version all localStorage keys
};
