import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '../App';
import '../styles.css';
import '../static.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
