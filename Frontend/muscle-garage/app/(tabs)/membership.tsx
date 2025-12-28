import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import SubscriptionProgressBar from '@/components/subscription-progress-bar';
import PauseSubscriptionModal from '@/components/pause-subscription-modal';

interface SubscriptionPlan {
  id: string;
  label: string;
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

const PLANS: SubscriptionPlan[] = [
  {
    id: '1_month',
    label: '1 Month',
    price: 1500,
    days: 30,
  },
  {
    id: '3_months',
    label: '3 Months',
    price: 4000,
    days: 90,
  },
  {
    id: '12_months',
    label: '12 Months',
    price: 17000,
    days: 365,
  },
];

export default function MembershipScreen() {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pauseModalVisible, setPauseModalVisible] = useState(false);

  useEffect(() => {
    fetchSubscription();
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

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setErrorMessage('Please select a plan');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSubscribing(true);
    try {
      const response = await axios.post(
        `${API_URL}/subscription/subscribe`,
        { plan: selectedPlan },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Subscription successful!');
        setSelectedPlan(null);
        
        // Refresh subscription data
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchSubscription();
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Membership</Text>
        </View>

        {/* Success Message */}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={24} color={Colors.white} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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
                    color={subscription?.status === 'pause' ? '#FFC107' : Colors.success} 
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

                <SubscriptionProgressBar
                  daysLeft={subscription.daysLeft || 0}
                  totalDays={subscription.totalDays || 0}
                />
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
                    {PLANS.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planBox,
                          selectedPlan === plan.id && styles.planBoxSelected,
                        ]}
                        onPress={() => !subscribing && setSelectedPlan(plan.id)}
                        disabled={subscribing}
                      >
                        <Text style={styles.planLabel}>{plan.label}</Text>
                        <Text style={styles.planPrice}>Rs. {plan.price}</Text>
                        <Text style={styles.planDays}>({plan.days} days)</Text>
                        {selectedPlan === plan.id && (
                          <View style={styles.checkmark}>
                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
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
      </ScrollView>

      <PauseSubscriptionModal
        visible={pauseModalVisible}
        onClose={() => setPauseModalVisible(false)}
        token={token}
        onPauseSuccess={fetchSubscription}
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
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
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
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  cardTitlePaused: {
    color: '#FFC107',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#666666',
    borderRadius: 4,
  },
  currentSubscriptionCardPaused: {
    borderColor: '#FFC107',
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
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
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
  },
  renewalSubtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  plansSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
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
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  planDays: {
    fontSize: 14,
    color: Colors.lightGray,
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
  },
  pauseDescription: {
    fontSize: 12,
    color: Colors.lightGray,
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
  },
  resumeButton: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  pausedStatusCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FFC107',
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
});
