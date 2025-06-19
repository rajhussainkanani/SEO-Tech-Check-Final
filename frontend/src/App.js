import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import URLInput from './components/URLInput';
import SEOResults from './components/SEOResults';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Header from './components/Header';
import Footer from './components/Footer';
import { analyzeURL } from './services/api';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');

  // Create theme (fixed light mode)
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      secondary: {
        main: '#f50057',
        light: '#ff5983',
        dark: '#c51162',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      success: {
        main: '#4caf50',
      },
      warning: {
        main: '#ff9800',
      },
      error: {
        main: '#f44336',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  const handleAnalyze = async (url) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setCurrentUrl(url);

    try {
      const response = await analyzeURL(url);
      setResults(response.results);
    } catch (err) {
      setError({
        message: err.message || 'Failed to analyze URL',
        details: err.details || 'Please check the URL and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setCurrentUrl('');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Header />
        
        <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          {/* Main Content */}
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              background: theme.palette.background.paper,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {!results && !loading && (
              <Box textAlign="center" mb={4}>
                <URLInput onAnalyze={handleAnalyze} disabled={loading} />
              </Box>
            )}

            {loading && <LoadingSpinner />}

            {error && (
              <ErrorMessage
                error={error}
                onRetry={() => handleAnalyze(currentUrl)}
                onReset={handleReset}
              />
            )}

            {results && (
              <SEOResults
                results={results}
                url={currentUrl}
                onNewAnalysis={handleReset}
              />
            )}
          </Paper>

          {/* Features Section */}
          {!results && !loading && (
            <Box mt={6}>
              <Typography
                variant="h3"
                component="h2"
                textAlign="center"
                gutterBottom
                sx={{ color: 'white', mb: 4 }}
              >
                What We Analyze
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: '1fr 1fr 1fr',
                }}
                gap={3}
              >
                {[
                  {
                    title: 'Metadata Analysis',
                    description: 'Title tags, meta descriptions, and keyword optimization',
                  },
                  {
                    title: 'Content Structure',
                    description: 'Heading hierarchy, content quality, and semantic markup',
                  },
                  {
                    title: 'Technical SEO',
                    description: 'Performance, mobile-friendliness, and security checks',
                  },
                  {
                    title: 'Link Analysis',
                    description: 'Internal and external link structure and attributes',
                  },
                  {
                    title: 'Image Optimization',
                    description: 'Alt text, file sizes, and accessibility compliance',
                  },
                  {
                    title: 'Structured Data',
                    description: 'Schema markup and rich snippet opportunities',
                  },
                ].map((feature, index) => (
                  <Paper
                    key={index}
                    elevation={4}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      background: theme.palette.background.paper,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" gutterBottom color="primary">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Container>

        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
