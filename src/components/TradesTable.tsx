import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; 
import FilterPanel from './FilterPanel';
import { OptionTrade } from '../types/optionTrade';
import type { FilterConfig } from '../types/filterConfig';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimelineIcon from '@mui/icons-material/Timeline';

import { selectTrades, selectIsConnected, selectError, selectConnectionStats } from '../features/redux/tradeSlice';
import { visuallyHidden } from '@mui/utils';

interface Column {
  id: keyof OptionTrade;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | JSX.Element;
}

const columns: Column[] = [
  {
    id: 'Timestamp',  
    label: 'Time',
    minWidth: 120,
    format: (value: string) => (typeof value === 'string' ? new Date(value).toLocaleTimeString() : ''),
  },
  {
    id: 'Symbol',    
    label: 'Symbol',
    minWidth: 100,
  },
  {
    id: 'Option',    
    label: 'Option',
    minWidth: 170,
  },
  {
    id: 'Quantity',   
    label: 'Quantity',
    minWidth: 100,
    align: 'right',
    format: (value: any) => (typeof value === 'number' ? value.toLocaleString() : ''),
  },
  {
    id: 'Price',      
    label: 'Price',
    minWidth: 100,
    align: 'right',
    format: (value: any) => (typeof value === 'number' ? `$${value.toFixed(2)}` : ''),
  },
  {
    id: 'Type',     
    label: 'Type',
    minWidth: 100,
    align: 'center',
    format: (value: 'call' | 'put') => (
      <Chip
        label={typeof value === 'string' ? value.toUpperCase() : ''}
        color={typeof value === 'string' && value.toLowerCase() === 'call' ? 'success' : 'error'}
        size="small"
        data-testid={`type-chip-${value}`}
      />
    ),
  },
];

export const TradesTable: React.FC = () => {
  const navigate = useNavigate(); 
  const trades = useSelector(selectTrades);
  const isConnected = useSelector(selectIsConnected);
  const connectionStats = useSelector(selectConnectionStats);
  const error = useSelector(selectError);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [orderBy, setOrderBy] = useState<keyof OptionTrade>('Timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    timeRange: 'all' as const,
    optionType: 'all' as const,
  });

  // Handle sorting
  const handleRequestSort = (property: keyof OptionTrade) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const getConnectionStatus = () => {
    if (connectionStats.status === 'reset') {
      return { label: 'Connected (Buffer Reset)', color: 'info' as const };
    }
    if (connectionStats.status === 'connected' && isConnected) {
      return { label: 'Connected', color: 'success' as const };
    }
    if (connectionStats.status === 'connecting') {
      return { label: 'Connecting', color: 'warning' as const };
    }
    return { label: 'Disconnected', color: 'error' as const };
  };

   const connectionStatus = getConnectionStatus();

   const filteredAndSortedTrades = React.useMemo(() => {
    if (connectionStats.status === 'reset') {
      return trades;
    }
  
    // First filter the trades
    const filteredTrades = trades.filter((trade) => {
   
      if (filterConfig.symbol && !trade.Symbol?.toLowerCase().includes(filterConfig.symbol.toLowerCase())) {
        return false;
      }
  
      if (filterConfig.option && !trade.Option?.toLowerCase().includes(filterConfig.option.toLowerCase())) {
        return false;
      }
  
      if (filterConfig.minPrice && trade.Price < filterConfig.minPrice) {
        return false;
      }
  
      if (filterConfig.maxPrice && trade.Price > filterConfig.maxPrice) {
        return false;
      }
  
      if (filterConfig.minQuantity && trade.Quantity < filterConfig.minQuantity) {
        return false;
      }
  
      if (filterConfig.maxQuantity && trade.Quantity > filterConfig.maxQuantity) {
        return false;
      }
  
      if (filterConfig.optionType && filterConfig.optionType !== 'all' && trade.Type !== filterConfig.optionType) {
        return false;
      }
  
      return true;
    });
  
    // Then sort the filtered trades
    return filteredTrades.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
  
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
  
      return order === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
  }, [trades, filterConfig, connectionStats.status, orderBy, order]);
  
  const handleFilterChange = (newConfig: FilterConfig) => {
    setFilterConfig(newConfig);
  };
  
  const handleRowClick = (trade: OptionTrade) => { 
    navigate(`/trades/${trade.Id}`);
  };
  
  // Get paginated data
  const paginatedTrades = filteredAndSortedTrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
    <Paper elevation={3}>
      <Toolbar>
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
        Trading SignalR Gridview    <TimelineIcon />  
        </Typography>
      
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              data-testid="connection-status"
              label={connectionStatus.label}
              color={connectionStatus.color}
              size="small"
            />
            <IconButton
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              size="small"
              data-testid="filter-toggle"
            >
              {filterPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Collapse in={filterPanelOpen}>
          <FilterPanel filterConfig={filterConfig} onFilterChange={handleFilterChange} />
        </Collapse>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(connectionStatus.label.includes('Connected')) ? (
                paginatedTrades.map((trade: OptionTrade) => (
                  <TableRow
                    hover
                    key={trade.Id}
                    onClick={() => handleRowClick(trade)}
                    sx={{
                      '& .MuiTableCell-root': {
                        color: trade.Type && trade.Type.toLowerCase() === 'call'
                          ? 'success.main'
                          : 'error.main'
                      },
                      '&:hover .MuiTableCell-root': {
                        color: trade.Type && trade.Type.toLowerCase() === 'call'
                          ? 'success.light'
                          : 'error.light'
                      },
                      cursor: 'pointer'
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(trade[column.id]) : String(trade[column.id] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {connectionStatus.label === 'Connecting' ? 'Connecting...' : 'Disconnected'}
                  </TableCell>
                </TableRow>
              )}
              {paginatedTrades.length === 0 && connectionStatus.label === 'Connected' && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No trades found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedTrades.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default TradesTable;