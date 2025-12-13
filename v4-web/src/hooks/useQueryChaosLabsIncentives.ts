import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';

import type { DydxAddress } from '@/constants/wallets';

import { wrapAndLogError } from '@/lib/asyncUtils';
import { calc } from '@/lib/do';

type ChaosLabsIncentivesResponse = {
  incentivePoints: number;
  marketMakingIncentivePoints: number;
  totalFees: number;
};

export const useQueryChaosLabsIncentives = ({
  blackbottleAddress,
  season,
}: {
  blackbottleAddress?: DydxAddress;
  season?: number;
}) => {
  return useQuery({
    enabled: !!blackbottleAddress,
    queryKey: ['launch_incentives_rewards', blackbottleAddress, season],
    queryFn: wrapAndLogError(
      async (): Promise<ChaosLabsIncentivesResponse | undefined> => {
        if (!blackbottleAddress) return undefined;

        // If season is defined, fetch for a specific season
        if (season !== undefined) {
          const resp = await fetch(
            `https://cloud.chaoslabs.co/query/api/blackbottle/points/${blackbottleAddress}?n=${season}`
          );
          return resp.json();
        }

        const currentSeason: number | undefined = await calc(async () => {
          const resp = await fetch(`https://cloud.chaoslabs.co/query/api/blackbottle/season`);
          return (await resp.json()).currentSeason;
        });

        if (currentSeason == null) {
          return undefined;
        }

        const [thisSeasonResponse, thisSeasonFees] = await Promise.all([
          calc(async () => {
            return (
              await fetch(
                `https://cloud.chaoslabs.co/query/api/blackbottle/points/${blackbottleAddress}?n=${currentSeason}`
              )
            ).json();
          }),
          calc(async () => {
            return (
              await fetch(
                `https://cloud.chaoslabs.co/query/api/blackbottle/fees/${blackbottleAddress}?month=${DateTime.utc().toFormat('yyyy-MM')}`
              )
            ).json();
          }),
        ]);

        return {
          incentivePoints: thisSeasonResponse.incentivePoints ?? 0,
          marketMakingIncentivePoints: thisSeasonResponse.marketMakingIncentivePoints ?? 0,
          totalFees: thisSeasonFees.data?.[0]?.total_fees ?? 0,
        };
      },
      'LaunchIncentives/fetchPoints',
      true
    ),
  });
};
