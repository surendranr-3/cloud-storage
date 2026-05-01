/**
 * MAIN APPLICATION COMPONENT
 * 
 * Root React component that sets up routing for the entire CloudVault application.
 * Implements route protection using a PrivateRoute wrapper that checks for JWT token.
 * 
 * Routes:
 * - /login : Public login page
 * - /register : Public registration page
 * - /dashboard : Protected file management dashboard (requires authentication)
 * - /* : Redirects to /login (default route)
 * 
 * Authentication: Uses localStorage to store and verify JWT token
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

/**
 * PrivateRoute Component
 * 
 * Wrapper component that protects authenticated routes.
 * Checks if JWT token exists in localStorage.
 * If present: renders the protected component
 * If missing: redirects to login page
 * 
 * Usage: <PrivateRoute><ProtectedComponent /></PrivateRoute>
 */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

/**
 * App Component
 * 
 * Main application component that configures routing.
 * All routes are wrapped in BrowserRouter for client-side navigation.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected route - requires JWT token */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        
        {/* Default route - redirect all unmatched paths to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}