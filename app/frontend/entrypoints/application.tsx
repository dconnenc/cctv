import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '@cctv/contexts';

import App from '../App';

import '../static.css';
import '../styles.css';
import '../tailwind.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>,
  );
}
