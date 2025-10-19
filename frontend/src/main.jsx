import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Uses Vite environment vars. Create .env with VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);