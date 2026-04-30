import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserProfile, getUserProfile } from '../services/userService';

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email': return 'That email doesn\'t look right.';
    case 'auth/missing-password': return 'Enter a password.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/email-already-in-use': return 'That email is already registered. Try signing in.';
    case 'auth/user-not-found': return 'No account found with that email.';
    case 'auth/wrong-password': return 'Wrong password. Try again or tap Forgot password.';
    case 'auth/invalid-credential': return 'Email or password is incorrect. Try again or tap Forgot password.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a minute and try again.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default:
      return err instanceof Error ? err.message : 'Something went wrong.';
  }
}

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Oops', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = auth.currentUser;
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (!profile) {
            try {
              await createUserProfile(user.uid, { displayName: email.split('@')[0] });
            } catch (profileErr) {
              console.error('Profile creation failed:', profileErr);
              const msg = profileErr instanceof Error ? profileErr.message : 'Unknown error';
              Alert.alert('Setup error', 'Account created but profile failed: ' + msg);
              throw profileErr;
            }
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      Alert.alert('Quack!', friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type the email you signed up with into the email field, then tap Forgot password again.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'Check your email',
        'If an account exists for ' + email.trim() + ', we sent a password reset link.'
      );
    } catch (err) {
      Alert.alert('Reset failed', friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Duck U</Text>
      <Text style={styles.tagline}>Don't be Wack, Do Quack!</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.showToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.showToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading ? styles.buttonDisabled : null]}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switch}>
            {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
          </Text>
        </TouchableOpacity>
        {isSignUp ? null : (
          <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#E6F4FE' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#1a1a2e' },
  tagline: { fontSize: 16, textAlign: 'center', color: '#4a4a6a', marginBottom: 32 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    paddingRight: 70,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  showToggle: { position: 'absolute', right: 12, padding: 8 },
  showToggleText: { color: '#2563eb', fontWeight: '600' },
  button: {
    backgroundColor: '#FFB800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1a1a2e', fontWeight: '600', fontSize: 16 },
  switch: { color: '#2563eb', textAlign: 'center', marginTop: 8 },
  forgot: { color: '#2563eb', textAlign: 'center', marginTop: 4, textDecorationLine: 'underline' },
});
