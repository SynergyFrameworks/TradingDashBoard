import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import TradesTable from './TradesTable';
import tradesReducer, { TradesState } from '../features/redux/tradeSlice';
import type { OptionTrade } from '../types/optionTrade';

const mockTrades: OptionTrade[] = [
  {
    Id: '1',
    Timestamp: '2024-03-09T10:00:00',
    StockId: 1,
    Symbol: 'AAPL',
    Option: 'AAPL Mar24 180 CALL',
    Price: 5.25,
    Quantity: 100,
    Type: 'call',
    Strike: 180,
    Expiration: '2024-03-15T00:00:00',
    IV: 0.25,
    Delta: 0.65,
    Gamma: 0.03,
    Theta: -0.15,
    Vega: 0.08,
    Rho: 0.05
  }
];

interface RootState {
  trades: TradesState;
}

const createDefaultState = (overrides?: Partial<TradesState>): RootState => ({
  trades: {
    trades: mockTrades,
    error: null,
    isConnected: true,
    isPaused: false,
    connectionStats: {
      reconnectAttempt: 0,
      status: 'connected',
    },
    statistics: undefined,
    ...overrides
  }
});

const renderWithProviders = (
  ui: React.ReactElement,
  { preloadedState = createDefaultState() } = {}
) => {
  const store = configureStore({
    reducer: {
      trades: tradesReducer
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['trades/addTrade'],
          ignoredActionPaths: ['payload.Timestamp', 'payload.Expiration'],
          ignoredPaths: [
            'trades.connectionStats.lastConnected',
            'trades.connectionStats.lastDisconnected'
          ],
        },
      })
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('TradesTable', () => {
  const user = userEvent.setup();

  it('renders basic trade data correctly', () => {
    renderWithProviders(<TradesTable />);
    
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('$5.25')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays error message', () => {
    renderWithProviders(<TradesTable />, {
      preloadedState: createDefaultState({
        error: 'Connection failed',
        isConnected: false,
        connectionStats: {
          reconnectAttempt: 0,
          status: 'error',
        }
      })
    });
    
    expect(screen.getByRole('alert')).toHaveTextContent('Connection failed');
  });

  it('shows disconnected state correctly', () => {
    renderWithProviders(<TradesTable />, {
      preloadedState: createDefaultState({
        trades: [],
        isConnected: false,
        connectionStats: {
          reconnectAttempt: 0,
          status: 'disconnected',
        }
      })
    });
    
    const statusChip = screen.getByTestId('connection-status');
    expect(within(statusChip).getByText('Disconnected')).toBeInTheDocument();
    expect(statusChip).toHaveClass('MuiChip-colorError');
  });

  it('displays call type correctly', () => {
    renderWithProviders(<TradesTable />);
    
    const typeChip = screen.getByTestId('type-chip-call');
    expect(typeChip).toHaveClass('MuiChip-colorSuccess');
    expect(within(typeChip).getByText('CALL')).toBeInTheDocument();
  });

  it('filters by symbol', async () => {
    const mixedTradesState = createDefaultState({
      trades: [
        mockTrades[0],
        { ...mockTrades[0], Id: '2', Symbol: 'MSFT', Option: 'MSFT Mar24 300 CALL' }
      ]
    });

    renderWithProviders(<TradesTable />, { 
      preloadedState: mixedTradesState 
    });

    await user.click(screen.getByTestId('filter-toggle'));
    await user.type(screen.getByLabelText(/symbol/i), 'AAPL');

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.queryByText('MSFT')).not.toBeInTheDocument();
  });
});