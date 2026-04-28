import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
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

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getUserProfile(user.uid);
    setProfile(p ?? null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser ?? null);
      if (!fbUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      let p = await getUserProfile(fbUser.uid);
      if (!p) {
        p = await createUserProfile(fbUser.uid, {
          displayName: fbUser.displayName ?? undefined,
          avatarUrl: fbUser.photoURL ?? undefined,
        });
      }
      setProfile(p as UserProfile);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user?.uid]);

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
