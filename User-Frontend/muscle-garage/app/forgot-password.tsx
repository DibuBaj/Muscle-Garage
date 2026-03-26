import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';
import { API_URL } from '@/constants/api';
import PasswordStrengthIndicator from '@/components/password-strength-indicator';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRefs = React.useRef<Record<string, View>>({});

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const handleInputFocus = (fieldName: string) => {
    setTimeout(() => {
      inputRefs.current[fieldName]?.measureInWindow((x, y, width, height) => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });
      });
    }, 100);
  };

  const handleInputBlur = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Step 1: Email validation and OTP request
  const handleEmailSubmit = async () => {
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });

      if (response.data.success) {
        setStep(2);
      } else {
        setErrors({ email: response.data.message || 'Email not found' });
      }
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err.response?.data as any)?.message || 'Failed to send OTP. Please try again.';
      setErrors({ email: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verification
  const handleOtpSubmit = async () => {
    setErrors({});

    const otpString = otp.join('');
    if (!otpString.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otpString.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-otp`, { email, otp: otpString });

      if (response.data.success) {
        setStep(3);
      } else {
        setErrors({ otp: response.data.message || 'Invalid OTP' });
      }
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err.response?.data as any)?.message || 'Invalid OTP. Please try again.';
      setErrors({ otp: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async () => {
    setErrors({});
    let valid = true;

    if (!newPassword.trim()) {
      setErrors(prev => ({ ...prev, newPassword: 'New password is required' }));
      valid = false;
    } else if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, newPassword: 'Password must be at least 6 characters' }));
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const otpString = otp.join('');
      console.log('Sending reset password with:', { email, otp: otpString, newPassword });
      
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp: otpString,
        newPassword,
      });

      if (response.data.success) {
        console.log('Password reset successful!');
        // Show success message
        setSuccessMessage('Password reset successfully!');
        
        // Navigate to login after showing the message
        setTimeout(() => {
          setStep(1);
          setEmail('');
          setOtp(['', '', '', '', '', '']);
          setNewPassword('');
          setConfirmPassword('');
          setErrors({});
          setSuccessMessage('');
          
          console.log('Navigating to login page');
          router.push('/login');
        }, 2000);
      } else {
        setErrors({ general: response.data.message || 'Failed to reset password' });
      }
    } catch (error) {
      const err = error as AxiosError;
      const errorMessage = (err.response?.data as any)?.message || 'Failed to reset password. Please try again.';
      console.error('Reset password error:', errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      {successMessage ? (
        <View style={styles.successNotification}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.successIcon} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </View>
      ) : null}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={false}
        keyboardDismissMode="interactive"
        ref={scrollViewRef}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Enter your email to receive an OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Create a new password'}
          </Text>
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, step >= 1 && styles.progressActive]} />
          <View style={[styles.progressSegment, step >= 2 && styles.progressActive]} />
          <View style={[styles.progressSegment, step >= 3 && styles.progressActive]} />
        </View>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View
              style={styles.inputContainer}
              ref={(ref) => {
                if (ref) inputRefs.current['email'] = ref;
              }}
            >
              <Ionicons name="mail-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.darkGray}
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleInputFocus('email')}
                onBlur={handleInputBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.infoText}>
              We've sent a 6-digit code to <Text style={styles.boldText}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    errors.otp ? styles.otpInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectionColor={Colors.primary}
                  placeholderTextColor={Colors.darkGray}
                  editable={!loading}
                />
              ))}
            </View>
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleOtpSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Verify OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => setStep(1)}
              disabled={loading}
            >
              <Text style={styles.resendText}>Didn't receive code? <Text style={styles.resendLink}>Try another email</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View
              style={styles.inputContainer}
              ref={(ref) => {
                if (ref) inputRefs.current['newPassword'] = ref;
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={Colors.darkGray}
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => handleInputFocus('newPassword')}
                onBlur={handleInputBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.darkGray}
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

            <PasswordStrengthIndicator password={newPassword} />

            <View
              style={styles.inputContainer}
              ref={(ref) => {
                if (ref) inputRefs.current['confirmPassword'] = ref;
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.darkGray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => handleInputFocus('confirmPassword')}
                onBlur={handleInputBlur}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.darkGray}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            {errors.general && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handlePasswordReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Reset Password</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  stepIndicator: {
    fontSize: 12,
    color: Colors.darkGray,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.darkGray,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 23, 23, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 8,
  },
  generalErrorText: {
    color: Colors.error,
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  boldText: {
    color: Colors.white,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: Colors.lightGray,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
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
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginRight: 12,
  },
  successText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
