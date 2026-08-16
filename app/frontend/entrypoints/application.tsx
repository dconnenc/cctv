import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import { AnalyticsErrorBoundary, initAnalytics } from '@cctv/analytics';
import { ThemeProvider } from '@cctv/contexts/ThemeContext';

import App from '../App';

import '../static.css';
import '../styles.css';
import '../tailwind.css';

initAnalytics();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <BrowserRouter>
      <ThemeProvider>
        <AnalyticsErrorBoundary>
          <App />
        </AnalyticsErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>,
  );
}
