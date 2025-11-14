import { BrowserRouter } from 'react-router-dom';

import { createRoot } from 'react-dom/client';

import App from '../App';

import '../static.css';
import '../styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
