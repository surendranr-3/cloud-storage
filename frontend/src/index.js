/**
 * REACT APPLICATION ENTRY POINT
 * 
 * Initializes the React application and renders the root App component.
 * This file is the starting point for the entire CloudVault React application.
 * It mounts the App component to the DOM element with id="root" in index.html.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create React root and render App component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);