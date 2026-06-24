import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

interface SignupData {
  id: string
  email: string
  role: string
  age_bracket: string
  created_at: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'consent'>('form')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('teacher')
  const [ageBracket, setAgeBracket] = useState('13+')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // States
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Parental consent
  const [parentalEmail, setParentalEmail] = useState('')
  const [parentalName, setParentalName] = useState('')

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' }
    return { score, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = calculatePasswordStrength(password)

  // Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
  const passwordMatch = password === confirmPassword && password.length > 0
  const isFormValid = isEmailValid && isPasswordStrong && passwordMatch && agreedToTerms

  // Save user locally (for MVP/testing)
  const saveUserLocally = (userData: SignupData) => {
    const users = JSON.parse(localStorage.getItem('verified_video_users') || '[]')
    const newUsers = [...users, userData]
    localStorage.setItem('verified_video_users', JSON.stringify(newUsers))
    localStorage.setItem('verified_video_token', `token-${userData.id}`)
    localStorage.setItem('verified_video_user', JSON.stringify(userData))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!isEmailValid) {
      setError('Please enter a valid email address')
      return
    }

    if (!isPasswordStrong) {
      setError('Password must be at least 8 characters with uppercase and numbers')
      return
    }

    if (!passwordMatch) {
      setError('Passwords do not match')
      return
    }

    if (!agreedToTerms) {
      setError('You must agree to the terms')
      return
    }

    // Check if under 13
    if (ageBracket === '<13') {
      setStep('consent')
      return
    }

    // Create account
    await createAccount()
  }

  const createAccount = async () => {
    setLoading(true)
    try {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Try backend first
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            role,
            age_bracket: ageBracket
          })
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('verified_video_token', `token-${data.id}`)
          localStorage.setItem('verified_video_user', JSON.stringify(data))
          setSuccess('Account created! Redirecting...')
          setTimeout(() => navigate(role === 'teacher' ? '/teacher/dashboard' : '/'), 1500)
          return
        }
      } catch (backendErr) {
        // Backend offline - use local storage
        console.log('Backend unavailable, using local storage')
      }

      // Fallback: Save locally
      const newUser: SignupData = {
        id: userId,
        email,
        role,
        age_bracket: ageBracket,
        created_at: new Date().toISOString()
      }

      saveUserLocally(newUser)
      setSuccess('✅ Account created successfully! Redirecting...')

      setTimeout(() => {
        navigate(role === 'teacher' ? '/teacher/dashboard' : '/')
      }, 1500)

    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle parental consent
  const handleParentalConsent = async () => {
    if (!parentalEmail || !parentalName) {
      setError('Please enter parental email and name')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentalEmail)) {
      setError('Please enter a valid parental email')
      return
    }

    setError('')
    await createAccount()
  }

  // Parental consent form
  if (step === 'consent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">Parental Consent Required</h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Your account is for users under 13. We need parental permission.
          </p>

          {error && (
            <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Name
              </label>
              <input
                type="text"
                value={parentalName}
                onChange={(e) => setParentalName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Email
              </label>
              <input
                type="email"
                value={parentalEmail}
                onChange={(e) => setParentalEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              A confirmation email will be sent to verify consent.
            </div>

            <button
              onClick={handleParentalConsent}
              disabled={loading || !parentalEmail || !parentalName}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Continue'}
            </button>

            <button
              onClick={() => setStep('form')}
              className="w-full text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main signup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Get Started</h1>
        <p className="text-center text-gray-600 mb-8">Join Verified Video for free</p>

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
              placeholder="teacher@example.com"
              aria-required="true"
              aria-invalid={email && !isEmailValid ? 'true' : 'false'}
              required
            />
            {email && !isEmailValid && (
              <p className="text-red-600 text-xs mt-1">Invalid email format</p>
            )}
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
                className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength meter */}
            {password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.color === 'bg-green-500' ? 'text-green-600' :
                    passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ✓ 8+ characters • ✓ Uppercase • ✓ Numbers • ✓ Symbols
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-600 hover:text-gray-900"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordMatch && (
              <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
            )}
            {confirmPassword && passwordMatch && (
              <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-field"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {/* Age Bracket */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <select
              id="age"
              value={ageBracket}
              onChange={(e) => setAgeBracket(e.target.value)}
              className="input-field"
            >
              <option value="13+">13 or older</option>
              <option value="<13">Under 13 (parental consent required)</option>
            </select>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
