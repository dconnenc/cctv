import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '@cctv/contexts';

import App from '../App';

import '../static.css';
import '../styles.css';
import '../tailwind.output.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <BrowserRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </BrowserRouter>,
);
