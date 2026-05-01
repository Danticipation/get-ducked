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
import { taglineForRank } from '../utils/storyMessages';

function streakHint(current: number): string {
  if (current >= 5) return '🔥 On a heater 🔥';
  if (current >= 3) return 'Nice run. 1 more → bonus';
  if (current >= 1) return 'Keep it alive.';
  return 'Start a streak!';
}

export default function ProfileScreen() {
  const { user, profile } = useAuth();
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
  const currentStreak = profile.currentStreak ?? 0;
  const bestStreak = profile.bestStreak ?? 0;
  const tagline = taglineForRank(profile.rankTitle, currentStreak);
  const given = profile.totalDucksGiven ?? 0;
  const received = profile.totalDucksReceived ?? 0;
  const points = profile.totalPoints ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarLetter}>
          {(profile.displayName || profile.username || 'D').trim().charAt(0).toUpperCase()}
        </Text>
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
          <Text style={styles.tagline}>{tagline}</Text>
          {profile.badges && profile.badges.length > 0 ? (
            <Text style={styles.badges}>{profile.badges.join(' · ')}</Text>
          ) : null}
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{given}</Text>
              <Text style={styles.statLabel}>Given</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{received}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>
              Streak: {currentStreak}  •  Best: {bestStreak}
            </Text>
            <Text style={styles.streakHint}>{streakHint(currentStreak)}</Text>
          </View>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setEditing(true)}>
            <Text style={styles.outlineButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.sectionTitle}>My duck QR</Text>
      <Text style={styles.qrHint}>Print it. Stick it. Get ducked.</Text>
      <View style={styles.qrWrap}>
        <QRCode value={qrValue} size={200} />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          Alert.alert('Print me!', 'Show this QR to let others duck you. Or stick it on your Jeep.')
        }
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
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFB800',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { fontSize: 40, fontWeight: 'bold', color: '#1a1a2e' },
  displayName: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  rankTitle: { fontSize: 14, color: '#555', textAlign: 'center' },
  tagline: { fontSize: 13, color: '#999', textAlign: 'center', fontStyle: 'italic', marginTop: 2, marginBottom: 12 },
  badges: { fontSize: 12, color: '#2563eb', textAlign: 'center', marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  streakRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  streakText: { fontSize: 14, color: '#1a1a2e', fontWeight: '600' },
  streakHint: { fontSize: 12, color: '#933702', marginTop: 4 },
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
  outlineButton: { padding: 14, alignItems: 'center', marginBottom: 12 },
  outlineButtonText: { color: '#2563eb', fontWeight: '600' },
  buttonText: { color: '#1a1a2e', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 4, textAlign: 'center' },
  qrHint: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  qrWrap: { alignItems: 'center', marginBottom: 16 },
  dataButton: { marginTop: 24, padding: 12 },
  dataButtonText: { color: '#666', textAlign: 'center' },
  signOut: { marginTop: 8, padding: 12 },
  signOutText: { color: '#dc2626', textAlign: 'center', fontWeight: '600' },
});
