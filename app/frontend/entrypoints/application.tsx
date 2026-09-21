import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import { AnalyticsErrorBoundary, initAnalytics } from '@cctv/analytics';
import { ThemeProvider } from '@cctv/contexts/ThemeContext';
import { installConsoleBuffer, installGlobalErrorReporting } from '@cctv/feedback';

import App from '../App';

import '../static.css';
import '../styles.css';
import '../tailwind.css';

initAnalytics();
// Installed at boot: by the time a user decides to report something, the console
// output that explains it has already scrolled away.
installConsoleBuffer();
installGlobalErrorReporting();

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
