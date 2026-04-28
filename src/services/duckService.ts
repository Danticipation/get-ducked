import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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
