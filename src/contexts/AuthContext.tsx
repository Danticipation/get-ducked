import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getUserProfile, createUserProfile } from '../services/userService';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef<Unsubscribe | null>(null);

  // Kept for backwards compat. With onSnapshot, profile refreshes automatically;
  // callers that still invoke refreshProfile() get a no-op that resolves immediately.
  const refreshProfile = async () => {
    return;
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Tear down any existing profile listener first.
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setUser(fbUser ?? null);

      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Make sure the profile doc exists before we start listening to it.
      try {
        const existing = await getUserProfile(fbUser.uid);
        if (!existing) {
          await createUserProfile(fbUser.uid, {
            displayName: fbUser.displayName ?? undefined,
            avatarUrl: fbUser.photoURL ?? undefined,
          });
        }
      } catch (e) {
        console.error('Profile bootstrap failed:', e);
      }

      // Attach a real-time listener so the UI reflects Cloud Function writes
      // and cross-device changes within 1-2 seconds.
      const ref = doc(db, 'users', fbUser.uid);
      profileUnsubRef.current = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('profile snapshot error:', err);
          setLoading(false);
        }
      );
    });

    return () => {
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      unsubAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}