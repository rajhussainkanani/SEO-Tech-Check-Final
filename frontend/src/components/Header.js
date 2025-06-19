import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
} from '@mui/material';

const Header = () => {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Box
          component="img"
          src="/images/CHECKSEO.Dev.png"
          alt="Check SEO Logo"
          sx={{
            height: 150,
            width: 'auto',
            borderRadius: 1,
            padding: '4px 8px',
          }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
