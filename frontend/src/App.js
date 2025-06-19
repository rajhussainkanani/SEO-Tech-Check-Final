import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  Paper,
  useMediaQuery,
  Fab,
  Zoom
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import URLInput from './components/URLInput';
import SEOResults from './components/SEOResults';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Header from './components/Header';
import Footer from './components/Footer';
import { analyzeURL } from './services/api';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Initialize theme based on system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('seo-tech-check-theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(prefersDarkMode);
    }
  }, [prefersDarkMode]);

  // Create theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
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
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
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

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('seo-tech-check-theme', newMode ? 'dark' : 'light');
  };

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
          background: darkMode
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Header />
        
        <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
          {/* Hero Section */}
          <Box textAlign="center" mb={6}>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                mb: 2,
              }}
            >
              SEO Tech Check
            </Typography>
            <Typography
              variant="h5"
              component="p"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
              }}
            >
              Comprehensive technical SEO analysis to improve your search engine visibility
            </Typography>
          </Box>

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
              <URLInput onAnalyze={handleAnalyze} disabled={loading} />
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

        {/* Theme Toggle FAB */}
        <Zoom in={true}>
          <Fab
            color="primary"
            aria-label="toggle theme"
            onClick={toggleTheme}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </Fab>
        </Zoom>
      </Box>
    </ThemeProvider>
  );
}

export default App;
