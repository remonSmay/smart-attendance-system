import { Routes, Route, Navigate } from 'react-router-dom'

import DashboardPlaceholder from './components/DashboardPlaceholder'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import { useAuthActions } from './features/auth/hooks/useAuthActions'
import ProtectedRoute from './routes/ProtectedRoute'
import './App.css'

function App() {
  const { isLoading, error, login, register, clearError, logout } = useAuthActions()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={login}
            isLoading={isLoading}
            error={error}
            onClearError={clearError}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            onRegister={register}
            isLoading={isLoading}
            error={error}
            onClearError={clearError}
          />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPlaceholder onLogout={logout} />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
