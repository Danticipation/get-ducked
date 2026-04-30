import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { getProfileQRPayload } from '../utils/qr';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? 'JeepQuack42');
  const [saving, setSaving] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { username, displayName: username, onboarded: true });
      await refreshProfile();
      setQrReady(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', 'Could not save profile: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    onComplete();
  };

  if (!qrReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pick your duck name</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="JeepQuack42"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, saving ? styles.buttonDisabled : null]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#1a1a2e" />
          ) : (
            <Text style={styles.buttonText}>Generate my QR</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const qrValue = user ? getProfileQRPayload(user.uid) : '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Duck QR</Text>
      <Text style={styles.subtitle}>Scan this to get ducked!</Text>
      <View style={styles.qrWrap}>
        <QRCode value={qrValue} size={240} />
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#E6F4FE' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center', color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  qrWrap: { alignItems: 'center', marginVertical: 24 },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  primaryButton: { backgroundColor: '#FFB800', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1a1a2e', fontWeight: '600', fontSize: 16 },
});
