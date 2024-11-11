import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTrades } from '../features/redux/tradeSlice';
import { TradeDetails } from '../components/TradeDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const TradeDetailsPage: React.FC = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const trades = useSelector(selectTrades);
  const trade = trades.find(t => t.Id === tradeId) || null;

  const handleClose = () => {
    navigate('/trades');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleClose}
        sx={{ mb: 2 }}
      >
        Back to Trades
      </Button>
      
      {!trade ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Trade not found. The trade may have been removed or the ID is invalid.
        </Alert>
      ) : (
        <TradeDetails trade={trade} onClose={handleClose} />
      )}
    </Box>
  );
};

export default TradeDetailsPage;