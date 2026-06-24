"""
Face and Eye Detection using MediaPipe and OpenCV
Main module for engagement verification
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)

class FaceDetector:
    """
    Detects faces and eyes in video frames.
    Uses MediaPipe for robust, fast detection.
    """

    def __init__(self, confidence_threshold: float = 0.5):
        """
        Initialize FaceDetector with MediaPipe

        Args:
            confidence_threshold: Minimum confidence for face detection (0-1)
        """
        self.confidence_threshold = confidence_threshold

        # Initialize MediaPipe Face Detection
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,  # 0=short-range, 1=full-range
            min_detection_confidence=confidence_threshold,
        )

        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=3,  # Detect up to 3 faces (flag if >1)
            refine_landmarks=True,
            min_detection_confidence=confidence_threshold,
            min_tracking_confidence=0.5,
        )

        logger.info("✅ FaceDetector initialized with MediaPipe")

    def detect_faces_in_frame(self, frame: np.ndarray) -> Tuple[bool, int]:
        """
        Detect faces in a single video frame

        Args:
            frame: OpenCV frame (BGR format)

        Returns:
            Tuple[face_detected, face_count]
            - face_detected: True if at least one face found
            - face_count: Number of faces detected
        """
        if frame is None:
            return False, 0

        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, c = frame.shape

        # Detect faces
        results = self.face_detection.process(rgb_frame)

        face_count = 0
        if results.detections:
            face_count = len(results.detections)

        face_detected = face_count > 0
        return face_detected, face_count

    def get_face_landmarks(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Get detailed face landmarks for attention calculation

        Args:
            frame: OpenCV frame (BGR format)

        Returns:
            Dictionary with:
            - face_present: bool
            - face_count: int
            - landmarks: 468-point mesh (if face detected)
            - head_pose: yaw, pitch, roll angles
            - eye_openness: left_eye, right_eye (0-1)
        """
        if frame is None:
            return None

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return {
                "face_present": False,
                "face_count": 0,
                "landmarks": None,
                "head_pose": None,
                "eye_openness": None,
            }

        # Get first face landmarks (ignore if >1)
        face_landmarks = results.multi_face_landmarks[0]
        landmarks_array = np.array(
            [[lm.x, lm.y, lm.z] for lm in face_landmarks.landmark]
        )

        # Calculate head pose (yaw, pitch, roll)
        head_pose = self._calculate_head_pose(landmarks_array)

        # Calculate eye openness
        eye_openness = self._calculate_eye_openness(landmarks_array)

        return {
            "face_present": True,
            "face_count": len(results.multi_face_landmarks),
            "landmarks": landmarks_array,
            "head_pose": head_pose,
            "eye_openness": eye_openness,
        }

    def _calculate_head_pose(self, landmarks: np.ndarray) -> Dict:
        """
        Calculate normalised head pose ratios (not raw angles).

        yaw:   0 = looking straight, increases as head turns left/right
        pitch: 0 = looking straight, increases as head tilts up/down
        """
        nose_tip   = landmarks[4]    # nose tip
        chin       = landmarks[152]  # chin
        left_eye   = landmarks[33]   # left eye outer corner
        right_eye  = landmarks[263]  # right eye outer corner

        eye_mid_x   = (left_eye[0] + right_eye[0]) / 2
        eye_mid_y   = (left_eye[1] + right_eye[1]) / 2
        eye_width   = max(abs(right_eye[0] - left_eye[0]), 1e-6)
        face_height = max(abs(chin[1] - eye_mid_y), 1e-6)

        # Yaw: how far nose deviates horizontally from eye midpoint, normalised by eye width
        # ~0 when straight, ~0.3–0.5 when turned significantly
        yaw = abs(nose_tip[0] - eye_mid_x) / eye_width

        # Pitch: signed vertical deviation from expected nose position (~45% face height below eyes)
        # positive = looking DOWN (phone in lap), negative = looking UP
        nose_rel_y = (nose_tip[1] - eye_mid_y) / face_height
        pitch = nose_rel_y - 0.45

        return {
            "yaw": float(yaw),
            "pitch": float(pitch),
            "roll": 0.0,
        }

    def _calculate_eye_openness(self, landmarks: np.ndarray) -> Dict:
        """
        Calculate how open eyes are (0-1, where 1 is fully open)

        Uses eye landmarks to measure vertical eye opening
        """
        # Eye landmarks for left and right eye (MediaPipe FaceMesh)
        # Format: [outer, top-inner, top-outer, inner, bottom-inner, bottom-outer]
        LEFT_EYE  = [33,  160, 158, 133, 153, 144]
        RIGHT_EYE = [362, 385, 387, 263, 381, 374]  # [3] was 362 (duplicate) → fixed to 263

        def calculate_eye_aspect_ratio(eye_landmarks):
            """EAR = ||P2 - P6|| / (2 * ||P3 - P5||)"""
            if len(eye_landmarks) < 6:
                return 0.5

            # Vertical distances
            vertical_1 = np.linalg.norm(
                landmarks[eye_landmarks[1]] - landmarks[eye_landmarks[5]]
            )
            vertical_2 = np.linalg.norm(
                landmarks[eye_landmarks[2]] - landmarks[eye_landmarks[4]]
            )

            # Horizontal distance
            horizontal = np.linalg.norm(
                landmarks[eye_landmarks[0]] - landmarks[eye_landmarks[3]]
            )

            # EAR
            if horizontal == 0:
                return 0.5
            ear = (vertical_1 + vertical_2) / (2 * horizontal)
            return min(1.0, max(0.0, ear))  # Clamp to 0-1

        left_ear = calculate_eye_aspect_ratio(LEFT_EYE)
        right_ear = calculate_eye_aspect_ratio(RIGHT_EYE)

        return {
            "left_eye": float(left_ear),
            "right_eye": float(right_ear),
            "average": float((left_ear + right_ear) / 2),
        }

    def visualize_landmarks(
        self, frame: np.ndarray, landmarks_data: Dict
    ) -> np.ndarray:
        """
        Draw face landmarks on frame for debugging

        Args:
            frame: OpenCV frame
            landmarks_data: Output from get_face_landmarks()

        Returns:
            Annotated frame
        """
        if not landmarks_data or not landmarks_data["face_present"]:
            return frame

        landmarks = landmarks_data["landmarks"]
        if landmarks is None:
            return frame

        h, w, _ = frame.shape

        # Draw face mesh
        for i in range(len(landmarks) - 1):
            pt1 = (int(landmarks[i][0] * w), int(landmarks[i][1] * h))
            pt2 = (int(landmarks[i + 1][0] * w), int(landmarks[i + 1][1] * h))
            cv2.line(frame, pt1, pt2, (0, 255, 0), 1)

        # Draw key points
        key_points = [4, 152, 33, 263]  # Nose, chin, eyes
        for pt_idx in key_points:
            pt = (int(landmarks[pt_idx][0] * w), int(landmarks[pt_idx][1] * h))
            cv2.circle(frame, pt, 3, (0, 255, 255), -1)

        # Draw text info
        head_pose = landmarks_data["head_pose"]
        eye_openness = landmarks_data["eye_openness"]

        if head_pose:
            cv2.putText(
                frame,
                f"Yaw: {head_pose['yaw']:.2f}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )
            cv2.putText(
                frame,
                f"Pitch: {head_pose['pitch']:.2f}",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )

        if eye_openness:
            cv2.putText(
                frame,
                f"Eye Open: {eye_openness['average']:.2f}",
                (10, 90),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )

        return frame

    def close(self):
        """Close MediaPipe resources"""
        self.face_detection.close()
        self.face_mesh.close()
