import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Demo credentials hint
  const demoAccounts = [
    { email: 'teacher@test.com', password: 'password123', role: 'teacher' },
    { email: 'student@test.com', password: 'password123', role: 'student' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validation
      if (!email || !password) {
        setError('Please enter email and password')
        setLoading(false)
        return
      }

      // Check local users first
      const users = JSON.parse(localStorage.getItem('verified_video_users') || '[]')
      const user = users.find((u: any) => u.email === email)

      if (user && password === 'password123') {
        // Local user found (for development)
        localStorage.setItem('verified_video_token', `token-${user.id}`)
        localStorage.setItem('verified_video_user', JSON.stringify(user))
        setSuccess('✅ Logged in! Redirecting...')

        setTimeout(() => {
          navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/')
        }, 1000)
        return
      }

      // Try backend
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (response.ok) {
          const data = await response.json()
          const token = data.access_token || `token-${data.id}`

          if (rememberMe) {
            localStorage.setItem('verified_video_remember_email', email)
          }

          localStorage.setItem('verified_video_token', token)
          localStorage.setItem('verified_video_user', JSON.stringify(data.user || data))

          setSuccess('✅ Logged in! Redirecting...')
          setTimeout(() => {
            navigate(data.user?.role === 'teacher' ? '/teacher/dashboard' : '/teacher/dashboard')
          }, 1000)
          return
        }
      } catch (backendErr) {
        // Backend offline - check demo accounts
        console.log('Backend unavailable, checking demo accounts...')
      }

      // Check demo accounts (development)
      const demoUser = demoAccounts.find(acc => acc.email === email && acc.password === password)
      if (demoUser) {
        const mockUser = {
          id: `demo-${Date.now()}`,
          email,
          role: demoUser.role,
          age_bracket: '13+',
          created_at: new Date().toISOString()
        }

        if (rememberMe) {
          localStorage.setItem('verified_video_remember_email', email)
        }

        localStorage.setItem('verified_video_token', `token-${mockUser.id}`)
        localStorage.setItem('verified_video_user', JSON.stringify(mockUser))

        setSuccess('✅ Demo login! Redirecting...')
        setTimeout(() => {
          navigate(demoUser.role === 'teacher' ? '/teacher/dashboard' : '/')
        }, 1000)
        return
      }

      setError('Invalid email or password')

    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fill demo credentials
  const fillDemoCredentials = (role: string) => {
    const demo = demoAccounts.find(acc => acc.role === role)
    if (demo) {
      setEmail(demo.email)
      setPassword(demo.password)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Welcome Back</h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {error && (
          <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div role="alert" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              aria-required="true"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Accounts (Development) */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">Demo accounts (development only):</p>
          <div className="space-y-2">
            <button
              onClick={() => fillDemoCredentials('teacher')}
              className="w-full text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
            >
              Demo Teacher
            </button>
            <button
              onClick={() => fillDemoCredentials('student')}
              className="w-full text-sm py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
            >
              Demo Student
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}
