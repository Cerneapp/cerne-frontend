import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <App />
    </div>
  </React.StrictMode>
);
