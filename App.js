import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { DeviceMotion, Accelerometer } from 'expo-sensors';

export default function App() {
  const [activeSensor, setActiveSensor] = useState('Detecting...');
  const [sensorStatusMsg, setSensorStatusMsg] = useState('Checking hardware sensors...');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Raw Angles in Degrees
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [yaw, setYaw] = useState(0);

  // Calibration offsets
  const [calibration, setCalibration] = useState({ pitch: 0, roll: 0, yaw: 0 });

  // Update interval (60ms = ~16 FPS, light and smooth for Samsung A06 4GB RAM)
  const [updateInterval] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  const motionSub = useRef(null);
  const accelSub = useRef(null);

  const startListening = async () => {
    try {
      // 1. Try requesting DeviceMotion permissions
      let motionPermissionGranted = false;
      try {
        const motionPerm = await DeviceMotion.requestPermissionsAsync();
        motionPermissionGranted = motionPerm?.status === 'granted';
      } catch (e) {
        // Some Android devices do not have explicit DeviceMotion runtime permission
      }

      // 2. Check if DeviceMotion hardware is actually available
      const isMotionAvail = await DeviceMotion.isAvailableAsync();

      if (isMotionAvail && motionPermissionGranted) {
        setPermissionDenied(false);
        setActiveSensor('DeviceMotion (Full 3-Axis Gyro)');
        setSensorStatusMsg('Hardware 6-DOF / Gyro active');

        DeviceMotion.setUpdateInterval(updateInterval);
        motionSub.current = DeviceMotion.addListener((data) => {
          if (!data.rotation) return;
          const { alpha, beta, gamma } = data.rotation;
          setPitch(Math.round((beta * 180) / Math.PI));
          setRoll(Math.round((gamma * 180) / Math.PI));
          setYaw(Math.round((alpha * 180) / Math.PI));
        });
        return;
      }

      // 3. Fallback: Check Accelerometer (Samsung A06 variant support)
      let accelPermissionGranted = true;
      try {
        const accelPerm = await Accelerometer.requestPermissionsAsync();
        accelPermissionGranted = accelPerm?.status === 'granted';
      } catch (e) {
        // Accelerometer usually doesn't require runtime prompt
      }

      const isAccelAvail = await Accelerometer.isAvailableAsync();

      if (isAccelAvail && accelPermissionGranted) {
        setPermissionDenied(false);
        setActiveSensor('Accelerometer Fallback');
        setSensorStatusMsg('Active via Gravity Vector (Pitch & Roll)');

        Accelerometer.setUpdateInterval(updateInterval);
        accelSub.current = Accelerometer.addListener((data) => {
          const { x, y, z } = data;
          const computedPitch = Math.round(
            Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI)
          );
          const computedRoll = Math.round(
            Math.atan2(y, z) * (180 / Math.PI)
          );
          setPitch(computedPitch);
          setRoll(computedRoll);
          setYaw(0);
        });
      } else {
        // Sensor truly denied or unavailable
        setPermissionDenied(true);
        setActiveSensor('Permission Denied / Blocked');
        setSensorStatusMsg('Physical sensor access is blocked or restricted by Android.');
      }
    } catch (err) {
      setPermissionDenied(true);
      setActiveSensor('Permission Denied');
      setSensorStatusMsg(err.message || 'Sensor permission restricted');
    }
  };

  useEffect(() => {
    startListening();

    return () => {
      if (motionSub.current) motionSub.current.remove();
      if (accelSub.current) accelSub.current.remove();
    };
  }, []);

  const openPhoneSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (e) {
      Alert.alert('Error', 'Unable to open settings directly. Please open phone Settings > Apps > Expo Go.');
    }
  };

  const togglePause = () => {
    if (isPaused) {
      if (motionSub.current) DeviceMotion.setUpdateInterval(updateInterval);
      if (accelSub.current) Accelerometer.setUpdateInterval(updateInterval);
      setIsPaused(false);
    } else {
      if (motionSub.current) DeviceMotion.setUpdateInterval(1000000);
      if (accelSub.current) Accelerometer.setUpdateInterval(1000000);
      setIsPaused(true);
    }
  };

  const handleCalibrate = () => {
    setCalibration({ pitch, roll, yaw });
  };

  const handleResetCalibration = () => {
    setCalibration({ pitch: 0, roll: 0, yaw: 0 });
  };

  const normalize = (deg) => {
    let val = deg % 360;
    if (val > 180) val -= 360;
    if (val < -180) val += 360;
    return val;
  };

  const currentPitch = normalize(pitch - calibration.pitch);
  const currentRoll = normalize(roll - calibration.roll);
  const currentYaw = normalize(yaw - calibration.yaw);

  const totalTiltMagnitude = Math.round(
    Math.sqrt(currentPitch * currentPitch + currentRoll * currentRoll)
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#070B14" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>SENS-ROTATION PRO</Text>
          <Text style={styles.deviceBadge}>Samsung A06 • 4GB RAM Profile</Text>
        </View>

        {/* VISIBLE PERMISSION DENIED WARNING BANNER */}
        {permissionDenied && (
          <View style={styles.alertBanner}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>SENSOR PERMISSION BLOCKED</Text>
                <Text style={styles.alertSubtitle}>
                  Android or Expo Go has restricted motion sensor access on your device.
                </Text>
              </View>
            </View>

            <View style={styles.alertBtnRow}>
              <TouchableOpacity
                style={styles.openSettingsBtn}
                onPress={() => setShowGuideModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.openSettingsText}>⚙️ Allow Sensor (Tap Here)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={startListening}
                activeOpacity={0.8}
              >
                <Text style={styles.retryBtnText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sensor Status Indicator */}
        <View style={styles.statusBox}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  activeSensor.includes('Full') || activeSensor.includes('Fallback')
                    ? '#00E676'
                    : '#EF4444',
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Sensor: {activeSensor}</Text>
            <Text style={styles.statusSubtitle}>{sensorStatusMsg}</Text>
          </View>
        </View>

        {/* Artificial Horizon / 3D Dial */}
        <View style={styles.dialCard}>
          <Text style={styles.cardHeader}>LIVE ORIENTATION HORIZON</Text>

          <View style={styles.dialContainer}>
            <View style={styles.outerDialRing}>
              {/* Roll needle */}
              <View
                style={[
                  styles.rotatorBar,
                  { transform: [{ rotate: `${currentRoll}deg` }] },
                ]}
              >
                <View style={styles.needlePointer} />
              </View>

              {/* Pitch/Roll Spirit Bubble */}
              <View
                style={[
                  styles.spiritBubble,
                  {
                    transform: [
                      { translateX: Math.max(-50, Math.min(50, currentRoll * 1.2)) },
                      { translateY: Math.max(-50, Math.min(50, currentPitch * 1.2)) },
                    ],
                  },
                ]}
              />

              <View style={styles.centerCrossHair} />
            </View>
          </View>

          <Text style={styles.magnitudeLabel}>
            Combined Tilt Angle: <Text style={styles.magnitudeValue}>{totalTiltMagnitude}°</Text>
          </Text>
        </View>

        {/* 3 Metric Value Boxes */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricAxis}>PITCH (X)</Text>
            <Text style={styles.metricDegrees}>{currentPitch}°</Text>
            <Text style={styles.metricDescription}>Front / Back</Text>
            <View style={styles.miniBarBackground}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${Math.min(100, (Math.abs(currentPitch) / 180) * 100)}%`,
                    backgroundColor: '#00D2FF',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricAxis}>ROLL (Y)</Text>
            <Text style={styles.metricDegrees}>{currentRoll}°</Text>
            <Text style={styles.metricDescription}>Left / Right</Text>
            <View style={styles.miniBarBackground}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${Math.min(100, (Math.abs(currentRoll) / 180) * 100)}%`,
                    backgroundColor: '#A855F7',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricAxis}>YAW (Z)</Text>
            <Text style={styles.metricDegrees}>{currentYaw}°</Text>
            <Text style={styles.metricDescription}>Heading</Text>
            <View style={styles.miniBarBackground}>
              <View
                style={[
                  styles.miniBarFill,
                  {
                    width: `${Math.min(100, (Math.abs(currentYaw) / 180) * 100)}%`,
                    backgroundColor: '#EC4899',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Calibration & Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.controlsHeading}>CALIBRATION & CONTROLS</Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.calibrateBtn]}
              onPress={handleCalibrate}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Set As Zero (0°)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.resetBtn]}
              onPress={handleResetCalibration}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, isPaused ? styles.resumeBtn : styles.pauseBtn, { marginTop: 10 }]}
            onPress={togglePause}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {isPaused ? '▶ Resume Tracking' : '⏸ Freeze / Hold Reading'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* POPUP INSTRUCTIONS MODAL */}
      <Modal
        visible={showGuideModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Enable on Samsung</Text>
            <Text style={styles.modalIntro}>
              Follow these quick steps to grant sensor access:
            </Text>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>
                Tap the button below to open <Text style={styles.highlight}>App Settings</Text>.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>
                Tap on <Text style={styles.highlight}>Permissions</Text> (or App Permissions).
              </Text>
            </View>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>
                Find <Text style={styles.highlight}>Physical Activity / Sensors</Text> and select <Text style={styles.highlight}>"Allow"</Text>.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <Text style={styles.stepNum}>4</Text>
              <Text style={styles.stepText}>
                Come back to this app and tap <Text style={styles.highlight}>Retry</Text>.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalGoSettingsBtn}
              onPress={() => {
                setShowGuideModal(false);
                openPhoneSettings();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalGoSettingsText}>🚀 Open App Settings Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowGuideModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseText}>Cancel / Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    marginTop: Platform.OS === 'android' ? 24 : 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#00F5D4',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  deviceBadge: {
    color: '#7B88A1',
    fontSize: 12,
    marginTop: 4,
  },
  /* PERMISSION WARNING BANNER */
  alertBanner: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  alertTitle: {
    color: '#FCA5A5',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
  },
  alertBtnRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  openSettingsBtn: {
    flex: 2,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  openSettingsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  /* STATUS */
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
  },
  statusSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  /* DIAL */
  dialCard: {
    backgroundColor: '#0E172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  dialContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  outerDialRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#1E293B',
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  rotatorBar: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0, 245, 212, 0.4)',
    alignItems: 'flex-end',
  },
  needlePointer: {
    width: 14,
    height: 8,
    backgroundColor: '#00F5D4',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  spiritBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 210, 255, 0.35)',
    borderWidth: 2,
    borderColor: '#00D2FF',
    position: 'absolute',
  },
  centerCrossHair: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  magnitudeLabel: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  magnitudeValue: {
    color: '#00F5D4',
    fontWeight: 'bold',
    fontSize: 15,
  },
  /* METRICS */
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#0E172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 10,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  metricAxis: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricDegrees: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  metricDescription: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 6,
  },
  miniBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  /* CONTROLS */
  controlsCard: {
    backgroundColor: '#0E172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  controlsHeading: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrateBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    marginRight: 8,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: '#334155',
  },
  pauseBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  resumeBtn: {
    backgroundColor: '#16A34A',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 22,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalIntro: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  highlight: {
    color: '#00F5D4',
    fontWeight: 'bold',
  },
  modalGoSettingsBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalGoSettingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
