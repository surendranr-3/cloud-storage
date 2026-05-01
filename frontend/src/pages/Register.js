/**
 * REGISTRATION PAGE
 * 
 * New user account creation page for CloudVault.
 * Collects name, email, and password from user.
 * Validates password length before submission.
 * On successful registration, redirects to login page.
 * 
 * Features:
 * - Three-field form (name, email, password)
 * - Client-side password validation (min 6 characters)
 * - Error message display
 * - Loading state during registration
 * - Redirect to login page after successful registration
 */

import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Navigation hook
  const navigate = useNavigate();

  /**
   * Handle registration form submission
   * 
   * Process:
   * 1. Prevents default form submission
   * 2. Validates password length (minimum 6 characters)
   * 3. Sends registration request to /auth/register
   * 4. Redirects to /login on success for user to login
   * 5. Displays error message on failure
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Client-side validation: password must be at least 6 characters
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send registration request with name, email, and password
      await api.post('/auth/register', { name, email, password });
      
      // Redirect to login page to authenticate with new account
      navigate('/login');
    } catch (err) {
      // Display error message from API or generic message
      setError(err.response?.data?.error || 'Registration failed.');
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
          <h1 className="auth-hero-title">Your files,<br/>your cloud.</h1>
          <p className="auth-hero-sub">Join thousands of users who trust CloudVault to store, share, and manage their most important files.</p>
          <div className="auth-stats">
            <div className="auth-stat"><div className="auth-stat-num">50GB</div><div className="auth-stat-label">Free storage</div></div>
            <div className="auth-stat-div"/>
            <div className="auth-stat"><div className="auth-stat-num">256-bit</div><div className="auth-stat-label">Encryption</div></div>
            <div className="auth-stat-div"/>
            <div className="auth-stat"><div className="auth-stat-num">99.9%</div><div className="auth-stat-label">Uptime SLA</div></div>
          </div>
        </div>
        <div className="auth-grid-bg"/>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create account</h2>
            <p className="auth-form-sub">Get started with 50GB free storage</p>
          </div>

          {error && <div className="auth-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input className="field-input" type="text" placeholder="Arjun Kumar" value={name} onChange={e => setName(e.target.value)} required autoFocus/>
            </div>
            <div className="field-group">
              <label className="field-label">Email address</label>
              <input className="field-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required/>
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required/>
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="btn-spinner"/> : 'Create free account'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}