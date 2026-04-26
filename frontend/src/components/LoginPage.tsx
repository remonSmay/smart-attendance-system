import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import BrandLogo from './ui/BrandLogo'
import Button from './ui/Button'
import Field from './ui/Field'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

interface FormErrors {
  email?: string
  password?: string
}

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function LoginPage({
  onLogin,
  isLoading,
  error,
  onClearError,
}: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) {
      setFormErrors((current) => ({ ...current, [field]: undefined }))
    }

    if (error) {
      onClearError()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    await onLogin(email.trim(), password)
  }

  return (
    <div className="ui-auth-page login-page">
      <div className="ui-auth-card ui-auth-card--compact animate-fade-up">
        <div className="ui-auth-header">
          <BrandLogo centered large subtitle="Smart attendance platform" />
          <div className="ui-fields" style={{ gap: 'var(--space-2)' }}>
            <p className="ui-auth-kicker">Welcome back</p>
            <h1 className="ui-auth-title">Sign in to your workspace</h1>
            <p className="ui-auth-description">
              Access courses, analytics, attendance sessions, and administration from one consistent workspace.
            </p>
          </div>
        </div>

        {error ? (
          <section className="ui-alert ui-alert--error" role="alert">
            <p className="ui-alert__content">{error}</p>
            <button type="button" className="ui-link-button" onClick={onClearError}>
              Dismiss
            </button>
          </section>
        ) : null}

        <form className="ui-fields" onSubmit={handleSubmit} noValidate>
          <Field label="Email address" htmlFor="login-email" error={formErrors.email}>
            <input
              id="login-email"
              type="email"
              className="ui-input"
              placeholder="name@university.edu"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                clearFieldError('email')
              }}
              disabled={isLoading}
              autoComplete="email"
            />
          </Field>

          <Field label="Password" htmlFor="login-password" error={formErrors.password}>
            <div className="ui-password">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="ui-input"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                }}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ui-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <div className="ui-meta-row">
            <label className="ui-check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="ui-link-button"
              onClick={(event) => event.preventDefault()}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" loading={isLoading} fullWidth size="lg">
            {isLoading ? 'Signing in' : 'Sign in'}
          </Button>
        </form>

        <div className="ui-social-row">
          <div className="ui-divider">
            <span>or continue with</span>
          </div>
          <div className="login-social-grid">
            <Button type="button" variant="secondary" fullWidth>
              Google
            </Button>
            <Button type="button" variant="secondary" fullWidth>
              Microsoft
            </Button>
          </div>
        </div>

        <div className="ui-auth-footer">
          <p className="ui-auth-description">
            New to Attendu? <Link to="/register">Create an account</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
