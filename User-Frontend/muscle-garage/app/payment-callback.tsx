import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

type FlowType = 'membership' | 'booking' | 'store' | '';

const normalizeFlow = (value: unknown): FlowType => {
  const parsed = String(value || '').toLowerCase();
  if (parsed === 'membership' || parsed === 'booking' || parsed === 'store') {
    return parsed;
  }
  return '';
};

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token, loading } = useAuth();
  const [message, setMessage] = useState('Verifying payment...');

  const flow = useMemo(() => normalizeFlow(params.flow), [params.flow]);
  const intentId = useMemo(() => String(params.intentId || ''), [params.intentId]);
  const pidx = useMemo(() => String(params.pidx || ''), [params.pidx]);
  const status = useMemo(() => String(params.status || '').toLowerCase(), [params.status]);

  useEffect(() => {
    let isMounted = true;

    const completePayment = async () => {
      if (loading) {
        return;
      }

      if (!flow || !intentId || !pidx) {
        if (isMounted) {
          setMessage('Invalid payment callback data. Redirecting...');
        }
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1200);
        return;
      }

      if (status && status !== 'completed') {
        if (isMounted) {
          setMessage('Payment was not completed. Redirecting...');
        }
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1200);
        return;
      }

      try {
        if (flow === 'membership') {
          if (!token) {
            throw new Error('Please login and try again.');
          }
          const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          await axios.post(
            `${API_URL}/subscription/khalti/complete`,
            { intentId, pidx },
            { headers: { Authorization: authHeader } }
          );
          if (isMounted) {
            setMessage('Membership activated successfully!');
          }
          setTimeout(() => {
            router.replace('/(tabs)/membership');
          }, 900);
          return;
        }

        if (flow === 'booking') {
          if (!token) {
            throw new Error('Please login and try again.');
          }
          const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          await axios.post(
            `${API_URL}/booking/khalti/complete`,
            { intentId, pidx },
            { headers: { Authorization: authHeader } }
          );
          if (isMounted) {
            setMessage('Booking confirmed successfully!');
          }
          setTimeout(() => {
            router.replace('/(tabs)/booking');
          }, 900);
          return;
        }

        await axios.post(`${API_URL}/orders/khalti/complete`, { intentId, pidx });
        if (isMounted) {
          setMessage('Order placed successfully!');
        }
        setTimeout(() => {
          router.replace(`/(tabs)/store?paymentSuccess=1&paymentTs=${Date.now()}`);
        }, 900);
      } catch (error: any) {
        const backendMessage = error?.response?.data?.message;
        if (backendMessage === 'Payment intent already consumed') {
          if (isMounted) {
            setMessage('Payment already confirmed. Redirecting...');
          }
          setTimeout(() => {
            if (flow === 'membership') {
              router.replace('/(tabs)/membership');
            } else if (flow === 'booking') {
              router.replace('/(tabs)/booking');
            } else {
              router.replace('/(tabs)/store');
            }
          }, 900);
          return;
        }

        if (isMounted) {
          setMessage(backendMessage || 'Payment verification failed. Redirecting...');
        }
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1300);
      }
    };

    completePayment();

    return () => {
      isMounted = false;
    };
  }, [flow, intentId, pidx, status, token, loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    gap: 16,
  },
  text: {
    color: Colors.white,
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
});
