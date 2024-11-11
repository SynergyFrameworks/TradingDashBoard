import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TradesTable from '../components/TradesTable';

const Stocks: React.FC = () => {
  return (
    <div>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Overview
        </Typography>
        {/* Add any stock-specific content here */}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Related Trades
        </Typography>
        <TradesTable />
      </Paper>
    </div>
  );
};

export default Stocks;