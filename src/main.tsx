import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Gantt/App.tsx';
import './Gantt/App.scss';   // or './App.scss' if you prefer

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
