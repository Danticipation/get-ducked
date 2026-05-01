import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as qlimit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUserProfile } from './userService';

const DUCK_EVENTS = 'duckEvents';

export interface RecordDuckParams {
  fromUid: string;
  toUid: string;
  location?: { latitude: number; longitude: number };
}

export interface DuckEventResult {
  eventId: string;
  pointsAwarded?: number;
  isRevenge?: boolean;
  chainLength?: number;
}

export interface RecentDuckEntry {
  eventId: string;
  direction: 'gave' | 'received';
  otherUid: string;
  otherDisplayName: string;
  pointsAwarded?: number;
  isRevenge?: boolean;
  timestampMs: number;
}

/**
 * Create a duck event. Cloud Function will compute points, revenge, chain, and update user stats.
 * Polls the event doc for pointsAwarded (set by the function) and returns when available or after timeout.
 */
export async function recordDuck(params: RecordDuckParams): Promise<DuckEventResult> {
  const ref = await addDoc(collection(db, DUCK_EVENTS), {
    fromUid: params.fromUid,
    toUid: params.toUid,
    timestamp: serverTimestamp(),
    location: params.location ?? null,
  });
  let pointsAwarded: number | undefined;
  let isRevenge: boolean | undefined;
  let chainLength: number | undefined;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const snap = await getDoc(doc(db, DUCK_EVENTS, ref.id));
    const data = snap.data();
    if (data?.pointsAwarded !== undefined) {
      pointsAwarded = data.pointsAwarded as number;
      isRevenge = data.isRevenge as boolean | undefined;
      chainLength = data.chainLength as number | undefined;
      break;
    }
  }
  return { eventId: ref.id, pointsAwarded, isRevenge, chainLength };
}

/**
 * Fetch recent duck events involving this user (either as giver or receiver).
 * Limited to `n` per direction, merged and sorted by timestamp desc. Returns up to `n` total.
 */
export async function getRecentDucks(uid: string, n: number = 10): Promise<RecentDuckEntry[]> {
  const gaveQ = query(
    collection(db, DUCK_EVENTS),
    where('fromUid', '==', uid),
    orderBy('timestamp', 'desc'),
    qlimit(n)
  );
  const receivedQ = query(
    collection(db, DUCK_EVENTS),
    where('toUid', '==', uid),
    orderBy('timestamp', 'desc'),
    qlimit(n)
  );

  const [gaveSnap, receivedSnap] = await Promise.all([
    getDocs(gaveQ),
    getDocs(receivedQ),
  ]);

  const raw: RecentDuckEntry[] = [];
  gaveSnap.docs.forEach((d) => {
    const data = d.data();
    if (!data) return;
    const ts = data.timestamp;
    const ms = ts?.toMillis?.() ?? 0;
    raw.push({
      eventId: d.id,
      direction: 'gave',
      otherUid: (data.toUid as string) || '',
      otherDisplayName: '',
      pointsAwarded: data.pointsAwarded,
      isRevenge: data.isRevenge,
      timestampMs: ms,
    });
  });
  receivedSnap.docs.forEach((d) => {
    const data = d.data();
    if (!data) return;
    const ts = data.timestamp;
    const ms = ts?.toMillis?.() ?? 0;
    raw.push({
      eventId: d.id,
      direction: 'received',
      otherUid: (data.fromUid as string) || '',
      otherDisplayName: '',
      pointsAwarded: data.pointsAwarded,
      isRevenge: data.isRevenge,
      timestampMs: ms,
    });
  });

  raw.sort((a, b) => b.timestampMs - a.timestampMs);
  const top = raw.slice(0, n);

  // Cache display names across distinct UIDs to minimize reads.
  const uniqueUids = Array.from(new Set(top.map((e) => e.otherUid).filter(Boolean)));
  const nameMap: Record<string, string> = {};
  await Promise.all(
    uniqueUids.map(async (u) => {
      const p = await getUserProfile(u);
      nameMap[u] = p?.displayName || p?.username || 'Ducker';
    })
  );
  top.forEach((e) => {
    e.otherDisplayName = nameMap[e.otherUid] || 'Ducker';
  });
  return top;
}
