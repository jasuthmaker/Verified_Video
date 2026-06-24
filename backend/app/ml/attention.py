"""
Attention Score Calculation
Combines face presence, eye openness, and head pose
"""

import numpy as np
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class AttentionCalculator:
    """
    Calculates attention score from face detection data.
    Attention = 50% eye openness + 30% head pose + 20% gaze
    """

    def __init__(self):
        """Initialize attention calculator"""
        self.eye_openness_threshold = 0.2  # Eye open > 0.2 = attentive
        self.head_yaw_threshold = 0.5  # Max yaw rotation (radians)
        self.head_pitch_threshold = 0.7  # Max pitch rotation (radians)
        self.min_attention = 0
        self.max_attention = 100

    def calculate_attention(self, landmarks_data: Optional[Dict]) -> float:
        """
        Calculate attention score (0-100)

        Args:
            landmarks_data: Output from FaceDetector.get_face_landmarks()

        Returns:
            Attention score (0-100), where:
            - 0: Not paying attention (face away, eyes closed)
            - 50: Moderate attention (head angled, eyes half-open)
            - 100: Full attention (facing forward, eyes wide open)
        """
        if not landmarks_data or not landmarks_data["face_present"]:
            return 0.0

        # Extract components
        eye_openness = landmarks_data.get("eye_openness", {})
        head_pose = landmarks_data.get("head_pose", {})

        if not eye_openness or not head_pose:
            return 50.0  # Neutral if data incomplete

        # 1. Eye Openness Score (50% weight)
        eye_score = self._calculate_eye_score(eye_openness)

        # 2. Head Pose Score (30% weight)
        pose_score = self._calculate_pose_score(head_pose)

        # 3. Gaze Direction Score (20% weight)
        # For now, approximate as 100 (full score if face is detected)
        # Phase 2: Use gaze tracking for more precision
        gaze_score = 100.0

        # Weighted combination
        attention = (eye_score * 0.50) + (pose_score * 0.30) + (gaze_score * 0.20)

        return float(np.clip(attention, self.min_attention, self.max_attention))

    def _calculate_eye_score(self, eye_openness: Dict) -> float:
        """
        Eye openness score (0-100)
        - 0: Eyes completely closed (sleeping, looking down)
        - 50: Eyes half-open
        - 100: Eyes wide open
        """
        avg_openness = eye_openness.get("average", 0.5)

        # Map openness (0-1) to score (0-100)
        # Linear: eye_openness * 100
        score = avg_openness * 100

        return float(np.clip(score, 0, 100))

    def _calculate_pose_score(self, head_pose: Dict) -> float:
        """
        Head pose score (0-100)
        - 0: Face turned away (yaw > threshold)
        - 50: Moderate angle
        - 100: Facing forward (yaw ≈ 0, pitch ≈ 0)
        """
        yaw = abs(head_pose.get("yaw", 0))
        pitch = abs(head_pose.get("pitch", 0))
        roll = abs(head_pose.get("roll", 0))

        # Calculate penalty for each rotation
        yaw_penalty = max(0, (yaw - self.head_yaw_threshold) / self.head_yaw_threshold)
        pitch_penalty = max(
            0, (pitch - self.head_pitch_threshold) / self.head_pitch_threshold
        )
        roll_penalty = 0  # Roll is less critical

        # Average penalties
        avg_penalty = (yaw_penalty + pitch_penalty + roll_penalty) / 3
        score = 100 * (1 - avg_penalty)

        return float(np.clip(score, 0, 100))

    def _calculate_gaze_score(self, landmarks: np.ndarray) -> float:
        """
        Gaze direction score (0-100)
        Estimates if student is looking at screen vs. away

        TODO: Implement iris detection for precise gaze tracking
        For now, return 100 (neutral)
        """
        return 100.0

    def get_engagement_level(self, attention_score: float) -> str:
        """
        Categorize attention score

        Args:
            attention_score: 0-100

        Returns:
            'high' (80+), 'medium' (50-79), 'low' (<50)
        """
        if attention_score >= 80:
            return "high"
        elif attention_score >= 50:
            return "medium"
        else:
            return "low"

    def is_flag_worthy(self, attention_score: float) -> bool:
        """
        Determine if engagement should be flagged for review

        Teacher reviews sessions with:
        - Average attention <50%
        - Multiple anomalies (skips, long pauses, sudden dips)

        This is just one component. Phase 2 uses NIM for full anomaly detection.
        """
        return attention_score < 30  # Flag if very low attention

    def calculate_rolling_average(
        self, recent_scores: list, window_size: int = 6
    ) -> float:
        """
        Calculate rolling average of attention scores

        Args:
            recent_scores: List of recent attention scores
            window_size: Number of scores to average (default 6 = 30 sec at 5-sec intervals)

        Returns:
            Rolling average (0-100)
        """
        if not recent_scores:
            return 0.0

        # Take last N scores
        window = recent_scores[-window_size:] if len(recent_scores) >= window_size else recent_scores

        return float(np.mean(window))
