import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, GitHub, Info } from '@mui/icons-material';

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
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search sx={{ color: 'white', fontSize: 28 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            SEO Tech Check
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="View on GitHub">
            <IconButton
              color="inherit"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'white' }}
            >
              <GitHub />
            </IconButton>
          </Tooltip>
          <Tooltip title="About this tool">
            <IconButton
              color="inherit"
              sx={{ color: 'white' }}
            >
              <Info />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
