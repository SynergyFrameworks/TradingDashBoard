import React from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { SelectChangeEvent } from '@mui/material/Select';
import { DateRangePicker } from './DateRangePicker';
import type { FilterConfig } from '../types/filterConfig';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleFeedPause,
  selectFeedPaused,
  selectIsConnected,
  selectConnectionStats
} from '../features/redux/tradeSlice';

interface FilterPanelProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filterConfig, onFilterChange }) => {
  const dispatch = useDispatch();
  const isPaused = useSelector(selectFeedPaused);
  const isConnected = useSelector(selectIsConnected);
  const connectionStats = useSelector(selectConnectionStats);

  const handleTogglePause = () => {
    dispatch(toggleFeedPause());
  };

  const handleChange = (field: keyof FilterConfig, value: any) => {
    const newConfig: FilterConfig = {
      ...filterConfig,
      [field]: value,
    };
    onFilterChange(newConfig);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    handleChange(name as keyof FilterConfig, value as FilterConfig[keyof FilterConfig]);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    handleChange('timeRange', event.target.value);
  };



  React.useEffect(() => {
    if (connectionStats.status === 'reset') {
     
      const defaultConfig: FilterConfig = {
        symbol: '',
        option: '',
        minPrice: undefined,
        maxPrice: undefined,
        minQuantity: undefined,
        maxQuantity: undefined,
        optionType: 'all',
        strikeRange: { min: undefined, max: undefined },
        dateRange: { preset: 'all' },
        timeRange: 'all'
      };
      onFilterChange(defaultConfig);
    }
  }, [connectionStats.status, onFilterChange]);

  const isDisabled = connectionStats.status === 'reset';



  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
      {isConnected && (connectionStats.status === 'connected' || connectionStats.status === 'reset') && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title={isPaused ? "Resume Feed" : "Pause Feed"}>
            <IconButton 
              onClick={handleTogglePause}
              color={isPaused ? "primary" : "default"}
              size="medium"
              disabled={isDisabled}
              sx={{ 
                bgcolor: isPaused ? 'action.hover' : 'transparent',
                '&:hover': {
                  bgcolor: isPaused ? 'action.selected' : 'action.hover'
                }
              }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Tooltip>
          <Typography 
            variant="body2" 
            color={isPaused ? "primary" : "text.secondary"}
            sx={{ fontWeight: 'medium' }}
          >
            {isPaused ? "Feed Paused" : connectionStats.status === 'reset' ? "Buffer Reset - Feed Active" : "Feed Active"}
          </Typography>
        </Box>
      )}

<Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Symbol"
            variant="outlined"
            size="small"
            value={filterConfig.symbol || ''}
            onChange={(e) => handleChange('symbol', e.target.value)}
            placeholder="Filter by symbol..."
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Option"
            variant="outlined"
            size="small"
            value={filterConfig.option || ''}
            onChange={(e) => handleChange('option', e.target.value)}
            placeholder="Filter by option..."
            disabled={isDisabled}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Price Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              type="number"
              label="Min"
              variant="outlined"
              value={filterConfig.minPrice || ''}
              onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Min"
              sx={{ width: '50%' }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              size="small"
              type="number"
              label="Max"
              variant="outlined"
              value={filterConfig.maxPrice || ''}
              onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Max"
              sx={{ width: '50%' }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small" disabled={isDisabled}>
            <InputLabel id="option-type-label">Option Type</InputLabel>
            <Select
              labelId="option-type-label"
              name="optionType"
              value={filterConfig.optionType || 'all'}
              label="Option Type"
              onChange={handleSelectChange}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="call">Calls Only</MenuItem>
              <MenuItem value="put">Puts Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Strike Range
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              type="number"
              label="Min Strike"
              variant="outlined"
              value={filterConfig.strikeRange?.min || ''}
              onChange={(e) => handleChange('strikeRange', {
                ...filterConfig.strikeRange,
                min: e.target.value ? Number(e.target.value) : undefined
              })}
              placeholder="Min"
              sx={{ width: '50%' }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              size="small"
              type="number"
              label="Max Strike"
              variant="outlined"
              value={filterConfig.strikeRange?.max || ''}
              onChange={(e) => handleChange('strikeRange', {
                ...filterConfig.strikeRange,
                max: e.target.value ? Number(e.target.value) : undefined
              })}
              placeholder="Max"
              sx={{ width: '50%' }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Date Range
          </Typography>
          <DateRangePicker
            dateRange={filterConfig.dateRange || { preset: 'all' }}
            onChange={(range) => handleChange('dateRange', range)}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterPanel;