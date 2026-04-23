import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

const NETWORK_ERROR_MESSAGE =
  'Cannot reach the backend API. Make sure the FastAPI server is running on http://localhost:8000 and CORS allows http://localhost:5173.'

const parseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }
    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const DashboardPlaceholder = () => {
  const navigate = useNavigate()
  return (
    <div className="dashboard-placeholder">
      <h1>Dashboard (Placeholder)</h1>
      <button
        type="button"
        className="dashboard-placeholder-logout"
        onClick={() => {
          localStorage.clear()
          navigate('/login')
        }}
      >
        Log Out
      </button>
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'Invalid email or password')
        throw new Error(message)
      }

      const data = await response.json()

      localStorage.setItem('access_token', data.tokens.access_token)
      localStorage.setItem('refresh_token', data.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      console.log('Login successful for:', email)
      navigate('/dashboard')
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? NETWORK_ERROR_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (registerData: Record<string, string>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      })

      if (!response.ok) {
        const message = await parseErrorMessage(
          response,
          'Registration failed. Please check your information.',
        )
        throw new Error(message)
      }

      const data = await response.json()

      localStorage.setItem('access_token', data.tokens.access_token)
      localStorage.setItem('refresh_token', data.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      console.log('Register successful for:', registerData.email)
      navigate('/dashboard')
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? NETWORK_ERROR_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearError = () => {
    setError(null)
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={handleLogin}
            isLoading={isLoading}
            error={error}
            onClearError={handleClearError}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onRegister={handleRegister}
            isLoading={isLoading}
            error={error}
            onClearError={handleClearError}
          />
        }
      />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
