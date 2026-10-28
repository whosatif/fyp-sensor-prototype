# 📱 FYP Sensor Prototype: Real-Time Mobile Orientation & Motion App

[![React Native](https://img.shields.io/badge/React_Native-0.88.0-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-brightgreen.svg)](#)

A high-performance mobile application built with **React Native** and **Expo** that reads and visualizes physical device motion and 3D rotational orientation in real time. Designed with hardware-level fallbacks and calibrated smoothing to ensure reliable performance across low-end and high-end devices alike.

---

## 🚀 Key Features

- **Full 3-Axis Orientation Tracking:** Live measurement of **Pitch**, **Roll**, and **Yaw** angles.
- **Smart Hardware Sensor Fallback:**
  - **Primary:** `DeviceMotion` 6-DOF / Gyroscope for full rotational orientation.
  - **Fallback:** Trigonometric `Accelerometer` gravity vector calculation (auto-activates on devices lacking hardware gyroscopes, like budget smartphones).
- **One-Tap Calibration & Zeroing:** Instantly offset drift and reset orientation baseline relative to your current phone position.
- **Freeze / Pause Stream:** Pause live streams at any time for data inspection and recording.
- **Optimized for Smooth Performance:** Runs at ~16–20 FPS (~60ms tick rate) for minimal battery drain and zero frame drops on low-RAM devices (e.g., Samsung Galaxy A06).
- **Permission & Diagnostic Handling:** Built-in modal alerts and direct system deep-links to grant motion permissions if restricted by Android or iOS.

---

## 🛠️ Tech Stack & Dependencies

| Tool / Library | Version | Purpose |
| :--- | :--- | :--- |
| **Expo** | `~58.0.19` | Universal React platform & mobile runtime |
| **React Native** | `0.88.0` | Native UI components & engine |
| **expo-sensors** | `~58.0.4` | Native device sensor hooks (DeviceMotion, Accelerometer) |
| **react-native-webview** | `14.0.1` | Embedded interactive views / visualizations |
| **@mediapipe/tasks-vision** | `^0.10.22` | Computer vision pipeline & gesture extensions |

---

## 📂 Project Architecture

```text
fyp-sensor-prototype/
├── App.js               # Main application logic, sensor listeners & state management
├── app.json             # Expo project configuration and app manifest
├── index.js             # Application root registration
├── package.json         # Dependencies and runner scripts
├── .gitignore           # Clean git repository rules & artifact ignores
├── AGENTS.md            # AI developer & development workflow guidelines
└── LICENSE              # MIT License
```

---

## ⚡ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- [Expo Go](https://expo.dev/go) installed on your Android or iOS device

### 1. Clone Repository

```bash
git clone https://github.com/whosatif/fyp-sensor-prototype.git
cd fyp-sensor-prototype
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npx expo start -c
```

### 4. Open on Your Device

- **Android:** Open the **Expo Go** app and scan the terminal QR code.
- **iOS:** Open the **Camera** app and scan the terminal QR code to launch Expo Go.
- **Web:** Press `w` in the terminal to view in your browser.
- **Android Emulator / USB:** Press `a` in the terminal.

---

## 📐 How Angle Calculation Works

```
         +Y (Roll)
            ▲
            │
            │   ┌────────┐
            └───┼─► +X (Pitch)
               /│
              / └────────┘
             ▼
         +Z (Yaw)
```

1. **When Gyroscope / DeviceMotion is present:**
   - Raw Euler angles ($\alpha, \beta, \gamma$) from the hardware fusion sensor are converted directly to degrees:
     $$\text{Angle (deg)} = \frac{\text{rad} \times 180}{\pi}$$
2. **When running on Accelerometer fallback:**
   - Orientation is derived using the standard trigonometric gravity projection:
     $$\text{Pitch} = \text{atan2}\left(-X, \sqrt{Y^2 + Z^2}\right) \times \frac{180}{\pi}$$
     $$\text{Roll} = \text{atan2}(Y, Z) \times \frac{180}{\pi}$$

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
