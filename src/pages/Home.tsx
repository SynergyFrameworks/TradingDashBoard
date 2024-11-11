import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useLocation, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
const Home: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setSnackbarOpen(true);
      navigate('/', { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setMessage(null);
  };

  return (
    <>
<Box sx={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
  <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
    <Typography variant="h4" gutterBottom>
      Welcome to the Real-Time Trading Dashboard
    </Typography>
    
    <Typography variant="body2" paragraph>
      Experience simulated live market data streaming through our advanced WebSocket implementation.
      Monitor real-time options trading activity across major market indices and individual equities.
    </Typography>
    
    <Typography variant="body2" paragraph>
      This platform provides simulated comprehensive insights into options trading activities,
      including price movements, volume analysis, and volatility tracking. Stay connected
      to market movements with instant updates and detailed analytics to help inform your
      trading decisions.
    </Typography>
  </Paper>
</Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="warning"
          elevation={6}
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: '600px', 
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;