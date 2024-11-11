import React, { useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { OptionTrade } from '../../types/optionTrade';
import { useSelector } from 'react-redux';
import { selectIsConnected } from '../../features/redux/tradeSlice';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = {
  calls: '#4caf50',
  puts: '#ef5350',
  volume: '#2196f3',
  price: '#9c27b0',
};

interface ComponentProps {
  trades: OptionTrade[];
  isConnected?: boolean;
}

const LoadingOrError: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity={isConnected ? "info" : "warning"} sx={{ mb: 2 }}>
          {isConnected 
            ? "Waiting for trade data..." 
            : "Service not connected. Please wait while we attempt to connect..."
          }
        </Alert>
        <CircularProgress size={40} />
      </Paper>
    </Grid>
  </Grid>
);

const formatTimeString = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return 'Invalid Time';
  }
};

export const TradeAnalytics: React.FC<ComponentProps> = ({ trades, isConnected }) => {
  const isComConnected = useSelector(selectIsConnected);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');

  const symbols = useMemo(() => {
    if (!trades?.length) return ['all'];
    const uniqueSymbols = new Set(trades.map(trade => trade.Symbol));
    return ['all', ...Array.from(uniqueSymbols)];
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (!trades?.length) return [];
    return selectedSymbol === 'all' 
      ? trades 
      : trades.filter(trade => trade.Symbol === selectedSymbol);
  }, [trades, selectedSymbol]);

  const volumeData = useMemo(() => {
    if (!filteredTrades?.length) return [];
    
    const tradeMap = new Map<string, {
      time: string;
      symbol: string;
      volume: number;
      callVolume: number;
      putVolume: number;
    }>();


    filteredTrades.forEach(trade => {
      if (!trade?.Timestamp) return;
      
      try {
        const timeKey = formatTimeString(trade.Timestamp);
        const current = tradeMap.get(timeKey) || {
          time: timeKey,
          symbol: trade.Symbol,
          volume: 0,
          callVolume: 0,
          putVolume: 0
        };

        current.volume += trade.Quantity;
        if (trade.Type?.toLowerCase() === 'call') {
          current.callVolume += trade.Quantity;
        } else if (trade.Type?.toLowerCase() === 'put') {
          current.putVolume += trade.Quantity;
        }

        tradeMap.set(timeKey, current);
      } catch (error) {
        console.error('Error processing trade:', error);
      }
    });

    return Array.from(tradeMap.values())
    .sort((a, b) => a.time.localeCompare(b.time));
}, [filteredTrades]);

const optionTypeDistribution = useMemo(() => {
  if (!filteredTrades?.length) return [];
  
  const distribution = {
    CALL: 0,
    PUT: 0
  };

  filteredTrades.forEach(trade => {
    const type = trade.Type?.toUpperCase();
    if (type === 'CALL' || type === 'PUT') {
      distribution[type] += trade.Quantity;
    }
  });

    return Object.entries(distribution).map(([type, volume]) => ({
      type,
      volume
    }));
  }, [filteredTrades]);

  // Move the null check after all hooks
  if (!isConnected) {
    return null;
  }

  if (!isComConnected || !trades?.length) {
    return <LoadingOrError isConnected={isConnected} />;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h6">Trade Analytics</Typography>
            </Grid>
            <Grid item>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="symbol-select-label">Symbol</InputLabel>
                <Select
                  labelId="symbol-select-label"
                  value={selectedSymbol}
                  label="Symbol"
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  {symbols.map(symbol => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol === 'all' ? 'All Symbols' : symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Trading Volume Over Time
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                type="category"
                padding={{ left: 20, right: 20 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="callVolume"
                name="Calls"
                stroke={CHART_COLORS.calls}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="putVolume"
                name="Puts"
                stroke={CHART_COLORS.puts}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="volume"
                name="Total Volume"
                stroke={CHART_COLORS.volume}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '400px' }}>
          <Typography variant="h6" gutterBottom>
            Option Type Distribution
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={optionTypeDistribution}
                dataKey="volume"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={({ type, percent }) => 
                  `${type} ${(percent * 100).toFixed(1)}%`
                }
              >
                {optionTypeDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.type === 'CALL' ? CHART_COLORS.calls : CHART_COLORS.puts}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TradeAnalytics;