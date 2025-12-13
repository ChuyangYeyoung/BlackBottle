import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferAssetRelease } from '@skip-go/client';

import { TokenForTransfer } from '@/constants/tokens';
import { DydxAddress } from '@/constants/wallets';

export type Deposit = {
  id: string;
  type: 'deposit';
  txHash: string;
  chainId: string;
  status: 'pending' | 'success' | 'error';
  token: TokenForTransfer;
  tokenAmount: string; // raw and unformatted amount
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantDeposit: boolean;
  explorerLink?: string;
  updatedAt?: number;
};

export type WithdrawSubtransaction = {
  txHash?: string; // Optional due to not knowing the txHash until time of broadcast. (Withdraws may have several broadcasted transactions)
  chainId: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  explorerLink?: string;
};

export type Withdraw = {
  id: string;
  type: 'withdraw';
  transactions: WithdrawSubtransaction[];
  estimatedAmountUsd: string;
  finalAmountUsd?: string;
  isInstantWithdraw: boolean;
  destinationChainId: string;
  transferAssetRelease: TransferAssetRelease | null | undefined; // Where the asset was transferred to
  status: 'pending' | 'success' | 'error';
  updatedAt?: number;
  txHash: string;
};

export type SpotWithdraw = {
  id: string;
  type: 'spot-withdraw';
  amount: string;
  destinationAddress: string;
  txSignature?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  updatedAt?: number;
};

export type Transfer = Deposit | Withdraw | SpotWithdraw;

export function isDeposit(transfer: Transfer): transfer is Deposit {
  return transfer.type === 'deposit';
}

export function isWithdraw(transfer: Transfer): transfer is Withdraw {
  return transfer.type === 'withdraw';
}

export function isSpotWithdraw(transfer: Transfer): transfer is SpotWithdraw {
  return transfer.type === 'spot-withdraw';
}

export interface TransferState {
  transfersByDydxAddress: { [account: DydxAddress]: Transfer[] };
}

const initialState: TransferState = {
  transfersByDydxAddress: {},
};

export const transfersSlice = createSlice({
  name: 'Transfers',
  initialState,
  reducers: {
    addDeposit: (state, action: PayloadAction<{ blackbottleAddress: DydxAddress; deposit: Deposit }>) => {
      const { blackbottleAddress, deposit } = action.payload;
      if (!state.transfersByDydxAddress[blackbottleAddress]) {
        state.transfersByDydxAddress[blackbottleAddress] = [];
      }

      const newDeposit = { ...deposit, updatedAt: Date.now() };

      state.transfersByDydxAddress[blackbottleAddress].push(newDeposit);
    },
    updateDeposit: (
      state,
      action: PayloadAction<{
        blackbottleAddress: DydxAddress;
        deposit: Partial<Deposit> & { txHash: string; chainId: string };
      }>
    ) => {
      const { blackbottleAddress, deposit } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[blackbottleAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[blackbottleAddress] = accountTransfers.map((transfer) => {
        if (
          isDeposit(transfer) &&
          transfer.txHash === deposit.txHash &&
          transfer.chainId === deposit.chainId
        ) {
          return { ...transfer, ...deposit, updatedAt: Date.now() };
        }

        return transfer;
      });
    },
    addWithdraw: (
      state,
      action: PayloadAction<{ blackbottleAddress: DydxAddress; withdraw: Withdraw }>
    ) => {
      const { blackbottleAddress, withdraw } = action.payload;
      if (!state.transfersByDydxAddress[blackbottleAddress]) {
        state.transfersByDydxAddress[blackbottleAddress] = [];
      }

      const newWithdraw = { ...withdraw, updatedAt: Date.now() };

      state.transfersByDydxAddress[blackbottleAddress].push(newWithdraw);
    },
    updateWithdraw: (
      state,
      action: PayloadAction<{
        blackbottleAddress: DydxAddress;
        withdraw: Partial<Withdraw>;
      }>
    ) => {
      const { blackbottleAddress, withdraw } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[blackbottleAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[blackbottleAddress] = accountTransfers.map((transfer) => {
        if (isWithdraw(transfer) && transfer.id === withdraw.id) {
          return { ...transfer, ...withdraw };
        }

        return transfer;
      });
    },
    onWithdrawBroadcast: (
      state,
      action: PayloadAction<{
        blackbottleAddress: DydxAddress;
        withdrawId: string;
        subtransaction: WithdrawSubtransaction;
      }>
    ) => {
      const { blackbottleAddress, withdrawId, subtransaction } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[blackbottleAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[blackbottleAddress] = accountTransfers.map((transfer) => {
        if (isWithdraw(transfer) && transfer.id === withdrawId) {
          const currentTransactions = transfer.transactions.map((sub) => {
            if (sub.chainId === subtransaction.chainId) {
              return {
                ...sub,
                ...subtransaction,
              };
            }

            return sub;
          });

          transfer.transactions = currentTransactions;
          transfer.updatedAt = Date.now();
        }

        return transfer;
      });
    },
    addSpotWithdraw: (
      state,
      action: PayloadAction<{ blackbottleAddress: DydxAddress; withdraw: SpotWithdraw }>
    ) => {
      const { blackbottleAddress, withdraw } = action.payload;
      if (!state.transfersByDydxAddress[blackbottleAddress]) {
        state.transfersByDydxAddress[blackbottleAddress] = [];
      }

      const newWithdraw = { ...withdraw, updatedAt: Date.now() };

      state.transfersByDydxAddress[blackbottleAddress].push(newWithdraw);
    },
    updateSpotWithdraw: (
      state,
      action: PayloadAction<{
        blackbottleAddress: DydxAddress;
        withdrawId: string;
        updates: Partial<SpotWithdraw>;
      }>
    ) => {
      const { blackbottleAddress, withdrawId, updates } = action.payload;
      const accountTransfers = state.transfersByDydxAddress[blackbottleAddress];
      if (!accountTransfers?.length) return;

      state.transfersByDydxAddress[blackbottleAddress] = accountTransfers.map((transfer) => {
        if (isSpotWithdraw(transfer) && transfer.id === withdrawId) {
          return { ...transfer, updatedAt: Date.now(), ...updates };
        }

        return transfer;
      });
    },
  },
});

export const {
  addDeposit,
  addWithdraw,
  onWithdrawBroadcast,
  updateDeposit,
  updateWithdraw,
  addSpotWithdraw,
  updateSpotWithdraw,
} = transfersSlice.actions;
