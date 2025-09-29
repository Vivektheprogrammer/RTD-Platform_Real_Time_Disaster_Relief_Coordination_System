import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequestProvider } from './contexts/RequestContext';
import { OfferProvider } from './contexts/OfferContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MatchingProvider } from './contexts/MatchingContext';
import { MapProvider } from './contexts/MapContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RequestProvider>
          <OfferProvider>
            <NotificationProvider>
              <MatchingProvider>
                <MapProvider>
                  <App />
                </MapProvider>
              </MatchingProvider>
            </NotificationProvider>
          </OfferProvider>
        </RequestProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);