/**
 * LOGIN PAGE
 * 
 * User authentication page for logging into CloudVault.
 * Accepts email and password, sends credentials to backend API.
 * On successful login, stores JWT token and redirects to dashboard.
 * 
 * Features:
 * - Email and password input validation
 * - Error message display
 * - Loading state during authentication
 * - Redirect to registration page for new users
 */

import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Navigation hook
  const navigate = useNavigate();

  /**
   * Handle login form submission
   * 
   * Process:
   * 1. Prevents default form submission
   * 2. Sends credentials to /auth/login endpoint
   * 3. Stores returned JWT token in localStorage
   * 4. Redirects to /dashboard on success
   * 5. Displays error message on failure
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Send login request with email and password
      const { data } = await api.post('/auth/login', { email, password });
      
      // Store JWT token in localStorage for future authenticated requests
      localStorage.setItem('token', data.token);
      
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      // Display error message from API or generic message
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C8.477 3 4 7.477 4 13c0 3.09 1.408 5.857 3.632 7.723L6 24h16l-1.632-3.277A9.956 9.956 0 0024 13c0-5.523-4.477-10-10-10z" fill="white" fillOpacity="0.9"/>
              <circle cx="10" cy="13" r="2" fill="#2563eb"/>
              <circle cx="14" cy="10" r="2" fill="#2563eb"/>
              <circle cx="18" cy="13" r="2" fill="#2563eb"/>
            </svg>
          </div>
          <span className="auth-brand-name">CloudVault</span>
        </div>
        <div className="auth-hero">
          <h1 className="auth-hero-title">Store everything.<br/>Access anywhere.</h1>
          <p className="auth-hero-sub">Your files, secured with AES-256 encryption and backed by AWS S3. Upload, share, and manage from any device.</p>
          <div className="auth-features">
            <div className="auth-feat"><span className="auth-feat-icon">🔒</span><span>End-to-end encrypted</span></div>
            <div className="auth-feat"><span className="auth-feat-icon">⚡</span><span>Instant access worldwide</span></div>
            <div className="auth-feat"><span className="auth-feat-icon">🔁</span><span>Full version history</span></div>
            <div className="auth-feat"><span className="auth-feat-icon">👥</span><span>Easy file sharing</span></div>
          </div>
        </div>
        <div className="auth-grid-bg"/>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-sub">Sign in to your CloudVault account</p>
          </div>

          {error && <div className="auth-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="btn-spinner"/> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}