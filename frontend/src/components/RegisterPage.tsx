import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { RegisterPayload } from '../features/auth/types/authTypes'
import './RegisterPage.css'

interface RegisterPageProps {
  onRegister: (data: RegisterPayload) => Promise<void>
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

export default function RegisterPage({
  onRegister,
  isLoading,
  error,
  onClearError,
}: RegisterPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [logoUnavailable, setLogoUnavailable] = useState(false)
  const [role, setRole] = useState<'admin' | 'instructor'>('instructor')
  const [validationError, setValidationError] = useState<string | null>(null)

  const clearErrors = () => {
    if (validationError) {
      setValidationError(null)
    }

    if (error) {
      onClearError()
    }
  }

  const handleInputChange =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
      clearErrors()
    }

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters long.')
      return
    }
    if (fullName.trim().length > 100) {
      setValidationError('Full name must be at most 100 characters long.')
      return
    }
    if (!validateEmail(email.trim())) {
      setValidationError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.')
      return
    }
    if (password.length > 128) {
      setValidationError('Password must be at most 128 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    setValidationError(null)
    onRegister({ full_name: fullName.trim(), email: email.trim(), password, role })
  }

  const displayError = validationError || error

  return (
    <div className="register-container">
      <div className="register-bg-shape register-bg-shape-left" aria-hidden="true" />
      <div className="register-bg-shape register-bg-shape-right" aria-hidden="true" />

      <div className="register-card-shell">
        <div className="register-content">
          <div className="register-brand-block">
            {!logoUnavailable ? (
              <img
                className="register-brand-logo"
                src="/attendu-logo.png"
                alt="Attendu logo"
                onError={() => setLogoUnavailable(true)}
              />
            ) : (
              <div className="register-brand-logo-fallback" aria-label="Attendu logo fallback">
                ATTENDU
              </div>
            )}
            <p className="register-brand-subtitle">Create your instructor or admin account</p>
          </div>

          <div className="register-header">
            <h1 className="register-title">Create account</h1>
            <p className="register-subtitle">Get started with smart attendance management.</p>
          </div>

          {displayError && (
            <div className="register-error-alert" role="alert">
              <p className="register-error-message">{displayError}</p>
              <button
                className="register-error-dismiss"
                onClick={clearErrors}
                type="button"
                aria-label="Dismiss error"
              >
                X
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className="register-form-grid">
              <div className="register-form-group register-form-group-full">
                <label htmlFor="fullName" className="register-form-label">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  className="register-form-input"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={handleInputChange(setFullName)}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="register-form-group register-form-group-full">
                <label htmlFor="email" className="register-form-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="register-form-input"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="register-form-group register-form-group-full">
                <p className="register-form-label register-role-label">Role</p>
                <div className="register-role-grid">
                  <label className="register-role-option">
                    <input
                      type="radio"
                      name="role"
                      value="instructor"
                      checked={role === 'instructor'}
                      onChange={() => {
                        setRole('instructor')
                        clearErrors()
                      }}
                      disabled={isLoading}
                    />
                    <span>
                      <strong>Instructor</strong>
                      <small>Manage own sections</small>
                    </span>
                  </label>

                  <label className="register-role-option">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => {
                        setRole('admin')
                        clearErrors()
                      }}
                      disabled={isLoading}
                    />
                    <span>
                      <strong>Admin</strong>
                      <small>Access all courses and reports</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="register-form-group">
                <label htmlFor="password" className="register-form-label">Password</label>
                <div className="register-password-field">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="register-form-input register-password-input"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="register-form-group">
                <label htmlFor="confirmPassword" className="register-form-label">Confirm password</label>
                <div className="register-password-field">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="register-form-input register-password-input"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={handleInputChange(setConfirmPassword)}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="register-submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="register-spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="register-footer-text">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
