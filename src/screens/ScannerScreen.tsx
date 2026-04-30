import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../contexts/AuthContext';
import { parseProfileFromQR } from '../utils/qr';
import { recordDuck } from '../services/duckService';
import { getUserProfile } from '../services/userService';

export default function ScannerScreen({ onBack }: { onBack: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    points?: number;
    message: string;
  } | null>(null);
  const { user, refreshProfile } = useAuth();

  // Synchronous lock - prevents duplicate scans from firing in the same frame window
  // before React processes setScanned(true).
  const scanLockRef = useRef(false);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLockRef.current) return;
      if (!user) return;
      scanLockRef.current = true;
      setScanned(true);

      const toUid = parseProfileFromQR(data);
      if (!toUid) {
        Alert.alert('Quack Fail', 'Invalid or expired QR code.');
        scanLockRef.current = false;
        setScanned(false);
        return;
      }

      if (toUid === user.uid) {
        Alert.alert('Self-duck!', '-5 pts. Shame badge.');
        setProcessing(true);
        try {
          await recordDuck({ fromUid: user.uid, toUid });
          await refreshProfile();
        } finally {
          setProcessing(false);
        }
        return;
      }

      setProcessing(true);
      try {
        // Kick off the duck write and the target's display name lookup in parallel.
        const [result, targetProfile] = await Promise.all([
          recordDuck({ fromUid: user.uid, toUid }),
          getUserProfile(toUid),
        ]);
        await refreshProfile();

        const targetName =
          targetProfile?.displayName ||
          targetProfile?.username ||
          'them';
        const pts = result.pointsAwarded ?? 0;
        let message = `You ducked ${targetName}!`;
        if (result.isRevenge) message += ' Revenge!';
        if (result.chainLength && result.chainLength >= 3) {
          message += ' Duck Chain!';
        }
        setLastResult({ message, points: pts });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Try again.';
        Alert.alert('Duck failed', msg);
      } finally {
        setProcessing(false);
      }
    },
    [user, refreshProfile]
  );

  const handleScanAgain = () => {
    setLastResult(null);
    setScanned(false);
    scanLockRef.current = false;
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Requesting camera...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We need camera access to scan duck QRs.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        {processing ? (
          <View style={styles.result}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.resultText}>Recording duck...</Text>
          </View>
        ) : null}
        {lastResult && !processing ? (
          <View style={styles.result}>
            <Text style={styles.resultText}>{lastResult.message}</Text>
            {lastResult.points != null ? (
              <Text style={styles.points}>+{lastResult.points} pts</Text>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
              <Text style={styles.buttonText}>Scan again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#1a1a2e' },
  message: { color: '#fff', marginBottom: 16, textAlign: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24, justifyContent: 'space-between' },
  button: { backgroundColor: '#FFB800', padding: 16, borderRadius: 8, alignItems: 'center' },
  backButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 8, alignSelf: 'flex-start' },
  buttonText: { color: '#1a1a2e', fontWeight: '600' },
  result: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 24, borderRadius: 12, alignItems: 'center', gap: 8 },
  resultText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  points: { color: '#FFB800', fontSize: 24, fontWeight: 'bold' },
});
