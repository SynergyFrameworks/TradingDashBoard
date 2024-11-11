import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';
import tradesReducer, { TradesState } from '../../features/redux/tradeSlice';
import type { 
  ResponsiveContainerProps,  
  XAxisProps, 
  YAxisProps 
} from 'recharts';

interface RootState {
  trades: TradesState;
}

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  AreaChart: (props: any) => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Brush: () => null,
  BarChart: () => null,
  Bar: () => null,
  Cell: () => null,
  PieChart: () => null,
  Pie: () => null
}));

const createDefaultState = (overrides?: Partial<TradesState>): RootState => ({
  trades: {
    trades: [],
    error: null,
    isConnected: true,
    isPaused: false,
    connectionStats: {
      reconnectAttempt: 0,
      status: 'connected'
    },
    statistics: undefined,
    ...overrides
  }
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithProviders = (
  ui: React.ReactElement,
  { preloadedState = createDefaultState() } = {}
) => {
  const store = configureStore({
    reducer: {
      trades: tradesReducer
    },
    preloadedState
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>{ui}</BrowserRouter>
      </Provider>
    )
  };
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows disconnection state and redirects', () => {
    renderWithProviders(<AnalyticsDashboard />, {
      preloadedState: createDefaultState({
        isConnected: false,
        connectionStats: {
          reconnectAttempt: 0,
          status: 'disconnected'
        }
      })
    });

    // Initial disconnection alert
    expect(screen.getByText('Connection lost. Checking connection status...')).toBeInTheDocument();
    
    // Should show loading indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(2); // Linear and Circular progress

    // After disconnect timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Connection lost. Redirecting to home page...')).toBeInTheDocument();

    // After redirect timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', {
      replace: true,
      state: {
        message: 'Disconnected from service. Please ensure connection before viewing analytics.'
      }
    });
  });

  it('shows error alert when error exists', () => {
    const errorMessage = 'Test error message';
    renderWithProviders(<AnalyticsDashboard />, {
      preloadedState: createDefaultState({
        error: errorMessage
      })
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows reset message when connection is reset', () => {
    renderWithProviders(<AnalyticsDashboard />, {
      preloadedState: createDefaultState({
        isConnected: true,
        connectionStats: {
          status: 'reset',
          reconnectAttempt: 0,
        }
      })
    });

    expect(screen.getByText('Data buffer has been reset. View has been refreshed.')).toBeInTheDocument();
  });



})