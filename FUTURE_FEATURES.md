# 🔮 Future Features — BioGuard

## 📷 Real-Time Posture Capture Mode

### Overview
Integrate a Python-based pose estimation system that captures **real-time joint angles** from webcam/video and feeds them into BioGuard's PhysicsEngine for live stress calculations.

### Source Code
- **File**: `pose_measurement.py` (Human Joint Measurement System)
- **Technology**: Python + MediaPipe + OpenCV + CustomTkinter

### What It Does
- Uses MediaPipe's heavy pose model to detect 33 body landmarks
- Calculates 12 joint angles in real-time:
  - L/R Shoulder, Elbow, Wrist
  - L/R Hip, Knee, Ankle
- Measures body segment ratios (shoulder width, torso, limbs)
- Applies Savitzky-Golay filtering for smooth tracking
- Logs all measurements to CSV with timestamps

### Integration Plan

#### Communication Method
- **Option 1**: WebSocket for real-time streaming
- **Option 2**: REST API endpoint (Python → JS backend)
- **Option 3**: Direct Supabase connection from Python
- **Option 4**: JSON file exchange

#### Data Mapping
| Python Joint | BioGuard PostureAngles |
|--------------|------------------------|
| L/R Hip angle | `hip` |
| L/R Knee angle | `knee` |
| Trunk (calculated from shoulders/hips) | `trunk` |

#### New Features Enabled
1. **Live Posture Mode** — Real-time joint stress as user moves
2. **Posture Validation** — Compare actual posture to scenario presets
3. **Continuous Monitoring** — Extended session tracking
4. **Screenshot Analysis** — Analyze saved pose images

### Dependencies to Add
```
mediapipe>=0.10.0
opencv-python>=4.8.0
customtkinter>=5.2.0
scipy>=1.11.0
numpy>=1.24.0
Pillow>=10.0.0
matplotlib>=3.7.0
```


### Status
📋 Planned — Not yet implemented

