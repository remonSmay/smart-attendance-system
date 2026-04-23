import { Link } from "react-router-dom"
import { useState } from 'react';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage = ({ onLogin, isLoading, error, onClearError }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUnavailable, setLogoUnavailable] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    onClearError();
    if (formErrors.email) {
      setFormErrors({ ...formErrors, email: undefined });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    onClearError();
    if (formErrors.password) {
      setFormErrors({ ...formErrors, password: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-shape login-bg-shape-left" aria-hidden="true" />
      <div className="login-bg-shape login-bg-shape-right" aria-hidden="true" />

      <div className="login-card-shell">
        <div className="form-content">
          <div className="brand-block">
            {!logoUnavailable ? (
              <img
                className="brand-logo"
                src="/attendu-logo.png"
                alt="Attendu logo"
                onError={() => setLogoUnavailable(true)}
              />
            ) : (
              <div className="brand-logo-fallback" aria-label="Attendu logo fallback">
                ATTENDU
              </div>
            )}
            <p className="brand-subtitle">Smart Attendance Platform</p>
          </div>

          <div className="form-header">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Sign in to manage sessions and attendance records.</p>
          </div>

          {error && (
            <div className="error-alert">
              <p className="error-message">{error}</p>
              <button
                className="error-dismiss"
                onClick={onClearError}
                type="button"
                aria-label="Dismiss error"
              >
                X
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                placeholder="name@university.edu"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                autoComplete="email"
              />
              {formErrors.email && (
                <p className="field-error">{formErrors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input password-input ${
                    formErrors.password ? 'input-error' : ''
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-4.5-11-4.5s1.6-2.89 4.07-4.5m4.83-3.78A4.99 4.99 0 0 1 12 8c2.76 0 5 2.24 5 5" />
                      <path d="M9.9 4A10.07 10.07 0 0 1 12 4c7 0 11 4.5 11 4.5s-1.6 2.89-4.07 4.5M6.5 6.5L2 2" />
                      <path d="M22 22L2 2" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="field-error">{formErrors.password}</p>
              )}
            </div>

            <div className="form-meta-row">
              <label className="remember-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              <a className="forgot-link" href="#" onClick={(event) => event.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="sign-in-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="social-block" aria-label="Social login options">
            <div className="social-divider">
              <span>or continue with</span>
            </div>
            <div className="social-buttons">
              <button type="button" className="social-button" disabled={isLoading}>
                <span className="social-icon" aria-hidden="true">G</span>
                Google
              </button>
              <button type="button" className="social-button" disabled={isLoading}>
                <span className="social-icon" aria-hidden="true">M</span>
                Microsoft
              </button>
            </div>
          </div>

          <p className="footer-text">
            Don't have an account? <Link to="/register">Create one here</Link>. 
            <br />
            Secure access for instructors and admins.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
