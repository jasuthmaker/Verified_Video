-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student', 'admin')) DEFAULT 'student',
  age_bracket VARCHAR(10) NOT NULL CHECK (age_bracket IN ('13+', '<13')) DEFAULT '13+',
  has_parental_consent BOOLEAN DEFAULT FALSE,
  parental_email VARCHAR(255),
  parental_consent_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  device_fingerprint_hash VARCHAR(255),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video Sessions (created by teachers)
CREATE TABLE IF NOT EXISTS video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url VARCHAR(1000) NOT NULL,
  video_type VARCHAR(50) NOT NULL CHECK (video_type IN ('youtube', 'hls', 'custom')) DEFAULT 'youtube',
  session_key VARCHAR(256) NOT NULL,
  session_key_hash VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255),
  description TEXT,
  duration_seconds INTEGER,
  engagement_threshold INTEGER DEFAULT 70 CHECK (engagement_threshold >= 0 AND engagement_threshold <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP,
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Engagement Logs
CREATE TABLE IF NOT EXISTS engagement_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),

  -- Face detection
  face_present BOOLEAN,
  face_count INTEGER DEFAULT 0,
  attention_score FLOAT CHECK (attention_score >= 0 AND attention_score <= 100),

  -- Playback telemetry
  playback_position_seconds INTEGER,
  playback_speed FLOAT DEFAULT 1.0,
  was_paused BOOLEAN,
  pause_duration_seconds INTEGER DEFAULT 0,
  skip_detected BOOLEAN DEFAULT FALSE,
  skip_direction VARCHAR(20) CHECK (skip_direction IN ('forward', 'backward', NULL)),

  -- Browser behavior
  tab_active BOOLEAN DEFAULT TRUE,
  window_focused BOOLEAN DEFAULT TRUE,

  -- Anti-spoofing
  device_fingerprint_hash VARCHAR(255),
  liveness_challenge_passed BOOLEAN,

  -- Metadata
  client_version VARCHAR(50),
  browser_user_agent TEXT,

  -- NIM Analysis (Phase 2)
  nim_analysis_result JSONB
);

-- Session Completion Records
CREATE TABLE IF NOT EXISTS session_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),

  -- Summary stats
  total_engagement_seconds INTEGER,
  video_duration_seconds INTEGER,
  engagement_percentage FLOAT CHECK (engagement_percentage >= 0 AND engagement_percentage <= 100),
  avg_attention_score FLOAT CHECK (avg_attention_score >= 0 AND avg_attention_score <= 100),

  -- Flags
  passed_engagement_threshold BOOLEAN,
  flagged_for_review BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(255),

  -- Certificate
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_uuid VARCHAR(255)
);

-- Consent Records (immutable audit trail)
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID REFERENCES video_sessions(id),
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('webcam', 'data_collection', 'parental_approval', 'terms')),
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address_hash VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, session_id, consent_type)
);

-- Data Deletion Requests (GDPR compliance)
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID REFERENCES video_sessions(id),
  reason VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed')) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  deleted_record_count INTEGER
);

-- Indexes for performance
CREATE INDEX idx_video_sessions_teacher_id ON video_sessions(teacher_id);
CREATE INDEX idx_video_sessions_session_key_hash ON video_sessions(session_key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_video_sessions_created_at ON video_sessions(created_at DESC);
CREATE INDEX idx_engagement_logs_session_id ON engagement_logs(session_id);
CREATE INDEX idx_engagement_logs_student_id ON engagement_logs(student_id);
CREATE INDEX idx_engagement_logs_timestamp ON engagement_logs(timestamp DESC);
CREATE INDEX idx_session_completions_session_id ON session_completions(session_id);
CREATE INDEX idx_session_completions_student_id ON session_completions(student_id);
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view student profiles for their sessions"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT student_id FROM engagement_logs
      WHERE session_id IN (
        SELECT id FROM video_sessions WHERE teacher_id = auth.uid()
      )
    )
  );

-- RLS Policies: Video Sessions
CREATE POLICY "Teachers can view their own sessions"
  ON video_sessions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create sessions"
  ON video_sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own sessions"
  ON video_sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Public can view active sessions"
  ON video_sessions FOR SELECT
  USING (is_active = TRUE);

-- RLS Policies: Engagement Logs
CREATE POLICY "Students can view their own logs"
  ON engagement_logs FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view logs of their sessions"
  ON engagement_logs FOR SELECT
  USING (session_id IN (SELECT id FROM video_sessions WHERE teacher_id = auth.uid()));

CREATE POLICY "Students can insert their own logs"
  ON engagement_logs FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies: Session Completions
CREATE POLICY "Students can view their own completions"
  ON session_completions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view completions for their sessions"
  ON session_completions FOR SELECT
  USING (session_id IN (SELECT id FROM video_sessions WHERE teacher_id = auth.uid()));

-- RLS Policies: Consent Records
CREATE POLICY "Users can view their own consent records"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records"
  ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Updated_at for users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Updated_at for video_sessions
CREATE TRIGGER video_sessions_updated_at
  BEFORE UPDATE ON video_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Soft delete user (GDPR)
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = user_id;
  UPDATE video_sessions SET deleted_at = NOW(), is_active = FALSE WHERE teacher_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate session engagement summary
CREATE OR REPLACE FUNCTION calculate_engagement_summary(session_id UUID, student_id UUID)
RETURNS TABLE (
  total_engagement_seconds BIGINT,
  engagement_percentage NUMERIC,
  avg_attention_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN face_present THEN 5 ELSE 0 END), 0::BIGINT) as total_engagement_seconds,
    ROUND(
      (COALESCE(SUM(CASE WHEN face_present THEN 5 ELSE 0 END), 0)::NUMERIC /
        COALESCE((SELECT duration_seconds FROM video_sessions WHERE id = session_id)::NUMERIC, 1)) * 100,
      2
    ) as engagement_percentage,
    ROUND(AVG(attention_score), 2) as avg_attention_score
  FROM engagement_logs
  WHERE engagement_logs.session_id = calculate_engagement_summary.session_id
    AND engagement_logs.student_id = calculate_engagement_summary.student_id;
END;
$$ LANGUAGE plpgsql;
