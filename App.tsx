import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FIREBASE_CONFIG } from './src/constants/env';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';

function FirebaseConfigGuard({ children }: { children: React.ReactNode }) {
  const hasConfig =
    FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.apiKey;
  if (!hasConfig) {
    return (
      <View style={[styles.loading, { padding: 24 }]}>
        <Text style={[styles.loadingText, { textAlign: 'center', marginBottom: 12 }]}>
          Firebase not configured
        </Text>
        <Text style={[styles.loadingText, { fontSize: 14, textAlign: 'center' }]}>
          Add a .env file in the duck-u folder with EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_PROJECT_ID, etc. See .env.example.
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={[styles.loading, { padding: 24 }]}>
          <Text style={[styles.loadingText, { marginBottom: 8 }]}>Something went wrong</Text>
          <Text style={[styles.loadingText, { fontSize: 12 }]}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const [showScanner, setShowScanner] = React.useState(false);
  if (showScanner) {
    return (
      <ScannerScreen onBack={() => setShowScanner(false)} />
    );
  }
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FFB800',
        tabBarInactiveTintColor: '#666',
        headerStyle: { backgroundColor: '#E6F4FE' },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ title: 'Duck U', tabBarLabel: 'Home' }}
      >
        {() => <HomeScreen onScanPress={() => setShowScanner(true)} />}
      </Tab.Screen>
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFB800" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    );
  }

  if (!profile?.onboarded) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={() => refreshProfile()} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <FirebaseConfigGuard>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </FirebaseConfigGuard>
      </AppErrorBoundary>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4FE',
    gap: 12,
  },
  loadingText: { color: '#1a1a2e' },
});
