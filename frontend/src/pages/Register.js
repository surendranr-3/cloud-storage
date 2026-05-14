/**
 * REGISTRATION PAGE - MODERN DESIGN
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
 * - Password strength indicator
 * - Modern UI matching login page
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  
  // Navigation hook
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return Math.min(strength, 4);
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthText = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#10b981'][passwordStrength];

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
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* LEFT SIDE - SAME AS LOGIN */}
      <div className="auth-left">
        
        <div className="auth-orb orb1" />
        <div className="auth-orb orb2" />
        <div className="auth-orb orb3" />

        <div className="auth-brand">
          <div className="brand-logo">
            ☁
          </div>
          <div className="brand-name">
            CloudVault
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            Join the Future of Cloud Storage
          </div>
          
          <h1>
            Your files,
            <br />
            your cloud.
          </h1>
          
          <p>
            Join thousands of users who trust CloudVault to store, 
            share, and manage their most important files securely.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <span>💾</span>
              <div>
                <h4>50GB Free</h4>
                <p>Start with generous space</p>
              </div>
            </div>
            
            <div className="feature-card">
              <span>🔒</span>
              <div>
                <h4>256-bit Encryption</h4>
                <p>Military-grade security</p>
              </div>
            </div>
            
            <div className="feature-card">
              <span>🚀</span>
              <div>
                <h4>Fast Uploads</h4>
                <p>CDN optimized delivery</p>
              </div>
            </div>
            
            <div className="feature-card">
              <span>🔄</span>
              <div>
                <h4>Auto Sync</h4>
                <p>Across all devices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - REGISTRATION FORM */}
      <div className="auth-right">
        
        <div className="auth-card">
          
          <div className="auth-header">
            <h2>Create account</h2>
            <p>Get started with 50GB free storage</p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            
            {/* FULL NAME */}
            <div className="field-group">
              <label>Full name</label>
              <div className={`input-wrapper ${focused === 'name' ? 'focused' : ''}`}>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="field-group">
              <label>Email address</label>
              <div className={`input-wrapper ${focused === 'email' ? 'focused' : ''}`}>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="field-group">
              <label>Password</label>
              <div className={`input-wrapper ${focused === 'password' ? 'focused' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  required
                />
                <button
                  type="button"
                  className="show-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(passwordStrength / 4) * 100}%`,
                        backgroundColor: strengthColor
                      }}
                    />
                  </div>
                  <span className="strength-text" style={{ color: strengthColor }}>
                    {strengthText} password
                  </span>
                </div>
              )}
              
              <div className="password-hint">
                Use 6+ characters with letters, numbers & symbols
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                  Creating account...
                </div>
              ) : (
                'Create free account'
              )}
            </button>

          </form>

          {/* FOOTER */}
          <div className="auth-footer">
            Already have an account?
            <Link to="/login" className="register-link">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}