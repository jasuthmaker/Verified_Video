import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import { AuthProvider } from './services/auth'

// Pages
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentWatchPage from './pages/StudentWatch'
import NotFoundPage from './pages/NotFound'

// Components
import LoadingSpinner from './components/shared/LoadingSpinner'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={isAuthenticated ? <TeacherDashboard /> : <Navigate to="/login" />}
          />

          {/* Student routes */}
          <Route
            path="/watch/:sessionKey"
            element={<StudentWatchPage />}
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
