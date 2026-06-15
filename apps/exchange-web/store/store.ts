import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import orderReducer from "./features/orderSlice";
import walletReducer from "./features/walletSlice";
import socketReducer from "./features/socketSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    order: orderReducer,
    wallet: walletReducer,
    socket: socketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
