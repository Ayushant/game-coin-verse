
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create root using the proper React 18 API
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);

// Render app with React.StrictMode to ensure all React hooks have access to React context
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
