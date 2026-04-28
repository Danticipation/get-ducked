import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getAllTimeLeaderboard, getWeeklyLeaderboard } from '../services/userService';
import type { UserProfile } from '../types';

type Tab = 'weekly' | 'alltime';

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('weekly');
  const [weekly, setWeekly] = useState<{ userId: string; username?: string; displayName?: string; score: number; rank: number }[]>([]);
  const [allTime, setAllTime] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (tab === 'weekly') {
          const data = await getWeeklyLeaderboard(50);
          if (!cancelled) setWeekly(data);
        } else {
          const data = await getAllTimeLeaderboard(50);
          if (!cancelled) setAllTime(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const crown = (rank: number) => (rank <= 3 ? ['👑', '🥈', '🥉'][rank - 1] : `${rank}.`);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.tabs}>
        <Text
          style={[styles.tab, tab === 'weekly' && styles.tabActive]}
          onPress={() => setTab('weekly')}
        >
          Weekly
        </Text>
        <Text
          style={[styles.tab, tab === 'alltime' && styles.tabActive]}
          onPress={() => setTab('alltime')}
        >
          All-time
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : tab === 'weekly' ? (
        <FlatList
          data={weekly}
          keyExtractor={(item) => item.userId}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{crown(index + 1)}</Text>
              <Text style={styles.name}>{item.displayName || item.username || 'Ducker'}</Text>
              <Text style={styles.score}>{item.score} pts</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No weekly scores yet.</Text>}
        />
      ) : (
        <FlatList
          data={allTime}
          keyExtractor={(item) => item.uid}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{crown(index + 1)}</Text>
              <Text style={styles.name}>{item.displayName || item.username}</Text>
              <Text style={styles.score}>{item.totalPoints ?? 0} pts</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No scores yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#E6F4FE' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 16, marginBottom: 16, justifyContent: 'center' },
  tab: { fontSize: 16, color: '#666' },
  tabActive: { fontWeight: 'bold', color: '#1a1a2e' },
  loader: { marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  rank: { width: 40, fontSize: 16 },
  name: { flex: 1, fontSize: 16 },
  score: { fontSize: 16, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },
});
