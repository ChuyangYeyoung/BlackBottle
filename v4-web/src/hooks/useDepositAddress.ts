import { selectIndexerReady, selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useQuery } from '@tanstack/react-query';

import { useAppSelector } from '@/state/appTypes';

import { useAccounts } from './useAccounts';

export const useDepositAddress = () => {
  const { blackbottleAddress } = useAccounts();
  const indexerUrl = useAppSelector(selectIndexerUrl);
  const indexerReady = useAppSelector(selectIndexerReady);

  const canQueryForDepositAddresses = blackbottleAddress != null && indexerReady;

  const {
    data: depositAddresses,
    isLoading: isLoadingDepositAddresses,
    isError: failedToFetchDepositAddresses,
    error: fetchDepositAddressesError,
  } = useQuery({
    enabled: canQueryForDepositAddresses,
    queryKey: ['turnkeyWallets', blackbottleAddress],
    queryFn: async (): Promise<{
      avalancheAddress: string;
      evmAddress: string;
      svmAddress: string;
    }> => {
      const response = await fetch(`${indexerUrl}/v4/bridging/getDepositAddress/${blackbottleAddress}`, {
        method: 'GET',
      }).then((res) => res.json());

      return response;
    },
  });

  return {
    depositAddresses,
    isLoadingDepositAddresses,
    failedToFetchDepositAddresses,
    fetchDepositAddressesError,
  };
};
