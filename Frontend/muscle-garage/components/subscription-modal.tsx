import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionPlan {
  id: string;
  label: string;
  price: number;
  days: number;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
  onSubscriptionSuccess: () => void;
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

export default function SubscriptionModal({
  visible,
  onClose,
  token,
  onSubscriptionSuccess,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Please select a plan', 'Choose a subscription plan to continue');
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
        
        // Immediately update parent state and close modal
        await onSubscriptionSuccess();
        
        // Show success message
        Alert.alert('Success', 'Subscription successful!');
        
        // Close modal after a brief delay to allow alert to be read
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Subscription error:', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to subscribe. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Plan</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.plansContainer}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planBox,
                  selectedPlan === plan.id && styles.planBoxSelected,
                ]}
                onPress={() => !loading && setSelectedPlan(plan.id)}
                disabled={loading}
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
      </View>
    </Modal>
  );
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
});
