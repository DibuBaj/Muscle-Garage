import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

        <View style={styles.memberCard}>
          <View style={styles.memberIdContainer}>
            <Ionicons name="card-outline" size={28} color={Colors.primary} />
            <View style={styles.memberIdTextContainer}>
              <Text style={styles.memberIdLabel}>Member ID</Text>
              <Text style={styles.memberIdValue}>{user?.memberId || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>{user?.username}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user?.fullname}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{user?.age || 'N/A'} years</Text>
            </View>
          </View>

          {user?.weight && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="fitness-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{user.weight} kg</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>{formatDate(user?.createdAt)}</Text>
            </View>
          </View>
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
    marginBottom: 24,
    marginTop: 50,
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
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  memberCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  memberIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberIdTextContainer: {
    marginLeft: 16,
  },
  memberIdLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  memberIdValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 2,
  },
  detailsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 122, 37, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.darkGray,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
  },
});
