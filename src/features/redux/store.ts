import { configureStore } from '@reduxjs/toolkit';
import tradesReducer from '../redux/tradeSlice';

export const store = configureStore({
  reducer: {
    trades: tradesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['trades/addTrade'],
        ignoredActionPaths: [
          'payload.Timestamp',
          'payload.Expiration',
          'payload.lastConnected',
          'payload.lastDisconnected'
        ],
        ignoredPaths: [
          'trades.connectionStats.lastConnected',
          'trades.connectionStats.lastDisconnected'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;