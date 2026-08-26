"""Kinematic extraction for StateGraph handoffs."""

from __future__ import annotations

import math
from dataclasses import dataclass

from kinematics.core.types import Handedness, Joint, PoseFrame


@dataclass(frozen=True)
class KinematicSample:
    frame: int
    t: float
    wrist_speed: float
    wrist_acceleration: float
    shoulder_speed: float
    shoulder_acceleration: float
    wrist_to_shoulder_velocity: tuple[float, float]

    def to_dict(self) -> dict[str, object]:
        return {
            "frame": self.frame,
            "t": self.t,
            "wrist_speed": self.wrist_speed,
            "wrist_acceleration": self.wrist_acceleration,
            "shoulder_speed": self.shoulder_speed,
            "shoulder_acceleration": self.shoulder_acceleration,
            "wrist_to_shoulder_velocity": list(self.wrist_to_shoulder_velocity),
        }


def hitting_side(handedness: Handedness) -> tuple[Joint, Joint]:
    if handedness is Handedness.LEFT:
        return Joint.L_WRIST, Joint.L_SHOULDER
    return Joint.R_WRIST, Joint.R_SHOULDER


def _velocity(prev: PoseFrame, cur: PoseFrame, joint: Joint) -> tuple[float, float]:
    a = prev.get(joint)
    b = cur.get(joint)
    dt = cur.t - prev.t
    if a is None or b is None or dt <= 0:
        return (0.0, 0.0)
    return ((b.x - a.x) / dt, (b.y - a.y) / dt)


def _mag(v: tuple[float, float]) -> float:
    return math.hypot(v[0], v[1])


def wrist_to_shoulder_kinematics(
    poses: list[PoseFrame],
    handedness: Handedness = Handedness.RIGHT,
) -> list[KinematicSample]:
    """Return wrist/shoulder speeds and accelerations from pose sequences.

    Coordinates are normalized frame units per second. The output is deterministic
    and model-free, so it can be consumed by role-systems without importing
    MediaPipe or video backends.
    """
    if len(poses) < 2:
        return []
    wrist, shoulder = hitting_side(handedness)
    samples: list[KinematicSample] = []
    prev_wrist_speed = 0.0
    prev_shoulder_speed = 0.0
    for prev, cur in zip(poses, poses[1:], strict=False):
        dt = cur.t - prev.t
        if dt <= 0:
            continue
        wrist_v = _velocity(prev, cur, wrist)
        shoulder_v = _velocity(prev, cur, shoulder)
        wrist_speed = _mag(wrist_v)
        shoulder_speed = _mag(shoulder_v)
        samples.append(
            KinematicSample(
                frame=cur.index,
                t=cur.t,
                wrist_speed=wrist_speed,
                wrist_acceleration=(wrist_speed - prev_wrist_speed) / dt,
                shoulder_speed=shoulder_speed,
                shoulder_acceleration=(shoulder_speed - prev_shoulder_speed) / dt,
                wrist_to_shoulder_velocity=(wrist_v[0] - shoulder_v[0], wrist_v[1] - shoulder_v[1]),
            )
        )
        prev_wrist_speed = wrist_speed
        prev_shoulder_speed = shoulder_speed
    return samples
