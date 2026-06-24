import { Link } from 'react-router-dom'
import { useAuth } from '@/services/auth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-elevation-1">
        <h1 className="text-2xl font-bold text-primary-600">Verified Video</h1>
        <div className="flex gap-4">
          {user ? (
            <>
              <span className="text-gray-600">{user.email}</span>
              {user.role === 'teacher' && (
                <Link to="/teacher/dashboard" className="btn-primary btn-small">
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary btn-small">
                Login
              </Link>
              <Link to="/signup" className="btn-primary btn-small">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto">
          Smart Learning. <span className="text-primary-600">Privacy First.</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          The engagement verification platform built for K-12 educators who believe in privacy over surveillance.
        </p>

        {!user && (
          <div className="flex gap-4 justify-center">
            <Link to="/signup" className="btn-primary">
              Start Free Trial
            </Link>
            <Link to="/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Why Verified Video?</h3>
          <div className="responsive-grid">
            <div className="card">
              <div className="text-4xl mb-4">🔒</div>
              <h4 className="text-lg font-semibold mb-2">Privacy First</h4>
              <p className="text-gray-600">No video recording. Encrypted sessions. Auto-deleted after 30 days.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">👁️</div>
              <h4 className="text-lg font-semibold mb-2">Smart Detection</h4>
              <p className="text-gray-600">Face presence + attention scoring. Non-invasive verification.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-semibold mb-2">Real Analytics</h4>
              <p className="text-gray-600">Completion rates, attention scores, and behavioral insights.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">✓</div>
              <h4 className="text-lg font-semibold mb-2">COPPA Compliant</h4>
              <p className="text-gray-600">Built for minors. Parental consent flows included.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold mb-2">Instant Setup</h4>
              <p className="text-gray-600">Paste a URL, get a link, share with students. Done.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🌐</div>
              <h4 className="text-lg font-semibold mb-2">Free to Start</h4>
              <p className="text-gray-600">No credit card. 14-day free trial. Scales with you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gradient-primary text-white text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to Verify Your Classroom?</h3>
        <p className="text-lg mb-8 max-w-2xl mx-auto">
          Teachers assign videos. Students watch—verified. No cheating. No surveillance. Just trust.
        </p>
        <Link to="/signup" className="inline-block bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors">
          Start Free Trial
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-gray-900 text-gray-300 text-center">
        <p>&copy; 2024 Verified Video. Privacy First. All rights reserved.</p>
      </footer>
    </div>
  )
}
