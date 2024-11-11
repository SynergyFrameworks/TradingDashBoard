import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createTheme } from '@mui/material/styles';
import { DashboardLayout } from './components/layout/DashboardLayout';
import Home from './pages/Home';
import Stocks from './pages/Stocks';
import TradesTable from './components/TradesTable';
import TradeDetailsPage from 'pages/TradeDetailsPage'
import Contact from './pages/Contact';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import { SignalRService } from './services/signalRService';
import { useDispatch, useSelector } from 'react-redux';
import { setConnectionStatus, setError, incrementReconnectAttempt, updateLastConnected, updateLastDisconnected } from './features/redux/tradeSlice';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isConnected = useSelector((state: any) => state.trades.isConnected);
  const connectionStats = useSelector((state: any) => state.trades.connectionStats);
  const [signalRService, setSignalRService] = useState<SignalRService | null>(null);

  useEffect(() => {
    const initSignalRService = () => {
      const service = new SignalRService();
      setSignalRService(service);
      return service;
    };

    const startConnection = async () => {
      try {
        await initSignalRService().start();
        dispatch(updateLastConnected());
      } catch (err) {
        dispatch(setError('Failed to connect to server'));
        dispatch(incrementReconnectAttempt());
        console.error('Failed to connect:', err);
        setTimeout(() => startConnection(), 5000);
      }
    };

    startConnection();

    return () => {
      signalRService?.stop();
    };
  }, [dispatch]);

  useEffect(() => {
    // Update connection status in Redux store
    if (!isConnected && connectionStats.status === 'disconnected') {
      dispatch(updateLastDisconnected());
    }
  }, [isConnected, connectionStats.status, dispatch]);

  useEffect(() => {
    // Set the title based on the route
    switch (location.pathname) {
      case '/':
        document.title = 'Home - Trade Tracker';
        break;
      case '/trades':
        document.title = 'Websocket Grid - Trade Tracker';
        break;
      case '/contact':
        document.title = 'Contact - Trade Tracker';
        break;
      default:
        document.title = 'Trade Tracker';
    }
  }, [location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trades" element={<TradesTable />} />
            <Route path="/trades/:tradeId" element={<TradeDetailsPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </DashboardLayout>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

const AppWithRouter: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;