// User Types
export type UserRole = 'teacher' | 'student' | 'admin'
export type AgeBracket = '13+' | '<13'

export interface User {
  id: string
  email: string
  role: UserRole
  age_bracket: AgeBracket
  has_parental_consent: boolean
  parental_email?: string | null
  parental_consent_date?: string | null
  created_at: string
  deleted_at?: string | null
  last_login?: string | null
  is_active: boolean
  updated_at: string
}

// Video Session Types
export type VideoType = 'youtube' | 'hls' | 'custom'

export interface VideoSession {
  id: string
  teacher_id: string
  video_url: string
  video_type: VideoType
  session_key: string
  session_key_hash: string
  title?: string | null
  description?: string | null
  duration_seconds?: number | null
  engagement_threshold: number // 0-100
  created_at: string
  expires_at?: string | null
  is_active: boolean
  deleted_at?: string | null
  metadata?: {
    youtube_video_id?: string
    thumbnail?: string
    [key: string]: any
  }
  updated_at: string
}

// Engagement Log Types
export interface EngagementLog {
  id: number
  session_id: string
  student_id: string
  timestamp: string

  // Face detection
  face_present: boolean
  face_count: number
  attention_score: number // 0-100

  // Playback telemetry
  playback_position_seconds: number
  playback_speed: number
  was_paused: boolean
  pause_duration_seconds: number
  skip_detected: boolean
  skip_direction?: 'forward' | 'backward' | null

  // Browser behavior
  tab_active: boolean
  window_focused: boolean

  // Anti-spoofing
  device_fingerprint_hash?: string | null
  liveness_challenge_passed?: boolean | null

  // Metadata
  client_version?: string | null
  browser_user_agent?: string | null
}

// Session Completion Types
export interface SessionCompletion {
  id: string
  session_id: string
  student_id: string
  completed_at: string

  // Summary stats
  total_engagement_seconds: number
  video_duration_seconds: number
  engagement_percentage: number // (total / duration) * 100
  avg_attention_score: number

  // Flags
  passed_engagement_threshold: boolean
  flagged_for_review: boolean
  flag_reason?: string | null

  // Certificate
  certificate_issued: boolean
  certificate_uuid?: string | null
}

// Consent Records
export type ConsentType = 'webcam' | 'data_collection' | 'parental_approval' | 'terms'

export interface ConsentRecord {
  id: string
  user_id: string
  session_id?: string | null
  consent_type: ConsentType
  consent_given: boolean
  consent_version?: string | null
  timestamp: string
  ip_address_hash?: string | null
  user_agent?: string | null
  created_at: string
}

// Engagement Tracking (Real-time)
export interface EngagementEntry {
  timestamp: number
  facePresent: boolean
  faceCount: number
  attentionScore: number
  playbackPos: number
  playbackSpeed: number
  skipDetected: boolean
  wasTabActive: boolean
  wasPaused?: boolean
  pauseDuration?: number
}

// Real-time Engagement Summary
export interface EngagementSummary {
  totalEngagementSeconds: number
  videoDurationSeconds: number
  engagementPercentage: number
  avgAttentionScore: number
  skipEvents: number
  pauseEvents: number
  anomalyScore: number
  flagged: boolean
}

// Face Detection Results (from MediaPipe)
export interface FaceDetectionResult {
  facesDetected: number
  attentionScore: number
  headPitch: number
  headYaw: number
  headRoll: number
  eyeOpenness: number
  blinkRate: number
  timestamp: number
}

// Playback Tampering Detection
export interface PlaybackTamperingEvent {
  type: 'skip' | 'speed_anomaly' | 'long_pause'
  position: number
  severity: 'low' | 'medium' | 'high'
  timestamp: number
  details: {
    oldSpeed?: number
    newSpeed?: number
    skipDistance?: number
    pauseDuration?: number
  }
}

// NIM Anomaly Detection Response
export interface NIMAnalysisResult {
  anomaly_score: number // 0-100
  risk_factors: string[]
  flagged: boolean
  confidence: number // 0-1
  analysis: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Dashboard Analytics
export interface DashboardAnalytics {
  totalSessions: number
  activeSessions: number
  totalStudents: number
  averageEngagement: number
  completionRate: number
  flaggedSessions: number
  sessionsByCompletion: {
    completed: number
    pending: number
    flagged: number
  }
}

// Teacher Session Summary
export interface TeacherSessionSummary {
  id: string
  title: string
  created_at: string
  studentCount: number
  completedCount: number
  completionRate: number
  averageAttention: number
  flaggedCount: number
  videoUrl: string
  thumbnail?: string
  duration?: number
}

// Student Session View
export interface StudentSessionView {
  id: string
  title: string
  description?: string
  duration?: number
  thumbnail?: string
  engagementThreshold: number
  hasStarted: boolean
  isCompleted: boolean
  completion?: SessionCompletion | null
}

// Auth Context
export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, role: UserRole, ageBracket: AgeBracket) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}
