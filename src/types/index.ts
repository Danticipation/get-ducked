export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  jeepNickname?: string;
  jeepColor?: string;
  totalDucksGiven: number;
  totalDucksReceived: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  rankTitle: string;
  badges?: string[];
  onboarded?: boolean;
  pushToken?: string;
  isAdmin?: boolean;
}

export interface DuckEvent {
  id: string;
  fromUid: string;
  toUid: string;
  timestamp: { toDate: () => Date };
  pointsAwarded: number;
  isRevenge?: boolean;
  isDriveThruBonus?: boolean;
  chainLength?: number;
  location?: { latitude: number; longitude: number };
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName?: string;
  score: number;
  rank: number;
  rankTitle?: string;
}

export interface WeeklyLeaderboardDoc {
  weekStart: string;
  userId: string;
  score: number;
  rank: number;
}
