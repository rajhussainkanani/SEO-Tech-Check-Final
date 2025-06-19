import React from 'react';
import {
  Box,
  Container,
  Typography,
  Divider,
} from '@mui/material';

const Footer = () => {
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
        <Typography
          variant="body2"
          color="white"
          align="center"
        >
          © {year} Check SEO. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
