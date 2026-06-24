import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Copy, Check, Play, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface Session {
  id: string
  session_key: string
  video_url: string
  title: string
  description?: string
  created_at: string
  share_url: string
  completion_count?: number
}

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const [videoUrl, setVideoUrl] = useState('')
  const [title, setTitle] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API}/api/sessions`)
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
          return
        }
      } catch {
        // Backend offline — use localStorage
      }

      const stored = localStorage.getItem('verified_video_sessions')
      if (stored) {
        setSessions(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  const handleCreateSession = async () => {
    setError('')
    setSuccess('')

    if (!title.trim()) {
      setError('Please enter a session title')
      return
    }
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://')
      return
    }

    setLoading(true)
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const sessionKey = `key-${Math.random().toString(36).substr(2, 8)}`

      const newSession: Session = {
        id: sessionId,
        session_key: sessionKey,
        video_url: videoUrl,
        title: title.trim(),
        description: '',
        created_at: new Date().toISOString(),
        share_url: `${window.location.origin}/watch/${sessionKey}`,
        completion_count: 0
      }

      let createdSession = newSession
      try {
        const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: videoUrl, title: title.trim(), description: '' })
        })
        if (response.ok) {
          createdSession = await response.json()
        }
      } catch {
        // Backend offline — use local session
      }

      const updatedSessions = [...sessions, createdSession]
      setSessions(updatedSessions)
      localStorage.setItem('verified_video_sessions', JSON.stringify(updatedSessions))
      setVideoUrl('')
      setTitle('')
      setSuccess(`Session created! Share link: ${createdSession.share_url}`)
    } catch (err) {
      console.error('Create session error:', err)
      setError('Failed to create session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleLogout = () => {
    localStorage.removeItem('verified_video_token')
    localStorage.removeItem('verified_video_user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-blue-600">Verified Video</h1>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-gray-900">Teacher Dashboard</h2>

        {/* Notifications */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div role="alert" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        {/* Create Session */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg md:text-xl font-semibold mb-2">Create New Session</h3>
          <p className="text-gray-600 text-sm mb-6">Paste a YouTube URL to create a new learning session</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="session-title" className="block text-sm font-medium text-gray-700 mb-2">
                Video Title <span aria-hidden="true">*</span>
              </label>
              <input
                id="session-title"
                type="text"
                placeholder="e.g., Biology 101: Cell Division"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-required="true"
                aria-invalid={!title && !!error ? 'true' : 'false'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL <span aria-hidden="true">*</span>
              </label>
              <input
                id="video-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                aria-required="true"
                aria-invalid={!videoUrl && !!error ? 'true' : 'false'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg md:text-xl font-semibold mb-6">
            Your Sessions {!sessionsLoading && `(${sessions.length})`}
          </h3>

          {sessionsLoading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full" aria-label="Loading sessions" />
              <p className="text-gray-500 text-sm">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No sessions yet. Create one above to get started.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 truncate">{session.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">
                        {session.completion_count || 0}
                      </div>
                      <div className="text-xs text-gray-500">completions</div>
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between gap-2">
                    <code className="text-xs text-gray-700 break-all flex-1 min-w-0">
                      {session.share_url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(session.share_url, session.session_key)}
                      aria-label={copiedKey === session.session_key ? 'Copied!' : 'Copy share link'}
                      className="p-2 hover:bg-gray-200 rounded flex-shrink-0 transition"
                    >
                      {copiedKey === session.session_key ? (
                        <Check className="text-green-600" size={18} aria-hidden="true" />
                      ) : (
                        <Copy className="text-gray-600" size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={session.share_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Play size={16} aria-hidden="true" />
                      Preview
                    </a>
                    <button
                      aria-label={`Delete session ${session.title}`}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
