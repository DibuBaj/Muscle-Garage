import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function GoogleAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { googleAuth } = useAuth();
  const [message, setMessage] = useState('Completing Google sign in...');

  const status = useMemo(() => String(params.status || '').toLowerCase(), [params.status]);
  const googleId = useMemo(() => String(params.googleId || ''), [params.googleId]);
  const email = useMemo(() => String(params.email || ''), [params.email]);
  const fullname = useMemo(() => String(params.fullname || ''), [params.fullname]);
  const profilePicture = useMemo(() => String(params.profilePicture || ''), [params.profilePicture]);
  const backendMessage = useMemo(() => String(params.message || ''), [params.message]);

  useEffect(() => {
    let isMounted = true;

    const completeGoogleAuth = async () => {
      if (status !== 'success') {
        if (isMounted) {
          setMessage(backendMessage || 'Google authentication failed. Redirecting...');
        }
        setTimeout(() => router.replace('/auth-choice'), 1300);
        return;
      }

      if (!googleId || !email || !fullname) {
        if (isMounted) {
          setMessage('Invalid Google callback data. Redirecting...');
        }
        setTimeout(() => router.replace('/auth-choice'), 1300);
        return;
      }

      try {
        const isNewUser = await googleAuth(googleId, email, fullname, profilePicture || undefined);

        if (isNewUser) {
          if (isMounted) {
            setMessage('Google account verified. Continue onboarding...');
          }
          setTimeout(() => {
            router.replace({
              pathname: '/google-onboarding',
              params: {
                googleId,
                email,
                fullname,
                profilePicture,
              },
            });
          }, 500);
          return;
        }

        if (isMounted) {
          setMessage('Login successful. Redirecting...');
        }
        setTimeout(() => router.replace('/(tabs)'), 500);
      } catch (error: any) {
        if (isMounted) {
          setMessage(error?.message || 'Google sign in failed. Redirecting...');
        }
        setTimeout(() => router.replace('/auth-choice'), 1300);
      }
    };

    completeGoogleAuth();

    return () => {
      isMounted = false;
    };
  }, [backendMessage, email, fullname, googleAuth, googleId, profilePicture, router, status]);

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
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  text: {
    color: Colors.white,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
});
