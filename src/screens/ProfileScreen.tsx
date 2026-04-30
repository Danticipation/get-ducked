import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../services/userService';
import { getProfileQRPayload } from '../utils/qr';

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [jeepNickname, setJeepNickname] = useState(profile?.jeepNickname ?? '');
  const [jeepColor, setJeepColor] = useState(profile?.jeepColor ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setDisplayName(profile?.displayName ?? '');
    setJeepNickname(profile?.jeepNickname ?? '');
    setJeepColor(profile?.jeepColor ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { username, displayName, jeepNickname, jeepColor });
      await refreshProfile();
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete my data',
      'This will remove your account and duck history. Contact support or use Firebase Console for full deletion.'
    );
  };

  if (!profile || !user) return null;

  const qrValue = getProfileQRPayload(user.uid);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarLetter}>D</Text>
      </View>
      {editing ? (
        <View>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
          <TextInput style={styles.input} value={jeepNickname} onChangeText={setJeepNickname} placeholder="Jeep nickname (optional)" />
          <TextInput style={styles.input} value={jeepColor} onChangeText={setJeepColor} placeholder="Jeep color (optional)" />
          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setEditing(false)}>
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          <Text style={styles.rankTitle}>{profile.rankTitle}</Text>
          {profile.badges && profile.badges.length > 0 ? (
            <Text style={styles.badges}>{profile.badges.join(' - ')}</Text>
          ) : null}
          <View style={styles.stats}>
            <Text>Ducks given: {profile.totalDucksGiven}</Text>
            <Text>Ducks received: {profile.totalDucksReceived}</Text>
            <Text>Total points: {profile.totalPoints ?? 0}</Text>
            <Text>Best streak: {profile.bestStreak}</Text>
          </View>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setEditing(true)}>
            <Text style={styles.outlineButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.sectionTitle}>My QR code</Text>
      <View style={styles.qrWrap}>
        <QRCode value={qrValue} size={200} />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert('Print me!', 'Show this QR to let others duck you.')}
      >
        <Text style={styles.buttonText}>Print me! / Share</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dataButton} onPress={handleDataDeletion}>
        <Text style={styles.dataButtonText}>Data deletion</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F4FE' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFB800',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: { fontSize: 40, fontWeight: 'bold', color: '#1a1a2e' },
  displayName: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  rankTitle: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 8 },
  badges: { fontSize: 12, color: '#2563eb', textAlign: 'center', marginBottom: 16 },
  stats: { marginBottom: 16, gap: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FFB800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  outlineButton: { padding: 16, alignItems: 'center', marginBottom: 16 },
  outlineButtonText: { color: '#2563eb', fontWeight: '600' },
  buttonText: { color: '#1a1a2e', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 12, textAlign: 'center' },
  qrWrap: { alignItems: 'center', marginBottom: 16 },
  dataButton: { marginTop: 24, padding: 12 },
  dataButtonText: { color: '#666', textAlign: 'center' },
  signOut: { marginTop: 8, padding: 12 },
  signOutText: { color: '#dc2626', textAlign: 'center', fontWeight: '600' },
});
