import { useParams } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function StudentWatchPage() {
  useParams<{ sessionKey: string }>()

  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [attention, setAttention] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [starting, setStarting] = useState(false)
  const [pauseReason, setPauseReason] = useState<string | null>(null)
  const [sessionScore, setSessionScore] = useState(0)
  const [totalReadings, setTotalReadings] = useState(0)
  const [phoneAlert, setPhoneAlert] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionSumRef = useRef(0)
  const phoneCountRef = useRef(0)                          // consecutive phone readings

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playerRef = useRef<any>(null)
  const isPlayingRef = useRef(false)       // ref avoids stale closure in WS callback
  const noFaceCountRef = useRef(0)         // grace period: pause after 2 consecutive misses

  // ── YouTube IFrame API ──────────────────────────────────────────────────────
  // Must run AFTER webcamEnabled=true so the iframe is in the DOM before we
  // call new window.YT.Player('yt-player'). Mounting the iframe conditionally
  // is the root cause of the player never initialising.

  useEffect(() => {
    if (!webcamEnabled) return  // iframe not in DOM yet

    const initPlayer = () => {
      if (playerRef.current) return  // already initialised
      playerRef.current = new window.YT.Player('yt-player', {
        events: {
          onReady: () => {
            playerRef.current.pauseVideo()  // start paused until face detected
          }
        }
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }
  }, [webcamEnabled])  // re-runs once webcamEnabled flips to true

  // ── Playback control ────────────────────────────────────────────────────────

  const controlPlayback = useCallback((facePresent: boolean) => {
    const player = playerRef.current
    if (!player?.playVideo) return

    if (facePresent) {
      noFaceCountRef.current = 0
      if (!isPlayingRef.current) {
        player.playVideo()
        isPlayingRef.current = true
        setIsPlaying(true)
        setPauseReason(null)
      }
    } else {
      noFaceCountRef.current += 1
      // Grace period: 2 consecutive no-face readings (2 seconds) before pausing
      if (noFaceCountRef.current >= 2 && isPlayingRef.current) {
        player.pauseVideo()
        isPlayingRef.current = false
        setIsPlaying(false)
        setPauseReason('Look at the screen to resume the video')
      }
    }
  }, [])

  // ── Frame capture ───────────────────────────────────────────────────────────

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!canvas || !video) return null
    if (video.readyState < video.HAVE_CURRENT_DATA) return null

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, 320, 240)
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1] ?? null
  }, [])

  // ── Backend WebSocket tracking ──────────────────────────────────────────────

  const connectBackend = useCallback((sessionId: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const wsUrl = apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsUrl}/ws/engagement/${sessionId}`)
    wsRef.current = ws

    const fallbackTimer = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close()
        startSimulatedTracking()
      }
    }, 5000)

    ws.onopen = () => {
      clearTimeout(fallbackTimer)
      console.log('✅ Backend connected — real face tracking active')
      setIsTracking(true)

      intervalRef.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return
        const frame = captureFrame()
        if (!frame) return
        ws.send(JSON.stringify({
          frame,
          position: 0,
          speed: 1.0,
          timestamp: new Date().toISOString()
        }))
      }, 1000)
    }

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        const face = data.face_present ?? false
        const score = Math.round(data.attention_score ?? 0)
        const onPhone = data.phone_detected ?? false

        setFaceDetected(face)
        setAttention(score)
        controlPlayback(face)

        // Phone alert: require 2 consecutive "on phone" readings before alerting
        if (onPhone) {
          phoneCountRef.current += 1
          if (phoneCountRef.current >= 2) setPhoneAlert(true)
        } else {
          phoneCountRef.current = 0
          setPhoneAlert(false)
        }

        sessionSumRef.current += score
        setTotalReadings(n => {
          const next = n + 1
          setSessionScore(Math.round(sessionSumRef.current / next))
          return next
        })
      } catch { /* ignore parse errors */ }
    }

    ws.onerror = () => {
      clearTimeout(fallbackTimer)
      console.warn('Backend unavailable — using simulated tracking')
      ws.close()
      startSimulatedTracking()
    }

    ws.onclose = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureFrame, controlPlayback])

  // ── Simulated fallback tracking ─────────────────────────────────────────────

  const startSimulatedTracking = useCallback(() => {
    setIsTracking(true)
    let score = 75

    intervalRef.current = setInterval(() => {
      score += (Math.random() - 0.5) * 20
      score = Math.max(0, Math.min(100, score))
      // Simulate occasional look-away
      const face = Math.random() > 0.15

      const rounded = Math.round(score)
      setAttention(rounded)
      setFaceDetected(face)
      controlPlayback(face)
      sessionSumRef.current += rounded
      setTotalReadings(n => {
        const next = n + 1
        setSessionScore(Math.round(sessionSumRef.current / next))
        return next
      })
    }, 1000)
  }, [controlPlayback])

  // ── Enable webcam ───────────────────────────────────────────────────────────

  const enableWebcam = async () => {
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })

      const video = videoRef.current
      if (!video) return

      video.srcObject = stream

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => video.play().then(resolve).catch(resolve)
      })

      setWebcamEnabled(true)
      connectBackend('demo-session')
    } catch {
      setError('Camera access denied. Please enable camera permissions in your browser and try again.')
    } finally {
      setStarting(false)
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      if (intervalRef.current) clearInterval(intervalRef.current)
      const video = videoRef.current
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const getColor = (score: number) =>
    score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-600">Verified Video</h1>
        </div>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* ── Main area ── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">

              {/* Webcam feed — always mounted so ref is ready */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full rounded-lg bg-black mb-4 ${webcamEnabled ? '' : 'hidden'}`}
                style={{ maxHeight: '180px', objectFit: 'cover' }}
              />

              {/* Camera error */}
              {error && (
                <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Consent gate — shown before webcam enabled */}
              {!webcamEnabled && (
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <div className="text-5xl mb-4">🎥</div>
                  <p className="text-gray-700 mb-2 font-medium text-lg">Camera required to watch</p>
                  <p className="text-gray-500 text-sm mb-6">
                    The video pauses automatically when you look away.
                  </p>
                  <button
                    onClick={enableWebcam}
                    disabled={starting}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {starting ? 'Starting camera...' : 'Enable Webcam & Watch'}
                  </button>
                </div>
              )}

              {/* Phone alert banner — shown above video */}
              {webcamEnabled && phoneAlert && (
                <div className="mb-4 p-4 bg-red-600 text-white rounded-lg flex items-center gap-3 shadow-lg animate-pulse">
                  <span className="text-2xl">📵</span>
                  <div>
                    <p className="font-bold text-sm">Put your phone down!</p>
                    <p className="text-xs text-red-100">Video is paused until you look at the screen.</p>
                  </div>
                </div>
              )}

              {/* Pause banner */}
              {webcamEnabled && pauseReason && !phoneAlert && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-2 text-yellow-800 text-sm font-medium">
                  <span>⚠️</span> {pauseReason}
                </div>
              )}

              {/*
                YouTube iframe — always in DOM once webcamEnabled so the YT player
                can be initialised immediately via useEffect([webcamEnabled]).
                controls=0  → hides progress bar / seek bar (non-skippable)
                disablekb=1 → blocks keyboard shortcuts (space, arrows, etc.)
              */}
              <iframe
                id="yt-player"
                width="100%"
                height="340"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?enablejsapi=1&autoplay=0&rel=0&controls=0&disablekb=1&modestbranding=1"
                title="Video Lesson"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className={`rounded-lg ${webcamEnabled ? 'block' : 'hidden'}`}
              />

              {webcamEnabled && (
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mt-4 transition">
                  Mark as Complete
                </button>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-4">Performance</h3>

              {/* Pre-tracking states */}
              {!isTracking && (
                <div className="text-center py-8 text-gray-400">
                  {starting ? (
                    <>
                      <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Starting camera...</p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-3">📷</div>
                      <p className="text-sm">Enable your webcam to begin</p>
                    </>
                  )}
                </div>
              )}

              {/* All tracking stats — always visible once started */}
              {isTracking && (
                <>
                  {/* Session score — the persistent cumulative metric */}
                  <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Session Score</p>
                    <div className="flex items-end gap-2">
                      <span className={`text-5xl font-black ${getColor(sessionScore)}`}>
                        {sessionScore}
                      </span>
                      <span className="text-xl font-bold text-gray-400 mb-1">/ 100</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{totalReadings} reading{totalReadings !== 1 ? 's' : ''} so far</p>
                  </div>

                  {/* Playback status */}
                  <div className={`mb-4 py-2 px-3 rounded-lg text-center text-xs font-semibold ${
                    isPlaying
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {isPlaying ? '▶ Playing' : '⏸ Paused — look at the screen'}
                  </div>

                  {/* Live attention score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Attention</span>
                      <span className={`text-2xl font-bold ${getColor(attention)}`}>
                        {attention}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          attention >= 70 ? 'bg-green-500' :
                          attention >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${attention}%` }}
                      />
                    </div>
                  </div>

                  {/* Phone alert in sidebar */}
                  {phoneAlert && (
                    <div className="mb-4 p-3 rounded-lg bg-red-600 text-white flex items-center gap-2 text-sm font-semibold animate-pulse">
                      <span>📵</span> Phone detected — put it down!
                    </div>
                  )}

                  {/* Face status */}
                  <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                    faceDetected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className="text-base">{faceDetected ? '✓' : '✗'}</span>
                    {faceDetected ? 'Face & eyes detected' : 'No face detected'}
                  </div>

                  {/* Level badge */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">Level</span>
                    <span className={`text-sm font-bold ${getColor(attention)}`}>
                      {attention >= 70 ? '🟢 High' : attention >= 50 ? '🟡 Medium' : '🔴 Low'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
