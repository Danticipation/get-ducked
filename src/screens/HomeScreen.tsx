import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ onScanPress }: { onScanPress: () => void }) {
  const { profile } = useAuth();
  const streak = profile?.currentStreak ?? 0;
  const ducked = profile?.totalDucksReceived ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duck U</Text>
      <Text style={styles.tagline}>Don't be Wack, Do Quack!</Text>
      <View style={styles.stats}>
        <Text style={styles.streak}>Streak: {streak}</Text>
        <Text style={styles.ducked}>You have been ducked {ducked} times</Text>
      </View>
      <TouchableOpacity style={styles.scanButton} onPress={onScanPress}>
        <Text style={styles.scanButtonText}>Scan a duck</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#E6F4FE', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1a1a2e' },
  tagline: { fontSize: 14, textAlign: 'center', color: '#4a4a6a', marginBottom: 32 },
  stats: { marginBottom: 24, alignItems: 'center', gap: 8 },
  streak: { fontSize: 18, fontWeight: '600', color: '#1a1a2e' },
  ducked: { fontSize: 14, color: '#555' },
  scanButton: { backgroundColor: '#FFB800', padding: 20, borderRadius: 12, alignItems: 'center' },
  scanButtonText: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
});
