import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

const developmentHost = Constants.expoConfig?.hostUri?.split(':')[0];
const API_BASE = process.env.EXPO_PUBLIC_API_URL
  || (developmentHost
    ? `http://${developmentHost}:8000/api`
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:8000/api'
      : 'http://localhost:8000/api');
const SESSION_STORAGE_KEY = 'smart-ambulance.session';

const tabs = ['Overview', 'Emergency', 'Drivers', 'Profile'];
const stats = [
  { label: 'Calls', value: '24', color: '#ef4444', icon: 'alert-circle' },
  { label: 'Ambulances', value: '12', color: '#22c55e', icon: 'car' },
  { label: 'Response', value: '6.8m', color: '#38bdf8', icon: 'timer' },
  { label: 'ICU Beds', value: '9', color: '#f59e0b', icon: 'medkit' },
] as const;

const quickActions = [
  { title: 'SOS Request', icon: 'warning', color: '#ef4444' },
  { title: 'Track Ride', icon: 'location', color: '#3b82f6' },
  { title: 'Hospitals', icon: 'business', color: '#8b5cf6' },
  { title: 'Drivers', icon: 'people', color: '#14b8a6' },
] as const;

const driverList = [
  { name: 'Rahul S.', vehicle: 'AMB-07', status: 'Available' },
  { name: 'Aman P.', vehicle: 'AMB-11', status: 'On route' },
  { name: 'Bikash M.', vehicle: 'AMB-03', status: 'Standby' },
];

const hospitalCards = [
  { name: 'AIIMS Bhubaneswar', beds: '18 ICU beds', distance: '3.2 km' },
  { name: 'SUM Hospital', beds: '11 ICU beds', distance: '5.8 km' },
  { name: 'Kalinga General', beds: '7 ICU beds', distance: '7.1 km' },
];

const defaultCredentials = {
  email: 'citizen@example.com',
  password: 'testpass123',
};

type AppUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  created_at?: string;
};

type StoredSession = {
  access_token: string;
  user: AppUser;
};

async function saveSession(session: StoredSession) {
  const serialized = JSON.stringify(session);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, serialized);
}

async function readSession(): Promise<StoredSession | null> {
  const serialized = Platform.OS === 'web'
    ? window.localStorage.getItem(SESSION_STORAGE_KEY)
    : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  if (!serialized) return null;

  const session: Partial<StoredSession> = JSON.parse(serialized);
  if (
    typeof session.access_token !== 'string' ||
    !session.user ||
    typeof session.user.id !== 'number' ||
    typeof session.user.name !== 'string' ||
    typeof session.user.email !== 'string' ||
    typeof session.user.role !== 'string'
  ) {
    throw new Error('Saved sign-in data is invalid');
  }
  return { access_token: session.access_token, user: session.user };
}

async function removeSession() {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

async function fetchJson(
  url: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {},
): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.detail || 'Request failed');
  }

  return payload;
}

export default function HomeScreen() {
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [priority, setPriority] = useState('Critical');
  const [emergencyType, setEmergencyType] = useState('TRAUMA');
  const [loginEmail, setLoginEmail] = useState(defaultCredentials.email);
  const [loginPassword, setLoginPassword] = useState(defaultCredentials.password);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('Checking backend...');
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingEmergency, setIsSendingEmergency] = useState(false);
  const [emergencyFeedback, setEmergencyFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const loadEmergencies = async () => {
    try {
      const data = await fetchJson(`${API_BASE}/emergencies/`);
      setEmergencies(Array.isArray(data) ? data : []);
      setStatusMessage('Backend connected');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Backend offline');
    }
  };

  useEffect(() => {
    loadEmergencies();
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const savedSession = await readSession();
        if (!savedSession) return;

        if (isMounted) {
          setAuthToken(savedSession.access_token);
          setUser(savedSession.user);
        }

        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${savedSession.access_token}` },
          });
          if (response.status === 401) {
            await removeSession();
            if (isMounted) {
              setAuthToken(null);
              setUser(null);
              setStatusMessage('Your saved session expired. Please sign in again.');
            }
            return;
          }
          if (!response.ok) {
            throw new Error(`Session verification failed (${response.status})`);
          }

          const currentUser: AppUser = await response.json();
          await saveSession({ access_token: savedSession.access_token, user: currentUser });
          if (isMounted) {
            setUser(currentUser);
            setStatusMessage(`Logged in as ${currentUser.name}`);
          }
        } catch {
          if (isMounted) setStatusMessage('Saved session loaded, but could not be verified. Check the backend connection.');
        }
      } catch (error) {
        if (isMounted) {
          setStatusMessage(error instanceof Error ? error.message : 'Unable to restore saved sign-in');
        }
      } finally {
        if (isMounted) setIsRestoringSession(false);
      }
    };

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async () => {
    setIsSigningIn(true);
    try {
      const result = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (!result.access_token || !result.user) {
        throw new Error('The server returned an invalid sign-in response');
      }
      await saveSession({ access_token: result.access_token, user: result.user });
      setAuthToken(result.access_token);
      setUser(result.user);
      setStatusMessage(`Logged in as ${result.user?.name ?? 'user'}`);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to log in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    try {
      await removeSession();
      setAuthToken(null);
      setUser(null);
      setStatusMessage('You are signed out.');
    } catch (error) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Unable to clear saved sign-in');
    }
  };

  const createEmergency = async () => {
    if (!authToken || !user) {
      Alert.alert('Sign in required', 'Sign in from the Profile tab before sending an emergency request.');
      setSelectedTab('Profile');
      return;
    }

    setIsSendingEmergency(true);
    setEmergencyFeedback({ message: 'Checking location permission...', isError: false });
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setEmergencyFeedback({
          message: 'Location permission is required. Allow location access in your phone settings, then try again.',
          isError: true,
        });
        return;
      }

      setEmergencyFeedback({ message: 'Getting your GPS location...', isError: false });
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const payload = {
        user_id: user.id,
        emergency_type: emergencyType,
        severity: priority.toUpperCase(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const created = await fetchJson(`${API_BASE}/emergencies/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setEmergencyFeedback({
        message: `Request #${created.id} saved. Status: ${created.status}.`,
        isError: false,
      });
      await loadEmergencies();
    } catch (error) {
      setEmergencyFeedback({
        message: error instanceof Error ? error.message : 'Could not send emergency request',
        isError: true,
      });
    } finally {
      setIsSendingEmergency(false);
    }
  };

  const openQuickAction = (title: string) => {
    const destinations: Record<string, string> = {
      'SOS Request': 'Emergency',
      'Track Ride': 'Emergency',
      Hospitals: 'Profile',
      Drivers: 'Drivers',
    };
    setSelectedTab(destinations[title] || 'Overview');
  };

  const tabContent = useMemo(() => {
    if (selectedTab === 'Overview') {
      return (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroLabel}>Live response</Text>
                <Text style={styles.heroTitle}>Network operating normally</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="pulse" size={14} color="#dcfce7" />
                <Text style={styles.badgeText}>Stable</Text>
              </View>
            </View>
            <Text style={styles.heroText}>{statusMessage}</Text>
            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.footerLabel}>Nearest available</Text>
                <Text style={styles.footerValue}>AMB-07 / Bhubaneswar East</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={loadEmergencies}>
                <Text style={styles.primaryButtonText}>Refresh</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.grid}>
            {stats.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Pressable onPress={() => setSelectedTab('Emergency')}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.title} style={styles.actionCard} onPress={() => openQuickAction(action.title)}>
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}1a` }]}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </>
      );
    }

    if (selectedTab === 'Emergency') {
      return (
        <>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Emergency request</Text>
            <Text style={styles.heroText}>Your current GPS location will be attached when you send the request.</Text>
            <View style={styles.priorityRow}>
              {[
                { label: 'Medical', value: 'MEDICAL' },
                { label: 'Trauma', value: 'TRAUMA' },
                { label: 'Cardiac', value: 'CARDIAC' },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setEmergencyType(item.value)}
                  style={[styles.priorityButton, emergencyType === item.value && styles.priorityButtonActive]}
                >
                  <Text style={[styles.priorityText, emergencyType === item.value && styles.priorityTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.priorityRow}>
              {['Critical', 'High', 'Medium'].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPriority(item)}
                  style={[styles.priorityButton, priority === item && styles.priorityButtonActive]}
                >
                  <Text style={[styles.priorityText, priority === item && styles.priorityTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.primaryButtonWide}
              onPress={createEmergency}
              disabled={isSendingEmergency}
            >
              <Text style={styles.primaryButtonText}>{isSendingEmergency ? 'Sending request...' : 'Send emergency alert'}</Text>
            </Pressable>
            {emergencyFeedback && (
              <Text style={[
                styles.emergencyFeedback,
                emergencyFeedback.isError && styles.emergencyFeedbackError,
              ]}>
                {emergencyFeedback.message}
              </Text>
            )}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Current dispatches</Text>
            <Pressable onPress={loadEmergencies}>
              <Text style={styles.sectionLink}>Refresh · {emergencies.length} requests</Text>
            </Pressable>
          </View>

          {(emergencies.length ? emergencies : [{ id: 0, emergency_type: 'No active calls', severity: 'N/A' }]).slice(0, 3).map((item) => (
            <View key={item.id ?? item.emergency_type} style={styles.dispatchCard}>
              <View style={styles.dispatchTopRow}>
                <View>
                  <Text style={styles.dispatchId}>{item.id ? `EM-${item.id}` : 'System'}</Text>
                  <Text style={styles.dispatchType}>{item.emergency_type || item.emergencyType || 'No active calls'}</Text>
                </View>
                <Text style={[styles.priorityTag, item.severity === 'CRITICAL' ? styles.priorityCritical : item.severity === 'HIGH' ? styles.priorityHigh : styles.priorityMedium]}>
                  {item.severity || 'N/A'}
                </Text>
              </View>
              <View style={styles.dispatchMetaRow}>
                <Text style={styles.metaText}><Ionicons name="time-outline" size={12} color="#94a3b8" /> {item.status || 'Awaiting dispatch'}</Text>
                <Text style={styles.metaText}>
                  <Ionicons name="navigate-outline" size={12} color="#94a3b8" />{' '}
                  {typeof item.latitude === 'number' && typeof item.longitude === 'number'
                    ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                    : 'Location unavailable'}
                </Text>
              </View>
            </View>
          ))}
        </>
      );
    }

    if (selectedTab === 'Drivers') {
      return (
        <>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Driver status</Text>
            {driverList.map((driver) => (
              <View key={driver.name} style={styles.driverRow}>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={18} color="#f8fafc" />
                  </View>
                  <View>
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
                  </View>
                </View>
                <Text style={[styles.driverStatus, driver.status === 'Available' ? styles.statusAvailable : driver.status === 'On route' ? styles.statusBusy : styles.statusStandby]}>
                  {driver.status}
                </Text>
              </View>
            ))}
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={28} color="#f8fafc" />
            </View>
            <View>
              <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.profileRole}>{user?.role || 'Emergency coordinator'}</Text>
            </View>
          </View>

          {authToken ? (
            <View style={styles.loginCard}>
              <Text style={styles.profileRole}>Signed in as {user?.email}</Text>
              <Pressable style={styles.primaryButtonWide} onPress={logout}>
                <Text style={styles.primaryButtonText}>Sign out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.loginCard}>
              <TextInput
                style={styles.input}
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isSigningIn && !isRestoringSession}
              />
              <TextInput
                style={styles.input}
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                editable={!isSigningIn && !isRestoringSession}
              />
              <Pressable
                style={styles.primaryButtonWide}
                onPress={login}
                disabled={isSigningIn || isRestoringSession}
              >
                <Text style={styles.primaryButtonText}>
                  {isRestoringSession ? 'Restoring session...' : isSigningIn ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.profileStatsRow}>
            <View style={styles.profileStatBox}>
              <Text style={styles.profileStatValue}>42</Text>
              <Text style={styles.profileStatLabel}>Dispatches</Text>
            </View>
            <View style={styles.profileStatBox}>
              <Text style={styles.profileStatValue}>96%</Text>
              <Text style={styles.profileStatLabel}>Success</Text>
            </View>
            <View style={styles.profileStatBox}>
              <Text style={styles.profileStatValue}>A+</Text>
              <Text style={styles.profileStatLabel}>Shift</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recommended hospitals</Text>
          <Text style={styles.sectionLink}>Nearby</Text>
        </View>

        {hospitalCards.map((hospital) => (
          <View key={hospital.name} style={styles.hospitalCard}>
            <View style={styles.hospitalTopRow}>
              <View style={styles.hospitalAvatar}>
                <Ionicons name="medical" size={18} color="#eff6ff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <Text style={styles.hospitalBeds}>{hospital.beds}</Text>
              </View>
              <Text style={styles.hospitalDistance}>{hospital.distance}</Text>
            </View>
          </View>
        ))}
      </>
    );
  }, [selectedTab, priority, emergencyType, emergencies, loginEmail, loginPassword, authToken, user, statusMessage, isRestoringSession, isSigningIn, isSendingEmergency, emergencyFeedback, login, logout]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Emergency service</Text>
          <Text style={styles.title}>AI Smart Ambulance</Text>
        </View>
        <View style={styles.signalBox}>
          <View style={styles.signalDot} />
          <Text style={styles.signalText}>Online</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tabContent}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#07111f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, backgroundColor: '#07111f' },
  kicker: { color: '#7dd3fc', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700' },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800', marginTop: 4 },
  signalBox: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  signalDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#22c55e', marginRight: 6 },
  signalText: { color: '#dcfce7', fontSize: 11, fontWeight: '700' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0c1726', paddingHorizontal: 12, paddingVertical: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, marginHorizontal: 4 },
  activeTab: { backgroundColor: '#11263d', borderWidth: 1, borderColor: '#1d4ed8' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#f8fafc' },
  content: { padding: 18, paddingBottom: 30 },
  heroCard: { backgroundColor: '#0f172a', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#1e293b', shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 18, elevation: 8 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#7dd3fc', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  heroTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginTop: 4 },
  heroBadge: { backgroundColor: '#14532d', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  badgeText: { color: '#dcfce7', fontSize: 11, fontWeight: '700', marginLeft: 6 },
  heroText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22, marginTop: 18 },
  heroFooter: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  footerValue: { color: '#f8fafc', fontSize: 14, fontWeight: '700', marginTop: 4 },
  primaryButton: { backgroundColor: '#ef4444', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, minWidth: 100, alignItems: 'center', justifyContent: 'center' },
  primaryButtonWide: { backgroundColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  emergencyFeedback: { color: '#7dd3fc', fontSize: 13, lineHeight: 19, marginTop: 12, textAlign: 'center' },
  emergencyFeedbackError: { color: '#fca5a5' },
  grid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#0f172a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1e293b', marginBottom: 12 },
  statIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#f8fafc', fontSize: 24, fontWeight: '800', marginTop: 12 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionHeaderRow: { marginTop: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  sectionLink: { color: '#7dd3fc', fontSize: 11, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '48%', backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 18, alignItems: 'center', marginBottom: 12 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#e2e8f0', fontSize: 13, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  formCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  input: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#f8fafc', marginTop: 12 },
  priorityRow: { flexDirection: 'row', marginTop: 14 },
  priorityButton: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0b1220', marginHorizontal: 4, alignItems: 'center' },
  priorityButtonActive: { backgroundColor: '#1e3a8a', borderColor: '#60a5fa' },
  priorityText: { color: '#cbd5e1', fontWeight: '700', fontSize: 12 },
  priorityTextActive: { color: '#eff6ff' },
  dispatchCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 16, marginBottom: 12 },
  dispatchTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dispatchId: { color: '#7dd3fc', fontSize: 12, fontWeight: '700' },
  dispatchType: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginTop: 4 },
  priorityTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 10, fontWeight: '800' },
  priorityCritical: { backgroundColor: '#7f1d1d', color: '#fecaca' },
  priorityHigh: { backgroundColor: '#78350f', color: '#fed7aa' },
  priorityMedium: { backgroundColor: '#1e3a8a', color: '#bfdbfe' },
  dispatchMetaRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  driverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b', backgroundColor: '#0b1220', borderRadius: 14, padding: 12, marginTop: 12 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  driverName: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  driverVehicle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  driverStatus: { fontSize: 11, fontWeight: '800', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  statusAvailable: { backgroundColor: '#14532d', color: '#dcfce7' },
  statusBusy: { backgroundColor: '#7f1d1d', color: '#fecaca' },
  statusStandby: { backgroundColor: '#78350f', color: '#fed7aa' },
  profileCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  profileName: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  profileRole: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  loginCard: { marginTop: 18 },
  profileStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  profileStatBox: { flex: 1, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 4 },
  profileStatValue: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  profileStatLabel: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  hospitalCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14, marginBottom: 10 },
  hospitalTopRow: { flexDirection: 'row', alignItems: 'center' },
  hospitalAvatar: { backgroundColor: '#1d4ed8', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  hospitalName: { color: '#f8fafc', fontWeight: '800', fontSize: 14 },
  hospitalBeds: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  hospitalDistance: { color: '#7dd3fc', fontWeight: '700', fontSize: 12 },
});
