import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile, WeeklyLeaderboardDoc } from '../types';

const USERS = 'users';
const DEFAULT_USERNAME = 'JeepQuack42';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  // TODO: re-add "Founding Ducker" badge logic via a Cloud Function or counter doc.
  // Listing the entire users collection on every signup was an antipattern and
  // also failed under Firestore rules that allow per-doc reads but not list.
  const badges: string[] = [];

  const profile: Omit<UserProfile, 'uid'> & { uid: string } = {
    uid,
    username: data.username ?? DEFAULT_USERNAME,
    displayName: data.displayName ?? data.username ?? DEFAULT_USERNAME,
    avatarUrl: data.avatarUrl,
    jeepNickname: data.jeepNickname,
    jeepColor: data.jeepColor,
    totalDucksGiven: 0,
    totalDucksReceived: 0,
    totalPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
    rankTitle: 'Sitting Duck',
    badges,
    onboarded: data.onboarded ?? false,
    ...data,
  };

  const ref = doc(db, USERS, uid);
  await setDoc(ref, profile);
  return profile as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'username'
      | 'displayName'
      | 'avatarUrl'
      | 'jeepNickname'
      | 'jeepColor'
      | 'onboarded'
      | 'pushToken'
    >
  >
): Promise<void> {
  const ref = doc(db, USERS, uid);
  // Use setDoc with merge so the call works whether the doc exists yet or not.
  // Avoids the "permission-denied / not-found" hang from updateDoc on a missing doc.
  await setDoc(ref, updates as Record<string, unknown>, { merge: true });
}

export async function getAllTimeLeaderboard(
  limitCount: number = 50
): Promise<UserProfile[]> {
  const q = query(
    collection(db, USERS),
    orderBy('totalPoints', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
}

/** Get ISO week start (Monday) in UTC: YYYY-MM-DD. Must match Cloud Function. */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

type WeeklyLeaderboardRow = WeeklyLeaderboardDoc & {
  username?: string;
  displayName?: string;
};

export async function getWeeklyLeaderboard(
  limitCount: number = 50
): Promise<WeeklyLeaderboardRow[]> {
  const weekStart = getWeekStart(new Date());
  const q = query(
    collection(db, 'leaderboards'),
    where('weekStart', '==', weekStart),
    orderBy('score', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map(
    (d) =>
      ({ ...d.data(), userId: d.data().userId } as WeeklyLeaderboardRow)
  );
  for (const e of entries) {
    const profile = await getUserProfile(e.userId);
    if (profile) {
      e.username = profile.username;
      e.displayName = profile.displayName;
    }
  }
  return entries;
}
