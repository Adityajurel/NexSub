import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { DemoClockProvider } from './context/DemoClockContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DemoClockProvider>
          <App />
        </DemoClockProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
