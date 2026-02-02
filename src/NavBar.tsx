import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export default function NavBar() {
  const location = useLocation();
  const value = location.pathname.startsWith('/stats') ? '/stats' : '/study';

  return (
    <AppBar position="static" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar disableGutters variant="dense" sx={{ minHeight: 44, px: 1 }}>
        <Tabs value={value} aria-label="Navigation tabs">
          <Tab
            label="Study"
            value="/study"
            component={NavLink}
            to="/study"
          />
          <Tab
            label="Stats"
            value="/stats"
            component={NavLink}
            to="/stats"
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
