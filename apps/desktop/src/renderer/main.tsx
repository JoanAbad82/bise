// The renderer's root: mounts src/app's <App /> (amb-win's shell) into #root.
// Owner: amb-core (scaffold); keep it this small.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
