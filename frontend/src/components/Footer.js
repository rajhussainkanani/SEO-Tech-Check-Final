import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  useTheme,
} from '@mui/material';

const Footer = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'transparent',
      }}
    >
      <Divider sx={{ mb: 3, opacity: 0.1 }} />
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            color="white"
            sx={{ textAlign: { xs: 'center', sm: 'left' } }}
          >
            © {year} SEO Tech Check. All rights reserved.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="#"
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1 },
                fontSize: '0.875rem',
              }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1 },
                fontSize: '0.875rem',
              }}
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              color="inherit"
              underline="hover"
              sx={{
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1 },
                fontSize: '0.875rem',
              }}
            >
              Contact
            </Link>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="white"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            opacity: 0.6,
          }}
        >
          Powered by scrape.do API • Built with React and Material-UI
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
