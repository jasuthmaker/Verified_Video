import { useAuth } from '@/services/auth'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-elevation-1">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Verified Video</h1>
          <div className="flex gap-4 items-center">
            <span className="text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="btn-secondary btn-small">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Teacher Dashboard</h2>

        {/* Section 1: Create Session */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold mb-4">Create New Session</h3>
          <p className="text-gray-600 mb-4">Paste a YouTube URL or video link to create a new learning session.</p>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Paste video URL here..."
              className="input-field flex-1"
            />
            <button className="btn-primary btn-small">
              Create Session
            </button>
          </div>
        </div>

        {/* Section 2: Active Sessions */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Your Sessions</h3>
          <p className="text-gray-600">No sessions yet. Create one above to get started.</p>
        </div>
      </div>
    </div>
  )
}
