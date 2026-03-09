import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import axios, { AxiosError } from 'axios';
import SubscriptionProgressBar from '@/components/subscription-progress-bar';

interface Subscription {
  _id: string;
  membershipId: string | null;
  totalDays: number;
  daysLeft: number;
  startDate: string | null;
  endDate: string | null;
  hasSubscribedBefore: boolean;
  status: 'active' | 'pause';
  pauseInfo?: {
    pauseStartDate: string | null;
    pauseEndDate: string | null;
    lastPauseDate: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  _id: string;
  userId: string;
  itemId: string;
  kind: 'session' | 'trainer';
  title: string;
  subtitle?: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  totalDays: number;
  status: 'active' | 'completed' | 'cancelled';
  price?: number;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // const [sessionBookings, setSessionBookings] = useState<Booking[]>([]);
  // const [trainerBookings, setTrainerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Dashboard focused - refreshing data');
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data with token:', token?.substring(0, 20) + '...');
      
      // Fetch subscription
      const subscriptionResponse = await axios.get(`${API_URL}/subscription/me`, {
        headers: {
          Authorization: token,
        },
      });

      if (subscriptionResponse.data.success) {
        setSubscription(subscriptionResponse.data.subscription);
      }

      // Fetch bookings
      /* try {
        const bookingsResponse = await axios.get(`${API_URL}/bookings/me`, {
          headers: {
            Authorization: token,
          },
        });

        if (bookingsResponse.data.success) {
          const bookings = bookingsResponse.data.bookings || [];
          const sessions = bookings.filter((b: Booking) => b.kind === 'session' && b.status === 'active');
          const trainers = bookings.filter((b: Booking) => b.kind === 'trainer' && b.status === 'active');
          
          setSessionBookings(sessions);
          setTrainerBookings(trainers);
        }
      } catch (bookingErr) {
        console.log('Bookings endpoint not yet available, skipping...');
        // Bookings endpoint may not be available yet, so we'll show empty state
      } */
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching subscription:', error.response?.data || error.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipPress = () => {
    router.push('/(tabs)/membership');
  };

  /* const handleBookingPress = () => {
    router.push('/(tabs)/booking');
  }; */

  const handleLogout = async () => {
    await logout();
    router.replace('/auth-choice');
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

  const isSubscriptionActive = subscription && subscription.daysLeft > 0;
  const needsSubscription = subscription && subscription.daysLeft === 0 && !subscription.hasSubscribedBefore;
  const needsRenewal = subscription && subscription.daysLeft === 0 && subscription.hasSubscribedBefore;
  const noSubscription = !subscription;
  const showSubscribePrompt = !isSubscriptionActive && !needsRenewal && (noSubscription || !!needsSubscription);

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

        {/* Subscription Status Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {isSubscriptionActive && (!subscription?.status || subscription?.status === 'active') && (
              <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                  <View style={styles.subscriptionHeaderContent}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    <Text style={styles.subscriptionStatus}>Active Subscription</Text>
                  </View>
                </View>
                
                <SubscriptionProgressBar
                  daysLeft={subscription?.daysLeft || 0}
                  totalDays={subscription?.totalDays || 0}
                />
              </View>
            )}

            {isSubscriptionActive && subscription?.status === 'pause' && (
              <View style={styles.pausedSubscriptionCard}>
                <View style={styles.pausedHeader}>
                  <View style={styles.pausedHeaderContent}>
                    <Ionicons name="pause-circle" size={24} color="#FFA500" />
                    <Text style={styles.pausedStatus}>Subscription Paused</Text>
                  </View>
                </View>
                <View style={styles.pausedInfo}>
                  <Text style={styles.pausedInfoText}>
                    Your subscription is paused until {subscription.pauseInfo?.pauseEndDate ? new Date(subscription.pauseInfo.pauseEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </Text>
                </View>
                <SubscriptionProgressBar
                  daysLeft={subscription?.daysLeft || 0}
                  totalDays={subscription?.totalDays || 0}
                />
              </View>
            )}

            {showSubscribePrompt && (
              <View style={styles.subscriptionPromptCard}>
                <Ionicons name="notifications-outline" size={32} color={Colors.primary} style={styles.promptIcon} />
                <Text style={styles.promptTitle}>Subscribe your gym membership now</Text>
                <Text style={styles.promptSubtitle}>Choose a plan and get started with your fitness journey</Text>
                <TouchableOpacity 
                  style={styles.promptButton}
                  onPress={handleMembershipPress}
                >
                  <Text style={styles.promptButtonText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {needsRenewal && (
              <View style={styles.subscriptionPromptCard}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.error} style={styles.promptIcon} />
                <Text style={styles.promptTitle}>Renew your membership</Text>
                <Text style={styles.promptSubtitle}>Your subscription has expired. Renew now to continue</Text>
                <TouchableOpacity 
                  style={styles.promptButton}
                  onPress={handleMembershipPress}
                >
                  <Text style={styles.promptButtonText}>Renew Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bookings Section */}
            {/* <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bookmark-outline" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>My Bookings</Text>
              </View>

              {sessionBookings.length > 0 || trainerBookings.length > 0 ? (
                <View style={styles.bookingsList}>
                  {sessionBookings.slice(0, 3).map((booking) => (
                    <View key={booking._id} style={styles.bookingCard}>
                      <View style={styles.bookingTypeContainer}>
                        <View style={styles.bookingTypeIcon}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.bookingCardContent}>
                          <Text style={styles.bookingTitle}>{booking.title}</Text>
                          {booking.subtitle && <Text style={styles.bookingSubtitle}>{booking.subtitle}</Text>}
                        </View>
                        <View style={styles.daysLeftBadge}>
                          <Text style={styles.daysLeftText}>{booking.daysLeft}d</Text>
                        </View>
                      </View>
                      <View style={styles.bookingMeta}>
                        <Text style={styles.bookingMetaText}>
                          {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {trainerBookings.slice(0, 3).map((booking) => (
                    <View key={booking._id} style={styles.bookingCard}>
                      <View style={styles.bookingTypeContainer}>
                        <View style={styles.bookingTypeIcon}>
                          <Ionicons name="person-outline" size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.bookingCardContent}>
                          <Text style={styles.bookingTitle}>{booking.title}</Text>
                          {booking.subtitle && <Text style={styles.bookingSubtitle}>{booking.subtitle}</Text>}
                        </View>
                        <View style={styles.daysLeftBadge}>
                          <Text style={styles.daysLeftText}>{booking.daysLeft}d</Text>
                        </View>
                      </View>
                      <View style={styles.bookingMeta}>
                        <Text style={styles.bookingMetaText}>
                          {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {(sessionBookings.length + trainerBookings.length) > 3 && (
                    <TouchableOpacity 
                      style={styles.viewAllButton}
                      onPress={handleBookingPress}
                    >
                      <Text style={styles.viewAllButtonText}>View All Bookings</Text>
                      <Ionicons name="arrow-forward-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.emptyStateCard}>
                  <Ionicons name="bookmark-outline" size={40} color={Colors.primary} />
                  <Text style={styles.emptyStateTitle}>No Active Bookings</Text>
                  <Text style={styles.emptyStateSubtitle}>Book a session or trainer to get started</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={handleBookingPress}
                  >
                    <Text style={styles.emptyStateButtonText}>Explore Bookings</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View> */}

            {/* Quick Stats Section */}
            {/* <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart-outline" size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Your Activity</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-done-outline" size={28} color={Colors.success} />
                  <Text style={styles.statValue}>8</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flame-outline" size={28} color={Colors.error} />
                  <Text style={styles.statValue}>420</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
              </View>
            </View> */}
          </>
        )}
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
    fontSize: 20,
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
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  pausedSubscriptionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  pausedHeader: {
    marginBottom: 16,
  },
  pausedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pausedStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
  },
  pausedInfo: {
    marginBottom: 16,
  },
  pausedInfoText: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  subscriptionPromptCard: {
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  promptIcon: {
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  promptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  promptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  // New styles for sections
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bookingTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  daysLeftBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  bookingMetaText: {
    fontSize: 11,
    color: Colors.lightGray,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  viewAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyStateCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightGray,
  },
});
