import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = () => {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        gap: 3,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Analyzing Your Website{dots}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We're performing a comprehensive SEO analysis of your website.
          This may take a few moments.
        </Typography>
      </Box>
      <Box
        sx={{
          mt: 2,
          width: '100%',
          maxWidth: 400,
          px: 2,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Checking metadata, content structure, performance metrics, and more...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingSpinner;
