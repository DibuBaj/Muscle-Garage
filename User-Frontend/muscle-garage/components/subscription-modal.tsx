import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { GlassModal } from '@/components/ios/GlassModal';

interface SubscriptionPlan {
  _id?: string;
  id?: string;
  name: string;
  label?: string;
  price: number;
  days: number;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
  onSubscriptionSuccess: () => void;
}

export default function SubscriptionModal({
  visible,
  onClose,
  token,
  onSubscriptionSuccess,
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (visible) {
      fetchPlans();
    }
  }, [visible]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/plans/active`);
      if (response.data.success && response.data.plans) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setPlans([]);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setErrorMessage('Please select a plan');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
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
        setLoading(false);
        setSelectedPlan(null);
        
        // Show success message
        setSuccessMessage('Subscription successful!');
        
        // Immediately update parent state
        await onSubscriptionSuccess();
        
        // Close modal after showing success message
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Subscription error:', error);
      const errorMsg =
        error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const modalBody = (
    <>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

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
                onPress={() => !loading && setSelectedPlan(planId!)}
                disabled={loading}
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

        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const iosModal = (
    <>
      {successMessage ? (
        <View style={styles.successNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{successMessage}</Text>
          </View>
        </View>
      ) : null}
      
      {errorMessage ? (
        <View style={styles.errorNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}
      <GlassModal visible={visible} onClose={onClose} style={styles.iosSheet}>
        {modalBody}
      </GlassModal>
    </>
  );

  const androidModal = (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {successMessage ? (
        <View style={styles.successNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{successMessage}</Text>
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.overlay}>{modalBody}</View>
    </Modal>
  );

  return Platform.OS === 'ios' ? iosModal : androidModal;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  plansContainer: {
    marginBottom: 24,
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
    paddingVertical: 14,
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
  successNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  errorNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(196, 23, 23, 0.95)',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  iosSheet: {
    paddingTop: 0,
  },
});
