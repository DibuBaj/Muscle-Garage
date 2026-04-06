import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import SubscriptionProgressBar from '@/components/subscription-progress-bar';
import PauseSubscriptionModal from '@/components/pause-subscription-modal';
import ToastNotification from '@/components/toast-notification';
import Animated from 'react-native-reanimated';
import { useLiquidTabBarScrollHandler } from '@/components/shared/tabBarVisibility';

interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  label?: string;
  price: number;
  days: number;
}

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

export default function MembershipScreen() {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const scrollHandler = useLiquidTabBarScrollHandler();

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/plans/active`);
      if (response.data.success && response.data.plans) {
        const orderedPlans = [...response.data.plans].sort((a, b) => {
          const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
          const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
        setPlans(orderedPlans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans([]);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchPlans();
      await fetchSubscription();
    };
    initializeData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Membership page focused - refreshing subscription');
      fetchSubscription();
    }, [])
  );

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/me`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.success) {
        console.log('Subscription received:', response.data.subscription);
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlans(), fetchSubscription()]);
    setRefreshing(false);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setErrorMessage('Please select a plan');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSubscribing(true);
    try {
      const appRedirectUrl = ExpoLinking.createURL('/payment-callback');
      const authHeader = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await axios.post(
        `${API_URL}/subscription/khalti/initiate`,
        {
          plan: selectedPlan,
          returnUrl: `${API_URL}/payment/khalti/redirect?deeplink=${encodeURIComponent(appRedirectUrl)}`,
        },
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (response.data.success && response.data.paymentUrl) {
        const result = await WebBrowser.openAuthSessionAsync(
          response.data.paymentUrl,
          appRedirectUrl
        );

        if (result.type === 'success' && result.url) {
          await ExpoLinking.openURL(result.url);
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          setErrorMessage('Payment was cancelled.');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSubscribing(false);
    }
  };

  const handleResume = async () => {
    setSubscribing(true);
    try {
      const response = await axios.post(
        `${API_URL}/subscription/resume`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Subscription resumed!');
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchSubscription();
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Resume error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to resume subscription. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSubscribing(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isSubscriptionActive = subscription && subscription.daysLeft > 0;
  const needsRenewal = subscription && subscription.daysLeft === 0 && subscription.hasSubscribedBefore;

  return (
    <SafeAreaView style={styles.container}>
      <ToastNotification
        visible={!!successMessage}
        message={successMessage}
        type="success"
      />
      <ToastNotification
        visible={!!errorMessage}
        message={errorMessage}
        type="error"
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Membership</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Current Subscription Info */}
            {isSubscriptionActive && subscription && (
              <View style={[styles.currentSubscriptionCard, subscription?.status === 'pause' && styles.currentSubscriptionCardPaused]}>
                <View style={styles.cardHeader}>
                  <Ionicons 
                    name={subscription?.status === 'pause' ? "pause-circle" : "checkmark-circle"} 
                    size={24} 
                    color={subscription?.status === 'pause' ? '#FFA500' : Colors.success} 
                  />
                  <View style={styles.cardTitleContainer}>
                    <Text style={[styles.cardTitle, subscription?.status === 'pause' && styles.cardTitlePaused]}>
                      {subscription?.status === 'pause' ? 'Paused Subscription' : 'Current Subscription'}
                    </Text>
                    <Text style={styles.statusBadge}>
                      Status: {subscription?.status === 'pause' ? 'Pause' : 'Active'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.subscriptionInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Plan Duration</Text>
                    <Text style={styles.infoValue}>{subscription.totalDays} days</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Start Date</Text>
                    <Text style={styles.infoValue}>{formatDate(subscription.startDate)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>End Date</Text>
                    <Text style={styles.infoValue}>{formatDate(subscription.endDate)}</Text>
                  </View>
                  {subscription?.status === 'pause' && subscription?.pauseInfo?.pauseEndDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Pause Until</Text>
                      <Text style={styles.infoValue}>{formatDate(subscription.pauseInfo.pauseEndDate)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.circularProgressContainer}>
                  <SubscriptionProgressBar
                    daysLeft={subscription.daysLeft || 0}
                    totalDays={subscription.totalDays || 0}
                  />
                </View>
              </View>
            )}

            {/* Renewal Alert */}
            {needsRenewal && (
              <View style={styles.renewalAlertCard}>
                <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
                <Text style={styles.renewalTitle}>Membership Expired</Text>
                <Text style={styles.renewalSubtitle}>Your subscription has expired. Renew now to continue your fitness journey</Text>
              </View>
            )}

            {/* Plans Section - Only show when no active subscription */}
            {!isSubscriptionActive && (
              <>
                <View style={styles.plansSection}>
                  <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                  <View style={styles.plansContainer}>
                    {plans.map((plan) => {
                      const planId = plan._id || plan.id;
                      const planName = plan.name || plan.label;
                      return (
                        <TouchableOpacity
                          key={planId}
                          style={[
                            styles.planBox,
                            selectedPlan === planId && styles.planBoxSelected,
                          ]}
                          onPress={() => !subscribing && setSelectedPlan(planId!)}
                          disabled={subscribing}
                        >
                          <Text style={styles.planLabel}>{planName}</Text>
                          <Text style={styles.planPrice}>Rs. {plan.price}</Text>
                          <Text style={styles.planDays}>({plan.days} days)</Text>
                          {selectedPlan === planId && (
                            <View style={styles.checkmark}>
                              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Subscribe Button */}
                <TouchableOpacity
                  style={[styles.subscribeButton, subscribing && styles.subscribeButtonDisabled]}
                  onPress={handleSubscribe}
                  disabled={subscribing || !selectedPlan}
                >
                  {subscribing ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Pause Subscription Section - Only show if subscription is active and not paused */}
            {isSubscriptionActive && (!subscription?.status || subscription?.status === 'active') && (
              <View style={styles.pauseSection}>
                <View style={styles.pauseInfoBox}>
                  <Ionicons name="pause-circle-outline" size={24} color={Colors.primary} style={styles.pauseIcon} />
                  <View style={styles.pauseInfoContent}>
                    <Text style={styles.pauseTitle}>Pause Your Subscription</Text>
                    <Text style={styles.pauseDescription}>Pause for 1-7 days, once per month</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={() => setPauseModalVisible(true)}
                  disabled={subscribing}
                >
                  <Text style={styles.pauseButtonText}>Pause Subscription</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Resume Button - Show if subscription is paused */}
            {subscription?.status === 'pause' && (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={handleResume}
                disabled={subscribing}
              >
                {subscribing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.resumeButtonText}>Resume Subscription</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.ScrollView>

      <PauseSubscriptionModal
        visible={pauseModalVisible}
        onClose={() => setPauseModalVisible(false)}
        token={token}
        onPauseSuccess={fetchSubscription}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  successBanner: {
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Poppins',
  },
  errorBanner: {
    backgroundColor: 'rgba(196, 23, 23, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentSubscriptionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
    fontFamily: 'Poppins',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardTitlePaused: {
    color: '#FFA500',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#666666',
    borderRadius: 4,
    fontFamily: 'Poppins',
  },
  currentSubscriptionCardPaused: {
    borderColor: '#FFA500',
  },
  subscriptionInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  renewalAlertCard: {
    backgroundColor: 'rgba(196, 23, 23, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  renewalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  renewalSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  plansSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  plansContainer: {
    gap: 12,
  },
  planBox: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    position: 'relative',
  },
  planBoxSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  planDays: {
    fontSize: 14,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  pauseSection: {
    marginTop: 24,
    marginBottom: 12,
  },
  pauseInfoBox: {
    backgroundColor: 'rgba(229, 122, 37, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pauseIcon: {
    marginRight: 4,
  },
  pauseInfoContent: {
    flex: 1,
  },
  pauseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  pauseDescription: {
    fontSize: 12,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  pauseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pauseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  resumeButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'Poppins',
  },
  pausedStatusCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFA500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pausedContent: {
    flex: 1,
  },
  pausedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  pausedDate: {
    fontSize: 13,
    color: Colors.lightGray,
  },
  circularProgressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
});
