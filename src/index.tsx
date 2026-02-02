import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<App />
	</ThemeProvider>
);
