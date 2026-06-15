import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    data: false,
  },
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.data = action.payload;
    },
    logout: (state) => {
      state.data = false;
    },
  },
});

export const { setAuthenticated, logout } = authSlice.actions;
export default authSlice.reducer;
