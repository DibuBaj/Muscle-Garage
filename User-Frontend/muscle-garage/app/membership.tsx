import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import SubscriptionProgressBar from '@/components/subscription-progress-bar';

interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  label?: string;
  price: number;
  days: number;
  order?: number;
}

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

export default function MembershipScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/me`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchPlans();
      await fetchSubscription();
    };
    initializeData();
  }, [fetchSubscription]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setErrorMessage('Please select a plan');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSubscribing(true);
    try {
      const planId = selectedPlan;
      const response = await axios.post(
        `${API_URL}/subscription/subscribe`,
        { plan: planId },
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
          router.back();
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Membership</Text>
          <View style={{ width: 28 }} />
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
              <View style={styles.currentSubscriptionCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <Text style={styles.cardTitle}>Current Subscription</Text>
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

            {/* Plans Section */}
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
              disabled={subscribing}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {isSubscriptionActive ? 'Upgrade Plan' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={subscribing}
            >
              <Text style={styles.cancelButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
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
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.lightGray,
  },
});
