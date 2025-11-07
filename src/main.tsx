import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { monitoringService } from './services/monitoring';
import { safetyService } from './services/safetyService';
import './index.css';

// Initialize monitoring
monitoringService.initialize({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  logRocketAppId: import.meta.env.VITE_LOGROCKET_APP_ID,
  environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
  enablePerformance: true,
});

// Load safety limits from storage
safetyService.loadLimitsFromStorage();
safetyService.loadStatsFromStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
