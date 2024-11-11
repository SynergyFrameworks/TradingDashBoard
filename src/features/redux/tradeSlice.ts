import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OptionTrade } from '../../types/optionTrade';
import { TradeStatistics } from '../../types/TradeStatistics';

interface ConnectionStats {
  reconnectAttempt: number;
  lastConnected?: Date;
  lastDisconnected?: Date;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reset';
  resetReason?: string;
}

export interface TradesState {
  trades: OptionTrade[];
  error: string | null;
  isConnected: boolean;
  connectionStats: ConnectionStats;
  statistics?: TradeStatistics;
  isPaused: boolean;
}

const initialState: TradesState = {
  trades: [],
  error: null,
  isConnected: false,
  isPaused: false,
  connectionStats: {
    reconnectAttempt: 0,
    status: 'disconnected',
  },
  statistics: undefined,
};

const tradesSlice = createSlice({
  name: 'trades',
  initialState,
  reducers: {
    setServiceReset: (state, action: PayloadAction<string>) => {
      state.connectionStats = {
        ...state.connectionStats,
        status: 'reset',
        resetReason: action.payload,
        lastDisconnected: new Date(),
      };
      state.isConnected = true;
      state.trades = [];
      state.error = null;
    },
    clearServiceReset: (state) => {
      state.connectionStats = {
        ...state.connectionStats,
        status: 'connected',
        resetReason: undefined,
      };
    },
    toggleFeedPause: (state) => {
      state.isPaused = !state.isPaused;
    },
    addTrade: (state, action: PayloadAction<OptionTrade>) => {
      if (!state.isPaused) {
        state.trades.unshift(action.payload);        
        if (state.trades.length > 1000) {
          state.trades.pop();
        }
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setConnectionStats: (state, action: PayloadAction<ConnectionStats>) => {
      state.connectionStats = action.payload;
      state.isConnected = action.payload.status === 'connected';
    },
    setStatistics: (state, action: PayloadAction<TradeStatistics>) => {
      state.statistics = action.payload;
    },
    incrementReconnectAttempt: (state) => {
      state.connectionStats.reconnectAttempt += 1;
    },
    updateLastConnected: (state) => {
      state.connectionStats = {
        ...state.connectionStats,
        lastConnected: new Date(),
        status: 'connected',
      };
      state.isConnected = true;
      state.error = null;
    },
    updateLastDisconnected: (state) => {
      state.connectionStats = {
        ...state.connectionStats,
        lastDisconnected: new Date(),
        status: 'disconnected',
      };
      state.isConnected = false;
    },
    resetConnectionStats: (state) => {
      state.connectionStats = {
        reconnectAttempt: 0,
        status: 'disconnected',
      };
      state.isConnected = false;
      state.error = null;
    },
    setPauseState: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
  },
});

// Export all actions
export const {
  addTrade,
  setError,
  setConnectionStats,
  setStatistics,
  incrementReconnectAttempt,
  updateLastConnected,
  updateLastDisconnected,
  resetConnectionStats,
  toggleFeedPause,
  setPauseState,
  setServiceReset,
  clearServiceReset 
} = tradesSlice.actions;

// Selectors with proper type safety
export const selectTrades = (state: { trades: TradesState }): OptionTrade[] => 
  state.trades.trades;

export const selectConnectionStats = (state: { trades: TradesState }): ConnectionStats => 
  state.trades.connectionStats;

export const selectIsConnected = (state: { trades: TradesState }): boolean => {
  const status = state.trades.connectionStats.status;
  return state.trades.isConnected || status === 'connected' || status === 'reset';
};

export const selectError = (state: { trades: TradesState }): string | null => 
  state.trades.error;

export const selectStatistics = (state: { trades: TradesState }): TradeStatistics | undefined => 
  state.trades.statistics;

export const selectFeedPaused = (state: { trades: TradesState }): boolean => 
  state.trades.isPaused;

export const selectIsReset = (state: { trades: TradesState }): boolean => 
  state.trades.connectionStats.status === 'reset';

export type TradesRootState = {
  trades: TradesState;
};

export default tradesSlice.reducer;