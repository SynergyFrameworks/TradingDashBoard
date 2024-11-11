import React, { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import { debounce } from 'lodash';
import { selectTrades, selectIsConnected, selectError, selectConnectionStats } from '../../features/redux/tradeSlice';
import { SummaryStatistics } from './TradeStatistics';          
import { InteractiveCharts } from './InteractiveCharts';        
import { TradeAnalytics } from './TradeAnalytics';             

const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const trades = useSelector(selectTrades);
  const isConnected = useSelector(selectIsConnected);
  const connectionStats = useSelector(selectConnectionStats);
  const error = useSelector(selectError);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showDisconnectAlert, setShowDisconnectAlert] = useState(false);
  const disconnectTimeout = useRef<number>();
  const redirectTimeout = useRef<number>();
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const prevTradesRef = useRef<typeof trades>([]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(() => {
      setShowUpdateAlert(true);
      setTimeout(() => setShowUpdateAlert(false), 2000);
    }, 1000),
    []
  );

  useEffect(() => {
    if (trades.length !== prevTradesRef.current.length) {
      prevTradesRef.current = trades;
      debouncedUpdate();
    }
    return () => {
      debouncedUpdate.cancel();
    };
  }, [trades, debouncedUpdate]);


  const redirectToHome = useCallback(() => {
    navigate('/', {
      replace: true,
      state: {
        message: connectionStats.status === 'reset' 
          ? connectionStats.resetReason || 'Service buffer has been reset. Data collection restarted.'
          : 'Disconnected from service. Please ensure connection before viewing analytics.'
      }
    });
  }, [navigate, connectionStats.status, connectionStats.resetReason]);

  const clearAllTimeouts = useCallback(() => {
    if (disconnectTimeout.current) {
      window.clearTimeout(disconnectTimeout.current);
      disconnectTimeout.current = undefined;
    }
    if (redirectTimeout.current) {
      window.clearTimeout(redirectTimeout.current);
      redirectTimeout.current = undefined;
    }
  }, []);

 
  useEffect(() => {
    clearAllTimeouts();

    if (!isConnected && connectionStats.status !== 'reset') { 
      setShowDisconnectAlert(true);
      
      disconnectTimeout.current = window.setTimeout(() => {
        setIsRedirecting(true);
        redirectTimeout.current = window.setTimeout(() => {
          redirectToHome();
        }, 1000);
      }, 1000);
    } else {
      setShowDisconnectAlert(false);
      setIsRedirecting(false);
    }

    return () => {
      clearAllTimeouts();
    };
  }, [isConnected, connectionStats.status, redirectToHome, clearAllTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  if (showDisconnectAlert || !isConnected || isRedirecting) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '50vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2 
        }}
      >
        <Alert 
          severity="warning" 
          variant="filled"
          sx={{ width: 'auto', minWidth: 300 }}
        >
          {isRedirecting 
            ? 'Connection lost. Redirecting to home page...' 
            : showDisconnectAlert 
              ? 'Connection lost. Checking connection status...'
              : 'Waiting for connection...'}
        </Alert>
        <CircularProgress />
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {connectionStats.status === 'reset' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Data buffer has been reset. View has been refreshed.
        </Alert>
      )}
      {showUpdateAlert && (
        <Fade in={showUpdateAlert}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Data updated: {trades.length} trades loaded
          </Alert>
        </Fade>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SummaryStatistics 
          selectedTrades={trades} 
          isConnected={isConnected} 
        />
        <InteractiveCharts 
          trades={trades} 
          isConnected={isConnected} 
        />
        <TradeAnalytics 
          trades={trades} 
          isConnected={isConnected} 
        />
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;