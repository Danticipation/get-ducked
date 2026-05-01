import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getRecentDucks, RecentDuckEntry } from '../services/duckService';
import { feedLine, taglineForRank } from '../utils/storyMessages';

function formatTimeAgo(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / (24 * 3600000)) + 'd ago';
}

export default function HomeScreen({ onScanPress }: { onScanPress: () => void }) {
  const { user, profile } = useAuth();
  const streak = profile?.currentStreak ?? 0;
  const ducked = profile?.totalDucksReceived ?? 0;
  const given = profile?.totalDucksGiven ?? 0;
  const tagline = taglineForRank(profile?.rankTitle, streak);

  const [recent, setRecent] = useState<RecentDuckEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecent = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getRecentDucks(user.uid, 10);
      setRecent(data);
    } catch (e) {
      setRecent([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent, profile?.totalDucksGiven, profile?.totalDucksReceived]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecent();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Duck U</Text>
      <Text style={styles.tagline}>{tagline}</Text>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{given}</Text>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Ducked</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ducked}</Text>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Got ducked</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={onScanPress}>
        <Text style={styles.scanButtonText}>Scan a duck</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Ducks</Text>

      {loading ? null : recent.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No ducks yet — go hunt.</Text>
          <Text style={styles.emptyBody}>
            Print your QR from the Profile tab, slap it on your Jeep, and go find someone to duck.
          </Text>
        </View>
      ) : (
        <View style={styles.feed}>
          {recent.map((e) => (
            <View key={e.eventId} style={styles.feedRow}>
              <Text style={styles.feedArrow}>{e.direction === 'gave' ? '→' : '←'}</Text>
              <View style={styles.feedMiddle}>
                <Text style={styles.feedText}>
                  {feedLine({
                    direction: e.direction,
                    otherName: e.otherDisplayName,
                    isRevenge: e.isRevenge,
                    timestampMs: e.timestampMs,
                  })}
                </Text>
                <Text style={styles.feedTime}>{formatTimeAgo(e.timestampMs)}</Text>
              </View>
              {e.pointsAwarded != null ? (
                <Text style={[styles.feedPoints, e.pointsAwarded < 0 ? styles.feedPointsNeg : null]}>
                  {e.pointsAwarded >= 0 ? '+' : ''}{e.pointsAwarded}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F4FE' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1a1a2e' },
  tagline: { fontSize: 14, textAlign: 'center', color: '#4a4a6a', marginBottom: 20, fontStyle: 'italic' },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' },
  scanButton: {
    backgroundColor: '#FFB800',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#1a1a2e' },
  emptyCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: '#555', lineHeight: 20 },
  feed: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  feedArrow: { fontSize: 20, width: 28, textAlign: 'center', color: '#1a1a2e' },
  feedMiddle: { flex: 1, paddingHorizontal: 8 },
  feedText: { fontSize: 14, color: '#1a1a2e' },
  feedTime: { fontSize: 11, color: '#999', marginTop: 2 },
  feedPoints: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  feedPointsNeg: { color: '#dc2626' },
});
