import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ContactForm from '../components/ContactForm';

const Contact: React.FC = () => {
  return (
    <Box sx={{ padding: 4, textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      
      <Typography variant="h4" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" paragraph>
        We’d love to hear from you! Please fill out the form below to get in touch.
      </Typography>
      <ContactForm />
    </Box>
  );
};

export default Contact;
