import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { format } from 'date-fns';
import { OptionTrade } from '../types/optionTrade';

interface TradeDetailsProps {
  trade: OptionTrade | null;
  onClose: () => void;
}

export const TradeDetails: React.FC<TradeDetailsProps> = ({ trade, onClose }) => {
  if (!trade) return null;

  const formatValue = (value: number) => value.toFixed(4);
  const isCall = trade.Type.toLowerCase() === 'call';
  const typeColor = isCall ? 'success.main' : 'error.main';

  // Shared styles for consistent label formatting
  const labelStyle = {
    
    color: '#FFFFFF',
    borderBottom: '1px solid #757575',
    display: 'inline-block',
    pb: 0.5,
    mb: 1
  };

  return (
    <Dialog open={!!trade} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        color: typeColor,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <span>Trade Details - {trade.Symbol} {trade.Option}</span>
        <Chip
          label={trade.Type.toUpperCase()}
          color={isCall ? 'success' : 'error'}
          size="small"
          sx={{ ml: 'auto' }}
        />
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ ...labelStyle, fontSize: '1.1rem' }}>
              Basic Information
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div>
                <Typography variant="body2" sx={labelStyle}>Time</Typography>
                <Typography>{new Date(trade.Timestamp).toLocaleString()}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Type</Typography>
                <Typography sx={{ 
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  color: typeColor
                }}>
                  {trade.Type}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Strike</Typography>
                <Typography>${trade.Strike}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Expiration</Typography>
                <Typography>{format(new Date(trade.Expiration), 'PP')}</Typography>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ ...labelStyle, fontSize: '1.1rem' }}>
              Trade Details
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div>
                <Typography variant="body2" sx={labelStyle}>Quantity</Typography>
                <Typography>{trade.Quantity.toLocaleString()}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Price</Typography>
                <Typography>${trade.Price}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Total Value</Typography>
                <Typography>${(trade.Price * trade.Quantity).toLocaleString()}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>IV</Typography>
                <Typography>{(trade.IV * 100).toFixed(2)}%</Typography>
              </div>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ ...labelStyle, fontSize: '1.1rem' }}>
              Greeks
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div>
                <Typography variant="body2" sx={labelStyle}>Delta</Typography>
                <Typography>{formatValue(trade.Delta)}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Gamma</Typography>
                <Typography>{formatValue(trade.Gamma)}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Theta</Typography>
                <Typography>{formatValue(trade.Theta)}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Vega</Typography>
                <Typography>{formatValue(trade.Vega)}</Typography>
              </div>
              <div>
                <Typography variant="body2" sx={labelStyle}>Rho</Typography>
                <Typography>{formatValue(trade.Rho)}</Typography>
              </div>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TradeDetails;