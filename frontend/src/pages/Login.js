/**
 * LOGIN PAGE - MODERN AUTHENTICATION UI
 * 
 * User authentication page for CloudVault cloud storage.
 * Allows users to log in with email and password.
 * Supports "Remember Me" functionality to save email for future logins.
 * Stores JWT token and user information in localStorage on successful login.
 * 
 * Features:
 * - Email validation with regex pattern matching
 * - Password visibility toggle
 * - "Remember Me" checkbox to auto-fill email
 * - Loading state during authentication request
 * - Error message display for invalid credentials
 * - Password field clears on login failure for security
 * - Automatic redirect to dashboard on successful login
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../api';
import './Auth.css';

export default function Login() {
  // Navigation hook for redirecting after successful login
  const navigate = useNavigate();

  // Form state for email and password input fields
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  // Whether to remember user's email for next login
  const [rememberMe, setRememberMe] = useState(false);

  // Whether to show password as plain text or masked
  const [showPassword, setShowPassword] = useState(false);

  // Loading indicator during API authentication request
  const [loading, setLoading] = useState(false);

  // Error message to display if login fails (invalid credentials, etc)
  const [error, setError] = useState('');

  // Tracks which form field currently has focus for styling
  const [focused, setFocused] = useState('');

  /* =========================================
     LOAD SAVED EMAIL
     On component mount, check localStorage for:
     - Previously saved email (if "Remember Me" was checked)
     - "Remember Me" preference from last login
     Pre-fills email field and checks "Remember Me" checkbox
  ========================================= */

  useEffect(() => {
    // Retrieve previously saved email from localStorage
    const savedEmail = localStorage.getItem('savedEmail');

    // Check if user had "Remember Me" enabled last time
    const remember = localStorage.getItem('rememberMe') === 'true';

    // If both exist, restore them to the form
    if (savedEmail && remember) {
      setForm((prev) => ({
        ...prev,
        email: savedEmail,
      }));

      setRememberMe(true);
    }
  }, []);

  /* =========================================
     HANDLE INPUT CHANGE
     Updates form state when user types in email or password field
  ========================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the specific field in form state
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================
     FORM VALIDATION
     Checks that all fields are filled and email is valid format
     Returns error message if validation fails, null if valid
  ========================================= */

  const validate = () => {
    // Check both fields are not empty
    if (!form.email || !form.password) {
      return 'Please fill all fields';
    }

    // Validate email format with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      return 'Enter valid email';
    }

    return null;
  };

  /* =========================================
     HANDLE LOGIN SUBMISSION
     Validates form, sends API request, stores JWT token and user info
  ========================================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate form data before submission
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Send login request with email and password
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      /* ===== SAVE JWT TOKEN ===== */
      // Store JWT token for authenticated API requests
      localStorage.setItem('token', data.token);

      /* ===== SAVE USER INFORMATION ===== */
      // Store user details from response (or use fallback values)
      const user = data.user || {};

      localStorage.setItem('userId', user.id || '');
      localStorage.setItem('userEmail', user.email || form.email);
      localStorage.setItem('userName', user.name || form.email.split('@')[0]);

      /* ===== HANDLE REMEMBER ME ===== */
      // If "Remember Me" is checked, save email for next login
      if (rememberMe) {
        localStorage.setItem('savedEmail', form.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Otherwise, clear saved email
        localStorage.removeItem('savedEmail');
        localStorage.setItem('rememberMe', 'false');
      }

      /* ===== REDIRECT TO DASHBOARD ===== */
      // Navigate to dashboard after successful authentication
      navigate('/dashboard');

    } catch (err) {
      console.error(err);

      // Display error message from API or generic message
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Invalid email or password'
      );

      // Clear password field for security on failed login
      setForm((prev) => ({
        ...prev,
        password: '',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">

      {/* =====================================
          LEFT SIDE
      ===================================== */}

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
            Trusted Secure Cloud Storage
          </div>

          <h1>
            Store everything.
            <br />
            Access anywhere.
          </h1>

          <p>
            Enterprise-grade cloud storage
            platform with secure sharing,
            encryption, file versioning,
            and lightning-fast uploads.
          </p>

          <div className="feature-grid">

            <div className="feature-card">
              <span>🔒</span>
              <div>
                <h4>
                  AES-256 Security
                </h4>
                <p>
                  Bank-grade encryption
                </p>
              </div>
            </div>

            <div className="feature-card">
              <span>⚡</span>
              <div>
                <h4>
                  Fast Uploads
                </h4>
                <p>
                  CDN optimized
                </p>
              </div>
            </div>

            <div className="feature-card">
              <span>👥</span>
              <div>
                <h4>
                  Team Sharing
                </h4>
                <p>
                  Role-based access
                </p>
              </div>
            </div>

            <div className="feature-card">
              <span>🛡</span>
              <div>
                <h4>
                  File Recovery
                </h4>
                <p>
                  Version history support
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================
          RIGHT SIDE
      ===================================== */}

      <div className="auth-right">

        <div className="auth-card">

          <div className="auth-header">
            <h2>
              Welcome Back
            </h2>

            <p>
              Login to continue
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="auth-form"
          >

            {/* EMAIL */}

            <div className="field-group">

              <label>
                Email Address
              </label>

              <div
                className={`input-wrapper ${
                  focused === 'email'
                    ? 'focused'
                    : ''
                }`}
              >
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() =>
                    setFocused('email')
                  }
                  onBlur={() =>
                    setFocused('')
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="field-group">

              <label>
                Password
              </label>

              <div
                className={`input-wrapper ${
                  focused === 'password'
                    ? 'focused'
                    : ''
                }`}
              >
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() =>
                    setFocused('password')
                  }
                  onBlur={() =>
                    setFocused('')
                  }
                />

                <button
                  type="button"
                  className="show-btn"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </button>
              </div>
            </div>

            {/* BUTTON */}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                  Logging in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* FOOTER */}

          <div className="auth-footer">
            Don&apos;t have an account?

            <Link
              to="/register"
              className="register-link"
            >
              Create Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}