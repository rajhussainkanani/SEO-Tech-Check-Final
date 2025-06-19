import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  ArrowBack,
  ExpandMore,
  ExpandLess,
  ErrorOutline,
} from '@mui/icons-material';

const ErrorMessage = ({ error, onRetry, onReset }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getErrorType = (message) => {
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate limit')) return 'rateLimit';
    if (message.includes('Invalid URL')) return 'invalidUrl';
    if (message.includes('network')) return 'network';
    return 'general';
  };

  const getErrorTitle = (type) => {
    switch (type) {
      case 'timeout':
        return 'Request Timeout';
      case 'rateLimit':
        return 'Rate Limit Exceeded';
      case 'invalidUrl':
        return 'Invalid URL';
      case 'network':
        return 'Network Error';
      default:
        return 'Analysis Failed';
    }
  };

  const getErrorDescription = (type) => {
    switch (type) {
      case 'timeout':
        return 'The website took too long to respond. This might be due to slow server response or network issues.';
      case 'rateLimit':
        return 'Too many requests have been made. Please wait a moment before trying again.';
      case 'invalidUrl':
        return 'The URL provided is not valid or accessible. Please check the URL and try again.';
      case 'network':
        return 'Unable to connect to the website. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred while analyzing the website. Please try again.';
    }
  };

  const getSuggestions = (type) => {
    switch (type) {
      case 'timeout':
        return [
          'Check if the website is accessible in your browser',
          'Try again in a few moments',
          'Ensure the website URL is correct',
        ];
      case 'rateLimit':
        return [
          'Wait a few minutes before trying again',
          'Consider analyzing fewer URLs simultaneously',
        ];
      case 'invalidUrl':
        return [
          'Ensure the URL includes http:// or https://',
          'Check for typos in the URL',
          'Verify the website is publicly accessible',
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try accessing the website directly in your browser',
          'Ensure the website is not behind a firewall',
        ];
      default:
        return [
          'Try refreshing the page',
          'Check if the website is accessible',
          'Contact support if the problem persists',
        ];
    }
  };

  const errorType = getErrorType(error.message);
  const errorTitle = getErrorTitle(errorType);
  const errorDescription = getErrorDescription(errorType);
  const suggestions = getSuggestions(errorType);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          border: (theme) => `1px solid ${theme.palette.error.light}`,
          borderRadius: 2,
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />

        <Typography variant="h5" gutterBottom color="error">
          {errorTitle}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {errorDescription}
        </Typography>

        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
          <AlertTitle>Error Details</AlertTitle>
          {error.message}
          {error.details && (
            <>
              <IconButton
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                sx={{ ml: 1 }}
              >
                {showDetails ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
              <Collapse in={showDetails}>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {error.details}
                </Typography>
              </Collapse>
            </>
          )}
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Suggestions:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
            {suggestions.map((suggestion, index) => (
              <Typography
                key={index}
                component="li"
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                {suggestion}
              </Typography>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={onRetry}
            size="large"
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onReset}
            size="large"
          >
            Start Over
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            mt: 3,
            fontStyle: 'italic',
          }}
        >
          If you continue to experience issues, please ensure the website is
          publicly accessible and not behind authentication.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ErrorMessage;
