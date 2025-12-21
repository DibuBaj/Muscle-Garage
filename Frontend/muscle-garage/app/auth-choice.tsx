import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Use appropriate Client ID based on platform
const GOOGLE_CLIENT_ID = Platform.select({
  web: '532915510052-grjqv3364ei2bga6uk64g6u367oi5fji.apps.googleusercontent.com', // Web
  ios: '532915510052-f3084aca7ilq1jbdlk1keas8bdd3chub.apps.googleusercontent.com', // iOS
  android: '532915510052-bph260218qunsqu4o35v6mijf9at3nfh.apps.googleusercontent.com', // Android
}) as string;

export default function AuthChoiceScreen() {
  const router = useRouter();
  const { googleAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setErrorMessage('Google authentication failed');
      return;
    }

    setLoading(true);
    try {
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!userInfoResponse.ok) throw new Error('Failed to fetch user info');

      const userInfo = await userInfoResponse.json();

      // AuthContext to handle login/signup
      const isNewUser = await googleAuth(
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.picture
      );

      if (isNewUser) {
        router.push({
          pathname: '/google-onboarding',
          params: {
            googleId: userInfo.id,
            email: userInfo.email,
            fullname: userInfo.name,
            profilePicture: userInfo.picture,
          },
        });
      } else {
        setErrorMessage('');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setErrorMessage(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo & Title */}
          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.mainTitle}>Muscle Garage</Text>
            <Text style={styles.subtitle}>Your Ultimate Fitness Companion</Text>
          </View>

          {/* Error */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => promptAsync()}
              disabled={loading || !request}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require('@/assets/images/google_logo.webp')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
                {loading ? (
                  <ActivityIndicator color="#1F2937" />
                ) : (
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => router.push('/login')}
              disabled={loading}
            >
              <Ionicons name="mail-outline" size={22} color={Colors.primary} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Signup */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 24, paddingVertical: 40 },
  content: { flex: 1, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 60, marginTop: 20 },
  logo: { width: 140, height: 140, marginBottom: 24 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.lightGray, textAlign: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,23,23,0.1)', borderRadius: 12, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: Colors.error, gap: 12 },
  errorText: { color: Colors.error, fontSize: 14, flex: 1 },
  buttonContainer: { gap: 16 },
  googleButton: { backgroundColor: Colors.white, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  googleLogo: { width: 28, height: 28 },
  googleButtonText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#333333' },
  dividerText: { color: Colors.darkGray, fontSize: 14, fontWeight: '500' },
  emailButton: { flexDirection: 'row', backgroundColor: Colors.inputBackground, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: Colors.primary },
  emailButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { color: Colors.lightGray, fontSize: 14 },
  signupLink: { color: Colors.primary, fontSize: 14, fontWeight: 'bold' },
});
