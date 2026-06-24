import { useParams } from 'react-router-dom'

export default function StudentWatchPage() {
  const { sessionKey } = useParams<{ sessionKey: string }>()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Watch Video</h1>

        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">Loading session: {sessionKey}</p>
          <div className="flex justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
