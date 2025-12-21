import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import axios from 'axios';
import SubscriptionModal from '@/components/subscription-modal';
import SubscriptionProgressBar from '@/components/subscription-progress-bar';

interface Subscription {
  _id: string;
  membershipId: string | null;
  totalDays: number;
  daysLeft: number;
  startDate: string | null;
  endDate: string | null;
  hasSubscribedBefore: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      console.log('Fetching subscription with token:', token?.substring(0, 20) + '...');
      const response = await axios.get(`${API_URL}/subscription/me`, {
        headers: {
          Authorization: token,
        },
      });

      console.log('Subscription response:', response.data);
      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err.response?.data || err.message);
      // Still set loading to false even on error
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = async () => {
    console.log('Subscription success callback triggered');
    // Small delay to ensure backend has processed the subscription
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Fetching updated subscription data');
    await fetchSubscription();
    console.log('Subscription data refetched');
  };

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

  const isSubscriptionActive = subscription && subscription.daysLeft > 0;
  const needsSubscription = subscription && subscription.daysLeft === 0 && !subscription.hasSubscribedBefore;
  const needsRenewal = subscription && subscription.daysLeft === 0 && subscription.hasSubscribedBefore;

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
            {isSubscriptionActive && (
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

            {needsSubscription && (
              <View style={styles.subscriptionPromptCard}>
                {/* <Ionicons name="notifications-outline" size={32} color={Colors.primary} style={styles.promptIcon} /> */}
                <Text style={styles.promptTitle}>Subscribe your gym membership now</Text>
                <Text style={styles.promptSubtitle}>Choose a plan and get started with your fitness journey</Text>
                <TouchableOpacity 
                  style={styles.promptButton}
                  onPress={() => setModalVisible(true)}
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
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.promptButtonText}>Renew Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isSubscriptionActive && !needsSubscription && !needsRenewal && subscription && (
              <View style={styles.subscriptionPromptCard}>
                {/* <Ionicons name="notifications-outline" size={32} color={Colors.primary} style={styles.promptIcon} /> */}
                <Text style={styles.promptTitle}>Subscribe your gym membership now</Text>
                <Text style={styles.promptSubtitle}>Choose a plan and get started with your fitness journey</Text>
                <TouchableOpacity 
                  style={styles.promptButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.promptButtonText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        token={token}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
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
  // loadingContainer: {
  //   height: 100,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
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
  // promptTitle: {
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   color: Colors.white,
  //   textAlign: 'center',
  //   marginBottom: 8,
  // },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  // promptSubtitle: {
  //   fontSize: 14,
  //   color: Colors.lightGray,
  //   textAlign: 'center',
  //   marginBottom: 16,
  // },
  promptSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  // promptButton: {
  //   backgroundColor: Colors.primary,
  //   paddingHorizontal: 32,
  //   paddingVertical: 12,
  //   borderRadius: 12,
  // },
  promptButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  // promptButtonText: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   color: Colors.white,
  // },
  promptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
