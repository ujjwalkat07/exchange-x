import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WalletData {
  asset1: number;
  asset2: number;
}

export interface WalletState {
  isWalletChanging: boolean;
  data: WalletData | null;
}

const initialState: WalletState = {
  isWalletChanging: false,
  data: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    changeWalletState: (state, action: PayloadAction<WalletData>) => {
      state.isWalletChanging = true;
      state.data = action.payload;
    },
    resetWalletChange: (state) => {
      state.isWalletChanging = false;
      state.data = null;
    },
  },
});

export const { changeWalletState, resetWalletChange } = walletSlice.actions;
export default walletSlice.reducer;
