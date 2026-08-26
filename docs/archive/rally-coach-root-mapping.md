# Rally Coach Root Mapping Archive

Archived on 2026-08-26 as part of the rally-coach consolidation into gateKPT.

Standalone source root:

- `C:\Users\Green Machine\rally-coach`

Consolidated gateKPT package root:

- `C:\Users\Green Machine\Documents\gateKPT\src\kinematics`

Migrated kinematics modules:

- `src\rally_coach\core\types.py` -> `src\kinematics\core\types.py`
- `src\rally_coach\pose\base.py` -> `src\kinematics\pose\base.py`
- `src\rally_coach\pose\mediapipe_backend.py` -> `src\kinematics\pose\mediapipe_backend.py`
- `src\rally_coach\pose\movenet_backend.py` -> `src\kinematics\pose\movenet_backend.py`
- `src\rally_coach\tracking\smoothing.py` -> `src\kinematics\tracking\smoothing.py`
- `src\rally_coach\metrics\kinematics.py` -> `src\kinematics\metrics\kinematics.py`

Import mapping:

- `rally_coach.core.types` -> `kinematics.core.types`
- `rally_coach.pose.*` -> `kinematics.pose.*`
- `rally_coach.tracking.*` -> `kinematics.tracking.*`
- `rally_coach.metrics.*` -> `kinematics.metrics.*`
