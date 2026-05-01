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
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import { parseProfileFromQR } from '../utils/qr';
import { recordDuck } from '../services/duckService';
import { getUserProfile } from '../services/userService';
import { postScanHeadline } from '../utils/storyMessages';

const QUACK = require('../../assets/sounds/quack.wav');

async function playQuack() {
  try {
    const { sound } = await Audio.Sound.createAsync(QUACK);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (e) {
    console.warn('quack playback failed:', e);
  }
}

async function successBuzz() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (_) {}
}

async function failBuzz() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (_) {}
}

export default function ScannerScreen({ onBack }: { onBack: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    points?: number;
    headline: string;
    tags?: string[];
  } | null>(null);
  const { user, refreshProfile } = useAuth();

  const scanLockRef = useRef(false);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLockRef.current) return;
      if (!user) return;
      scanLockRef.current = true;
      setScanned(true);

      const toUid = parseProfileFromQR(data);
      if (!toUid) {
        failBuzz();
        Alert.alert('Quack Fail', 'Invalid or expired QR code.');
        scanLockRef.current = false;
        setScanned(false);
        return;
      }

      if (toUid === user.uid) {
        failBuzz();
        setProcessing(true);
        try {
          const result = await recordDuck({ fromUid: user.uid, toUid });
          const pts = result.pointsAwarded ?? -5;
          setLastResult({
            headline: postScanHeadline({ targetName: 'yourself', isSelfDuck: true }),
            points: pts,
            tags: ['self-duck'],
          });
        } finally {
          setProcessing(false);
        }
        return;
      }

      setProcessing(true);
      try {
        const [result, targetProfile] = await Promise.all([
          recordDuck({ fromUid: user.uid, toUid }),
          getUserProfile(toUid),
        ]);

        successBuzz();
        playQuack();

        const targetName =
          targetProfile?.displayName ||
          targetProfile?.username ||
          'them';
        const pts = result.pointsAwarded ?? 0;
        const headline = postScanHeadline({
          targetName,
          isRevenge: result.isRevenge,
          chainLength: result.chainLength,
          timestampMs: Date.now(),
        });
        const tags: string[] = [];
        if (result.isRevenge) tags.push('revenge');
        if (result.chainLength && result.chainLength >= 3) {
          tags.push(`${result.chainLength}-chain`);
        }
        setLastResult({ headline, points: pts, tags });
      } catch (e) {
        failBuzz();
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
            <Text style={styles.resultText}>Ducking...</Text>
          </View>
        ) : null}
        {lastResult && !processing ? (
          <View style={styles.result}>
            <Text style={styles.resultText}>{lastResult.headline}</Text>
            {lastResult.tags && lastResult.tags.length > 0 ? (
              <Text style={styles.resultTags}>{lastResult.tags.map((t) => `#${t}`).join(' ')}</Text>
            ) : null}
            {lastResult.points != null ? (
              <Text style={styles.points}>{lastResult.points >= 0 ? '+' : ''}{lastResult.points} pts</Text>
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
  result: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 24, borderRadius: 12, alignItems: 'center', gap: 6 },
  resultText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  resultTags: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
  points: { color: '#FFB800', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
});
