import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.fullname}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="person-outline" size={32} color={Colors.primary} />
            <Text style={styles.statLabel}>Username</Text>
            <Text style={styles.statValue}>{user?.username}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.primary} />
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{user?.age || 'N/A'}</Text>
          </View>

          {user?.weight && (
            <View style={styles.statCard}>
              <Ionicons name="fitness-outline" size={32} color={Colors.primary} />
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{user.weight} kg</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardText}>
            Your fitness journey starts here! Track your progress, set goals, and achieve greatness.
          </Text>
          <View style={styles.motivationBox}>
            <Ionicons name="trophy-outline" size={24} color={Colors.primary} style={styles.motivationIcon} />
            <Text style={styles.motivationText}>
              "The only bad workout is the one that didn't happen."
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="barbell-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Start Workout</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.darkGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="nutrition-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Track Nutrition</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.darkGray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>View Progress</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.darkGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  greeting: {
    fontSize: 16,
    color: Colors.lightGray,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.darkGray,
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
  dashboardCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  dashboardText: {
    fontSize: 16,
    color: Colors.lightGray,
    lineHeight: 24,
    marginBottom: 20,
  },
  motivationBox: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  motivationIcon: {
    marginRight: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.lightGray,
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    marginLeft: 12,
    fontWeight: '500',
  },
});
