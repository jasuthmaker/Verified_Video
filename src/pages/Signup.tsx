import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/services/auth'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [ageBracket, setAgeBracket] = useState<'13+' | '<13'>('13+')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password, role, ageBracket)
      if (role === 'teacher') {
        navigate('/teacher/dashboard')
      }
    } catch (err) {
      setError(authError || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Get Started</h1>
        <p className="text-center text-gray-600 mb-8">Join Verified Video for free</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
              className="input-field"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <select
              id="age"
              value={ageBracket}
              onChange={(e) => setAgeBracket(e.target.value as '13+' | '<13')}
              className="input-field"
            >
              <option value="13+">13 or older</option>
              <option value="<13">Under 13 (parental consent required)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
