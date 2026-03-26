import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface ActiveSession {
  _id: string;
  itemId: string;
  kind: 'session' | 'trainer';
  title: string;
  subtitle?: string;
  dayOfWeek?: string;
  startDate?: string;
  endDate?: string;
  daysLeft?: number;
  rate?: number;
  phone?: string;
  type?: string;
}

interface ActiveTrainerSessionProps {
  compact?: boolean;
}

export default function ActiveTrainerSession({
  compact = false,
}: ActiveTrainerSessionProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveSessions();
  }, [token]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${API_URL}/booking/my-bookings`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.success) {
        // Filter only active bookings
        const activeBookings = (response.data.bookings || []).filter(
          (booking: any) => booking.status === 'active'
        );
        setActiveSessions(activeBookings);
      } else {
        setError(response.data.message || 'Failed to load active sessions');
      }
    } catch (err: any) {
      console.error('Error fetching active sessions:', err);
      setError('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    router.push('/(tabs)/booking');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <View style={styles.emptyContent}>
          <Ionicons
            name="fitness-outline"
            size={48}
            color={Colors.primary}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>No Active Sessions</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any active trainer or session bookings yet.
          </Text>
          <Text style={styles.emptyHint}>
            Book a trainer or session to get started with your fitness journey!
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookNow}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={Colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name="fitness" size={24} color={Colors.primary} />
          <Text style={styles.title}>Active Sessions</Text>
        </View>
        <TouchableOpacity onPress={fetchActiveSessions}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {!compact && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sessionsList}
        >
          {activeSessions.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View
                  style={[
                    styles.sessionBadge,
                    session.kind === 'trainer'
                      ? styles.trainerBadge
                      : styles.sessionBadge,
                  ]}
                >
                  <Ionicons
                    name={
                      session.kind === 'trainer'
                        ? 'person-circle'
                        : 'calendar'
                    }
                    size={16}
                    color={Colors.white}
                  />
                  <Text style={styles.badgeText}>
                    {session.kind === 'trainer' ? 'Trainer' : 'Session'}
                  </Text>
                </View>
              </View>

              <Text style={styles.sessionTitle} numberOfLines={2}>
                {session.title}
              </Text>
              {session.subtitle && (
                <Text style={styles.sessionSubtitle} numberOfLines={1}>
                  {session.subtitle}
                </Text>
              )}

              <View style={styles.sessionInfo}>
                {session.daysLeft !== undefined && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={Colors.lightGray}
                    />
                    <Text style={styles.infoText}>
                      {session.daysLeft} day{session.daysLeft !== 1 ? 's' : ''}{' '}
                      left
                    </Text>
                  </View>
                )}
                {session.rate !== undefined && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash" size={14} color={Colors.lightGray} />
                    <Text style={styles.infoText}>Rs {session.rate}</Text>
                  </View>
                )}
              </View>

              {session.phone && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => {
                    // Handle contact
                  }}
                >
                  <Ionicons name="call" size={16} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {compact && activeSessions.length > 0 && (
        <View style={styles.compactSession}>
          <View style={styles.compactHeader}>
            <View style={styles.compactBadge}>
              <Ionicons
                name={
                  activeSessions[0].kind === 'trainer'
                    ? 'person-circle'
                    : 'calendar'
                }
                size={14}
                color={Colors.white}
              />
              <Text style={styles.compactBadgeText}>
                {activeSessions[0].kind === 'trainer'
                  ? 'Trainer Booked'
                  : 'Session Booked'}
              </Text>
            </View>
          </View>
          <Text style={styles.compactTitle}>{activeSessions[0].title}</Text>
          {activeSessions[0].daysLeft !== undefined && (
            <Text style={styles.compactDays}>
              {activeSessions[0].daysLeft} day
              {activeSessions[0].daysLeft !== 1 ? 's' : ''} remaining
            </Text>
          )}
        </View>
      )}

      {!compact && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleBookNow}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllButtonText}>Book More</Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={Colors.primary}
            style={styles.buttonArrow}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  emptyHint: {
    fontSize: 12,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  sessionsList: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionBadge: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    alignItems: 'center',
  },
  trainerBadge: {
    backgroundColor: Colors.success,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  sessionSubtitle: {
    fontSize: 12,
    color: Colors.lightGray,
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  sessionInfo: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  contactButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  compactSession: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  compactHeader: {
    marginBottom: 8,
  },
  compactBadge: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    alignItems: 'center',
  },
  compactBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  compactDays: {
    fontSize: 12,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewAllButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  buttonArrow: {
    marginLeft: 4,
  },
});
