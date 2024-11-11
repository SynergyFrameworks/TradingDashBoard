import React, { useState, useMemo, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { OptionTrade } from '../../types/optionTrade';

interface ChartFilters {
  symbol: string;
  type: string;
  minStrike: number;
  maxStrike: number;
}

const CHART_COLORS = {
  calls: '#4caf50',
  puts: '#ef5350',
  volume: '#2196f3',
  price: '#9c27b0',
};

interface TooltipContentProps {
  active?: boolean;
  payload?: any[];
}

interface ComponentProps {
  trades: OptionTrade[];
  isConnected?: boolean;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

const CustomTooltip: React.FC<TooltipContentProps> = ({ active, payload }) => {
  const theme = useTheme();

  if (!active || !payload) return null;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: theme.shadows[2],
        minWidth: 200,
      }}
    >
      <Typography variant="body2">
        Time: {formatTime(payload[0]?.payload.timestamp)}
      </Typography>
      <Typography variant="body2">
        Price: {formatPrice(payload[0]?.value)}
      </Typography>
      <Typography variant="body2">
        Volume: {payload[1]?.value.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        IV: {(payload[0]?.payload.iv || 0).toFixed(2)}%
      </Typography>
      <Typography variant="body2">
        Strike: {formatPrice(payload[0]?.payload.strike)}
      </Typography>
    </Box>
  );
};

const VolumeTooltip: React.FC<TooltipContentProps> = ({ active, payload }) => {
  const theme = useTheme();

  if (!active || !payload) return null;

  const callVolume = payload.find(p => p.name === 'Calls')?.value || 0;
  const putVolume = payload.find(p => p.name === 'Puts')?.value || 0;
  const ratio = putVolume > 0 ? (callVolume / putVolume).toFixed(2) : 'N/A';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: theme.shadows[2],
        minWidth: 200,
      }}
    >
      <Typography variant="body2">
        Time: {formatTime(payload[0]?.payload.timestamp)}
      </Typography>
      <Typography variant="body2">
        Call Volume: {callVolume.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Put Volume: {putVolume.toLocaleString()}
      </Typography>
      <Typography variant="body2">
        Call/Put Ratio: {ratio}
      </Typography>
    </Box>
  );
};

export const InteractiveCharts: React.FC<ComponentProps> = ({ trades, isConnected }) => {
  const theme = useTheme();
  const [filters, setFilters] = useState<ChartFilters>({
    symbol: '',
    type: 'all',
    minStrike: 0,
    maxStrike: 999999,
  });
  const [zoomDomain, setZoomDomain] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const symbolsSetRef = useRef(new Set<string>());
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  const debouncedUpdateSymbols = useMemo(
    () =>
      debounce(() => {
        const sortedSymbols = Array.from(symbolsSetRef.current).sort();
        setAvailableSymbols(sortedSymbols);
      }, 1000),
    []
  );

  useEffect(() => {
    if (!isConnected) return;
    
    let hasNewSymbols = false;
    trades.forEach(trade => {
      if (!symbolsSetRef.current.has(trade.Symbol)) {
        symbolsSetRef.current.add(trade.Symbol);
        hasNewSymbols = true;
      }
    });

    if (hasNewSymbols) {
      debouncedUpdateSymbols();
    }

    return () => {
      debouncedUpdateSymbols.cancel();
    };
  }, [trades, debouncedUpdateSymbols, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    
    if (trades.length === 0) {
      symbolsSetRef.current.clear();
      setAvailableSymbols([]);
    }
  }, [trades.length, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    
    if (filters.symbol && !symbolsSetRef.current.has(filters.symbol)) {
      setFilters(prev => ({ ...prev, symbol: '' }));
    }
  }, [filters.symbol, availableSymbols, isConnected]);

  const filteredData = useMemo(() => {
    if (!isConnected) return [];
    
    return trades.filter(trade => (
      (filters.symbol === '' || trade.Symbol === filters.symbol) &&
      (filters.type === 'all' || trade.Type.toLowerCase() === filters.type) &&
      trade.Strike >= filters.minStrike &&
      trade.Strike <= filters.maxStrike
    ));
  }, [trades, filters, isConnected]);

  const chartData = useMemo(() => {
    return filteredData.map(trade => ({
      timestamp: new Date(trade.Timestamp).getTime(),
      price: trade.Price,
      volume: trade.Quantity,
      iv: trade.IV * 100,
      type: trade.Type.toLowerCase(),
      strike: trade.Strike,
      symbol: trade.Symbol,
    }));
  }, [filteredData]);

  const handleZoom = (domain: any) => {
    setZoomDomain(domain);
  };

  const symbolSelect = useMemo(() => (
    <FormControl sx={{ minWidth: 120 }}>
      <InputLabel>Symbol</InputLabel>
      <Select
        value={filters.symbol}
        label="Symbol"
        onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
      >
        <MenuItem value="">All</MenuItem>
        {availableSymbols.map(symbol => (
          <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
        ))}
      </Select>
    </FormControl>
  ), [filters.symbol, availableSymbols]);

  if (!isConnected) {
    return null;
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Card>
        <CardHeader 
          title="Options Analysis"
          action={
            <Stack direction="row" spacing={2} sx={{ p: 2 }}>
              {symbolSelect}
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="call">Calls</MenuItem>
                  <MenuItem value="put">Puts</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Min Strike"
                type="number"
                value={filters.minStrike}
                onChange={(e) => setFilters(prev => ({ ...prev, minStrike: Number(e.target.value) }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="Max Strike"
                type="number"
                value={filters.maxStrike}
                onChange={(e) => setFilters(prev => ({ ...prev, maxStrike: Number(e.target.value) }))}
                sx={{ width: 120 }}
              />
            </Stack>
          }
        />
        <CardContent sx={{ height: 400, pt: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                domain={zoomDomain ? [zoomDomain.start, zoomDomain.end] : ['auto', 'auto']}
                tickFormatter={formatTime}
              />
              <YAxis yAxisId="price" orientation="left" />
              <YAxis yAxisId="volume" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                name="Price"
                stroke={CHART_COLORS.price}
                fill={CHART_COLORS.price}
                fillOpacity={0.1}
              />
              <Area
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Volume"
                stroke={CHART_COLORS.volume}
                fill={CHART_COLORS.volume}
                fillOpacity={0.1}
              />
              <Brush
                dataKey="timestamp"
                height={30}
                stroke={theme.palette.primary.main}
                onChange={handleZoom}
                tickFormatter={formatTime}
              />
              {selectedPoint && (
                <ReferenceLine
                  x={selectedPoint.timestamp}
                  stroke={theme.palette.text.secondary}
                  strokeDasharray="3 3"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Call/Put Volume Distribution" />
        <CardContent sx={{ height: 320, pt: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
              />
              <YAxis />
              <Tooltip content={<VolumeTooltip />} />
              <Legend />
              <Bar
                dataKey={(data) => data.type === 'call' ? data.volume : 0}
                name="Calls"
                stackId="volume"
                fill={CHART_COLORS.calls}
              />
              <Bar
                dataKey={(data) => data.type === 'put' ? data.volume : 0}
                name="Puts"
                stackId="volume"
                fill={CHART_COLORS.puts}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InteractiveCharts;