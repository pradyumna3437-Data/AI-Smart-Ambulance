import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const tabs = ['Overview', 'Emergency', 'Drivers', 'Profile'];

const stats = [
  { label: 'Calls', value: '24', color: '#ef4444', icon: 'alert-circle' },
  { label: 'Ambulances', value: '12', color: '#22c55e', icon: 'car' },
  { label: 'Response', value: '6.8m', color: '#38bdf8', icon: 'timer' },
  { label: 'ICU Beds', value: '9', color: '#f59e0b', icon: 'medkit' },
];

const quickActions = [
  { title: 'SOS Request', icon: 'warning', color: '#ef4444' },
  { title: 'Track Ride', icon: 'location', color: '#3b82f6' },
  { title: 'Hospitals', icon: 'business', color: '#8b5cf6' },
  { title: 'Drivers', icon: 'people', color: '#14b8a6' },
];

const dispatches = [
  { id: 'EM-2048', type: 'Cardiac Arrest', eta: '4 min', priority: 'Critical', status: 'En route' },
  { id: 'EM-2041', type: 'MVA Accident', eta: '7 min', priority: 'High', status: 'Assigned' },
  { id: 'EM-2037', type: 'Respiratory Distress', eta: '11 min', priority: 'Medium', status: 'Evaluating' },
];

const hospitalCards = [
  { name: 'AIIMS Bhubaneswar', beds: '18 ICU beds', distance: '3.2 km' },
  { name: 'SUM Hospital', beds: '11 ICU beds', distance: '5.8 km' },
  { name: 'Kalinga General', beds: '7 ICU beds', distance: '7.1 km' },
];

const driverList = [
  { name: 'Rahul S.', vehicle: 'AMB-07', status: 'Available' },
  { name: 'Aman P.', vehicle: 'AMB-11', status: 'On route' },
  { name: 'Bikash M.', vehicle: 'AMB-03', status: 'Standby' },
];

export default function App() {
  const [selectedTab, setSelectedTab] = useState('Overview');
  const [patientName, setPatientName] = useState('');
  const [location, setLocation] = useState('Bhubaneswar, Odisha');
  const [priority, setPriority] = useState('Critical');

  const tabContent = useMemo(() => {
    if (selectedTab === 'Overview') {
      return (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroLabel}>Live Response</Text>
                <Text style={styles.heroTitle}>Network operating normally</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="pulse" size={14} color="#dcfce7" />
                <Text style={styles.badgeText}>Stable</Text>
              </View>
            </View>
            <Text style={styles.heroText}>2 ambulances are approaching nearby zones and 1 trauma team is on standby.</Text>
            <View style={styles.heroFooter}>
              <View>
                <Text style={styles.footerLabel}>Nearest available</Text>
                <Text style={styles.footerValue}>AMB-07 / Bhubaneswar East</Text>
              </View>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Dispatch</Text>
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
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionLink}>View all</Text>
          </View>

          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.title} style={styles.actionCard}>
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
            <Text style={styles.sectionTitle}>Emergency Request</Text>
            <TextInput
              style={styles.input}
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Patient name"
              placeholderTextColor="#94a3b8"
            />
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
              placeholderTextColor="#94a3b8"
            />
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
            <Pressable style={styles.primaryButtonWide}>
              <Text style={styles.primaryButtonText}>Send emergency alert</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Live Dispatches</Text>
            <Text style={styles.sectionLink}>Updated now</Text>
          </View>

          {dispatches.map((item) => (
            <View key={item.id} style={styles.dispatchCard}>
              <View style={styles.dispatchTopRow}>
                <View>
                  <Text style={styles.dispatchId}>{item.id}</Text>
                  <Text style={styles.dispatchType}>{item.type}</Text>
                </View>
                <Text style={[styles.priorityTag, item.priority === 'Critical' ? styles.priorityCritical : item.priority === 'High' ? styles.priorityHigh : styles.priorityMedium]}>
                  {item.priority}
                </Text>
              </View>
              <View style={styles.dispatchMetaRow}>
                <Text style={styles.metaText}><Ionicons name="time-outline" size={12} color="#94a3b8" /> {item.eta}</Text>
                <Text style={styles.metaText}><Ionicons name="navigate-outline" size={12} color="#94a3b8" /> {item.status}</Text>
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
            <Text style={styles.sectionTitle}>Driver Status</Text>
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
              <Text style={styles.profileName}>Dr. Aisha Sen</Text>
              <Text style={styles.profileRole}>Emergency Coordinator</Text>
            </View>
          </View>
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
              <Text style={styles.profileStatValue}>N/A</Text>
              <Text style={styles.profileStatLabel}>Shift</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recommended Hospitals</Text>
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
  }, [location, patientName, priority, selectedTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#07111f" />

      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Emergency Service</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: '#07111f',
  },
  kicker: {
    color: '#7dd3fc',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  signalBox: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  signalText: {
    color: '#dcfce7',
    fontSize: 11,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#0c1726',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#11263d',
    borderWidth: 1,
    borderColor: '#1d4ed8',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#f8fafc',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#7dd3fc',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  heroBadge: {
    backgroundColor: '#14532d',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#dcfce7',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  heroText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
  },
  heroFooter: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonWide: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  grid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionLink: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  input: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    marginTop: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b1220',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
  },
  priorityText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 12,
  },
  priorityTextActive: {
    color: '#eff6ff',
  },
  dispatchCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 12,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispatchId: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  dispatchType: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  priorityTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '800',
  },
  priorityCritical: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
  },
  priorityHigh: {
    backgroundColor: '#78350f',
    color: '#fed7aa',
  },
  priorityMedium: {
    backgroundColor: '#1e3a8a',
    color: '#bfdbfe',
  },
  dispatchMetaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b1220',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  driverVehicle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  driverStatus: {
    fontSize: 11,
    fontWeight: '800',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusAvailable: {
    backgroundColor: '#14532d',
    color: '#dcfce7',
  },
  statusBusy: {
    backgroundColor: '#7f1d1d',
    color: '#fecaca',
  },
  statusStandby: {
    backgroundColor: '#78350f',
    color: '#fed7aa',
  },
  profileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  profileRole: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  profileStatBox: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  profileStatValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  profileStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  hospitalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 10,
  },
  hospitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalAvatar: {
    backgroundColor: '#1d4ed8',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hospitalName: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 14,
  },
  hospitalBeds: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  hospitalDistance: {
    color: '#7dd3fc',
    fontWeight: '700',
    fontSize: 12,
  },
});
