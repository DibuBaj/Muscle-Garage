import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyOTP, resendOTP, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email;

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [user, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // Support pasting multiple digits into any box by spreading from current index.
    let cursor = index;
    for (const digit of digits) {
      if (cursor >= OTP_LENGTH) break;
      newOtp[cursor] = digit;
      cursor += 1;
    }

    setOtp(newOtp);

    if (cursor < OTP_LENGTH) {
      inputRefs.current[cursor]?.focus();
    } else {
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const setInputRef = (ref: TextInput | null, index: number) => {
    inputRefs.current[index] = ref;
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOTP(email, otpString);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError('');

    try {
      await resendOTP(email);
      setSuccess('OTP resent successfully!');
      setCountdown(60);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a 6-digit code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => setInputRef(ref, index)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                error ? styles.otpInputError : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              selectionColor={Colors.primary}
              placeholderTextColor={Colors.darkGray}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendLink}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdownText}>Resend in {countdown}s</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back to Signup</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'Poppins',
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.darkGray,
    backgroundColor: '#2A2A2A',
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  resendLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    color: Colors.darkGray,
    fontSize: 14,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
});
