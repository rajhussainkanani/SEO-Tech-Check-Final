import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Search, Help, Clear } from '@mui/icons-material';
import { validateURL } from '../utils/validators';

const URLInput = ({ onAnalyze, disabled }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setUrl(value);
    if (error) {
      setError('');
    }
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsValidating(true);
    setError('');

    try {
      const validation = validateURL(url);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        setIsValidating(false);
        return;
      }

      onAnalyze(validation.sanitizedUrl);
    } catch (err) {
      setError('Failed to validate URL. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          Enter Website URL
          <Tooltip
            title="Enter the complete URL of the website you want to analyze (e.g., https://example.com)"
            arrow
          >
            <IconButton size="small" color="primary">
              <Help fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="https://example.com"
            value={url}
            onChange={handleInputChange}
            error={!!error}
            helperText={error}
            disabled={disabled || isValidating}
            InputProps={{
              endAdornment: url && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ mr: 1 }}
                  disabled={disabled || isValidating}
                >
                  <Clear />
                </IconButton>
              ),
              sx: {
                pr: url ? 1 : 2,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={!url || disabled || isValidating}
            startIcon={isValidating ? <CircularProgress size={20} /> : <Search />}
            sx={{
              minWidth: 120,
              height: 56,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {isValidating ? 'Validating...' : 'Analyze'}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, opacity: 0.8 }}
        >
          Get a comprehensive technical SEO analysis of your website, including
          metadata, content structure, performance, and more.
        </Typography>
      </Paper>
    </Box>
  );
};

export default URLInput;
