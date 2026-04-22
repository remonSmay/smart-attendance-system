import { useState } from 'react'
import LoginPage from './components/LoginPage'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call - replace with actual backend call
      // const response = await fetch('http://localhost:8000/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // })
      // if (!response.ok) {
      //   throw new Error('Invalid email or password')
      // }
      // const data = await response.json()
      // Store token and redirect to dashboard

      // Mock success after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Login successful for:', email)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearError = () => {
    setError(null)
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      isLoading={isLoading}
      error={error}
      onClearError={handleClearError}
    />
  )
}

export default App
