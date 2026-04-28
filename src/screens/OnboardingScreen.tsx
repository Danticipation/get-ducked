import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { generateProfileQRDataUrl } from '../utils/qr';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? 'JeepQuack42');
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { username, displayName: username, onboarded: true });
      await refreshProfile();
      const url = await generateProfileQRDataUrl(user.uid);
      setQrDataUrl(url);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintMe = async () => {
    if (!qrDataUrl) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        // Sharing with image: would need to write to file first; for MVP we show alert
        Alert.alert(
          'Print / Share',
          'Save your QR from the Profile tab and share or print it. Coming: direct share.'
        );
      }
    } catch (_) {}
  };

  const handleDone = () => {
    onComplete();
  };

  if (!qrDataUrl) {
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
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#1a1a2e" /> : <Text style={styles.buttonText}>Generate my QR</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Duck QR</Text>
      <Text style={styles.subtitle}>Scan this to get ducked!</Text>
      {qrDataUrl ? (
        <Image source={{ uri: qrDataUrl }} style={styles.qr} />
      ) : null}
      <TouchableOpacity style={styles.button} onPress={handlePrintMe}>
        <Text style={styles.buttonText}>Print me!</Text>
      </TouchableOpacity>
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
  qr: { width: 256, height: 256, alignSelf: 'center', marginBottom: 24 },
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
