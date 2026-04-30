# Duck U

> **Don't be Wack, Do Quack!**
>
> A gamified, IRL duck-sharing game for Jeep owners (and anyone else who wants to get ducked). Scan another player's QR sticker, earn points, climb the leaderboard.

---

## Status

**Phase 1  — Core gameplay complete.** Native Android dev build running via EAS Build. Ready for polish, then beta testers.

| Area                           | Status |
|---------------------------------|--------|
| Auth (signup / signin / persistence / show-password / forgot-password) | ✅     |
| Onboarding + QR generation                                    | ✅     |
| Profile (read / edit / realtime cross-device sync)          | ✅     |
| Scanner (single-fire lock, personalized "You ducked X{" wording)    | ✅     |
| Cloud Function scoring (first-duck bonus, night owl, revenge, chains)   | ✅     |
| Weekly leaderboard snapshot (Cloud Function, scheduled Sunday 00:00 UTC)  | ✅     |
| Three-tab navigation (Home / Leaderboard / Profile)         | ✅     |
| Firestore rules + indexes deployed                               | ✅     |
| Native dev build (Android APK via EAS)                       | ✅     |
| Push notifications                                          | ⚺ Phase 2 |
| Quack sound / haptic                                           | ⚺ Phase 2 |
| Web companion (Firebase Hosting)                             | ⚺ Phase 2 |
| iOS build                                                         | ⚺ Phase 2 |
| Google Play submission                                      | ⚺ Phase 2 |

---

## Stack

-**Client:** React Native 0.81.5 / Expo SDK 54, TypeScript, React Navigation v7 (stack + bottom tabs)
- **Auth:** Firebase Auth (email/password, persisted via `@react-native-async-storage`)
- **DB:** Cloud Firestore (realtime `onSnapshot` for profile sync)
- **Backend logic:** Firebase Cloud Functions (v1, TS, Node 20)
- **Camera + QR scan:** `expo-camera`
- **QR generation:** `react-native-qrcode-svg`
- **Build:** EAS Build (profile: `development`, Android APK)

---

## Repo layout

```
.
├── App.tsx                  # Root navigator / gates/error boundary
├── index.tsx                 # Expo entry point
├── app.json                  # Expo config (slug=duck-u, camera perm, adaptive icon)
├── eas.json                  # EAS Build profiles (dev / preview / prod)
-├── .env.example              # Firebase public config template
├── firebase.json             # Firebase CLI config (rules / indexes / functions)
-├── firestore.rules           # Security rules
-├── firestore.indexes.json   # Composite indexes
├── functions/                # Cloud Functions (TS, Node 20)
├── src/
│  ├── config/                # Firebase init
-│  ├── constants/             # Env readers
│  ├── contexts/              # AuthContext (realtime profile sync)
│  ├── screens/               # Auth / Onboarding / Home / Scanner / Leaderboard / Profile
-│  ├── services/              # duckService / userService
-│  ├── types/                 # UserProfile / DuckEvent / WeeklyLeaderboardDoc
-│  └── utils/qr.ts            # QR payload gen/parse
└── docs/plans/              # Original design + implementation plans
```

---

## Data model

**`users/{uid}`**
- `uid`, `username`, `displayName`, `avatarUrl`, `jeepNickname`, `jeepColor`
- `totalDucksGiven`, `totalDucksReceived`, `totalPoints`
- `currentStreak`, `bestStreak`
- `rankTitle` — derived from `totalPoints` (Sitting Duck / Quack Lord / Quack Assassin / Supreme Duckinator)
- `badges[]`, `onboarded`, `pushToken` (Phase 2)

**`duckEvents/{eventId}`**  (append-only)
- `fromUid`, `toUid`, `timestamp`
- Written by scanner; Cloud Function fills in `pointsAwarded`, `isRevenge`, `chainLength` on create.

**`leaderboards/{weekStart}_{userId}`**
- `weekStart` (ISO YYYY-MM-DD, UTC Monday), `userId`, `score`, `rank`
- Generated every Sunday at 00:00 UTC by `weeklyLeaderboardSnapshot`.

---

## Scoring rules (source of truth: `functions/src/index.ts`)

| Event                         | Points      |
|-------------------------------|-------------|
| First time ducking a new user | +5          |
| Regular duck                  | +3          |
| Night Owl bonus (10PM – 6AM UTC) | +2          |
| Revenge (they ducked you first) | double points |
| Duck chain (3–+ ducks in a row) | +10 bonus + double points |
| Self-duck (shame!)             | –5           |

---

## Local development

### Prerequisites
- Node 20.19+
- Firebase CLI (`npm i -g firebase-tools`)  — logged in to the `duck-u` project
- EAS CLI (`npm i -g eas-cli`)  — logged in as `onlydanz`

### Setup

```sh
npm install
cp .env.example .env
# Edit .env with firebase project config (apiKey, projectId, etc.)
```

### Run client (dev build mode)

```sh
npx expo start --dev-client
```
Open the installed \"Duck U\" APK on your Android device (not Expo Go).

### Run Cloud Functions build check

```sh
cd functions
npm run build
```

### Deploy Firebase rules / indexes / functions

```sh
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

### Build a new Android dev APK

```sh
expo start --dev-client   # if running
Ctrl+C
eas build --profile development --platform android
```

---

## Push notifications

**Not wired up yet (Phase 2).**  The Cloud Function already attempts FCM sends to `users.{uid}.pushToken` but the client never registers one.  To add:

1. `npx expo install expo-notifications`
2. On app launch, request permission + fetch Expo push token, write to `users/{uid}.pushToken`.
3. Switch the Cloud Function from raw `admin.messaging()` to Expo's push API (https://expo.dev/notifications).
4. Test end-to-end in the dev build.

---

## Known issues

- **Engine warnings** for packages preferring Node ≥ 20.19.4. Current Node is 20.19.0. Cosmetic, non-blocking.
- **12 moderate npm vulnerabilities** from transitive RN deps. Dependabot will surface patches as they ship upstream.
- **Obsolete `expo-av` warning**: `expo-av` is deprecated in SDK 54, replaced by `expo-audio`/`expo-video`. Cleanup due in Phase 2.
- **Liner-full \"Text strings must be rendered within <Text>\" dev-warnings** (Expo Go): Gone in dev build.

---

## Next steps

1. Polish (now): quack sound, haptic buzz on duck, recent ducks feed, empty-state copy, icon polish.
2. Beta test with 5–10 real humans (share the EAS build link).
3. Push notifications (Phase 2).
4. Web companion (Firebase Hosting) — profile pages at `ducku.app/profile/{uid}` that anyone can scan, whether they installed the app or not.

---

_Consolidated from [Danticipation/Duck-U](https://github.com/Danticipation/Duck-U) (archived) into this repo 2026-04-28.  Original design plans under `docs/plans/` are historical — refer to this README for current state._
