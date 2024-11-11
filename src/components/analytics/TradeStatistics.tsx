import React, { useState, useMemo } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import { OptionTrade } from '../../types/optionTrade';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  symbol?: string;
}

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: 120,
  marginRight: theme.spacing(2)
}));

const StyledStatCard = ({ title, value, description, trend, symbol }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardHeader
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {symbol && (
            <Chip
              label={symbol}
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      }
      sx={{ pb: 1 }}
    />
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: trend.isPositive ? 'success.main' : 'error.main'
          }}>
            {trend.isPositive ? <ArrowUpward /> : <ArrowDownward />}
            <Typography variant="body2">
              {Math.abs(trend.value)}%
            </Typography>
          </Box>
        )}
      </Box>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
    </CardContent>
  </Card>
);

interface ComponentProps {
  selectedTrades: OptionTrade[];
  isConnected?: boolean;
}

export const SummaryStatistics: React.FC<ComponentProps> = ({ selectedTrades, isConnected }) => {
  // Move all hooks to the top level, before any conditional returns
  const [timeframe, setTimeframe] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');

  const uniqueSymbols = useMemo(() => {
    if (!isConnected) return ['all'];
    const symbols = selectedTrades.map(trade => trade.Symbol);
    return ['all', ...symbols.filter((symbol, index) => 
      symbols.indexOf(symbol) === index
    )];
  }, [selectedTrades, isConnected]);

  const filteredTrades = useMemo(() => {
    if (!isConnected) return [];
    let filtered = [...selectedTrades];
    
    if (symbolFilter !== 'all') {
      filtered = filtered.filter(trade => trade.Symbol === symbolFilter);
    }
    
    if (timeframe !== 'all') {
      const now = new Date();
      const timeframeMap: { [key: string]: number } = {
        'day': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      };
      const cutoff = new Date(now.setDate(now.getDate() - timeframeMap[timeframe]));
      filtered = filtered.filter(trade => new Date(trade.Timestamp) >= cutoff);
    }
    
    return filtered;
  }, [selectedTrades, symbolFilter, timeframe, isConnected]);

  const stats = useMemo(() => {
    if (!isConnected || filteredTrades.length === 0) return null;

    const totalVolume = filteredTrades.reduce((sum, trade) => sum + trade.Quantity, 0);
    const avgPrice = filteredTrades.reduce((sum, trade) => sum + trade.Price, 0) / filteredTrades.length;
    const totalValue = filteredTrades.reduce((sum, trade) => sum + (trade.Price * trade.Quantity), 0);
    
    const ivs = filteredTrades.map(t => t.IV);
    const ivSpread = Math.max(...ivs) - Math.min(...ivs);
    
    const weightedGreeks = filteredTrades.reduce((acc, trade) => {
      const weight = (trade.Price * trade.Quantity) / totalValue;
      return {
        Delta: acc.Delta + trade.Delta * weight,
        Gamma: acc.Gamma + trade.Gamma * weight,
        Theta: acc.Theta + trade.Theta * weight,
        Vega: acc.Vega + trade.Vega * weight,
        Rho: acc.Rho + trade.Rho * weight,
      };
    }, { Delta: 0, Gamma: 0, Theta: 0, Vega: 0, Rho: 0 });

    const greeksChartData = Object.entries(weightedGreeks).map(([greek, value]) => ({
      greek,
      value: parseFloat(value.toFixed(4))
    }));

    return {
      totalVolume,
      avgPrice,
      totalValue,
      ivSpread,
      weightedGreeks,
      greeksChartData
    };
  }, [filteredTrades, isConnected]);

  // Now we can have our conditional returns
  if (!isConnected) {
    return null;
  }

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No trades selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl>
          <InputLabel>Timeframe</InputLabel>
          <StyledSelect
            value={timeframe}
            label="Timeframe"
            onChange={(e) => setTimeframe(e.target.value as string)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="day">24 Hours</MenuItem>
            <MenuItem value="week">7 Days</MenuItem>
            <MenuItem value="month">30 Days</MenuItem>
            <MenuItem value="quarter">90 Days</MenuItem>
          </StyledSelect>
        </FormControl>

        <FormControl>
          <InputLabel>Symbol</InputLabel>
          <StyledSelect
            value={symbolFilter}
            label="Symbol"
            onChange={(e) => setSymbolFilter(e.target.value as string)}
          >
            {uniqueSymbols.map(symbol => (
              <MenuItem key={symbol} value={symbol}>
                {symbol === 'all' ? 'All Symbols' : symbol}
              </MenuItem>
            ))}
          </StyledSelect>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StyledStatCard
            title="Total Value"
            value={`$${stats.totalValue.toLocaleString()}`}
            description="Combined value of all selected trades"
            symbol={symbolFilter !== 'all' ? symbolFilter : undefined}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledStatCard
            title="Average Price"
            value={`$${stats.avgPrice.toFixed(2)}`}
            description="Volume-weighted average price"
            symbol={symbolFilter !== 'all' ? symbolFilter : undefined}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StyledStatCard
            title="IV Spread"
            value={`${(stats.ivSpread * 100).toFixed(2)}%`}
            description="Difference between highest and lowest IV"
            symbol={symbolFilter !== 'all' ? symbolFilter : undefined}
          />
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Portfolio Greeks</Typography>
              {symbolFilter !== 'all' && (
                <Chip label={symbolFilter} size="small" />
              )}
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ height: 300, width: '100%', mb: 4 }}>
            <ResponsiveContainer>
              <BarChart data={stats.greeksChartData}>
                <XAxis dataKey="greek" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Grid container spacing={4}>
            {Object.entries(stats.weightedGreeks).map(([greek, value]) => (
              <Grid item xs={6} md={2.4} key={greek}>
                <Typography variant="subtitle2" color="text.secondary">
                  {greek}
                </Typography>
                <Typography variant="h6">
                  {value.toFixed(4)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SummaryStatistics;