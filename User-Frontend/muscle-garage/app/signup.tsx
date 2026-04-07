import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import PasswordStrengthIndicator from '@/components/password-strength-indicator';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { API_URL } from '@/constants/api';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { sendOTP, isAuthenticating, error: authError } = useAuth();
  const [step, setStep] = useState(1);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [signupError, setSignupError] = useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRefs = React.useRef<Record<string, View>>({});
  
  React.useEffect(() => {
    if (authError) {
      setSignupError(authError);
    }
  }, [authError]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullname: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    weight: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [iosDobDraft, setIosDobDraft] = useState<Date | null>(null);
  const [errors, setErrors] = useState<any>({});

  const today = new Date();

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toDateOnlyString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateForPicker = (value: string) => {
    if (!value) return null;
    const [yearStr, monthStr, dayStr] = value.split('T')[0].split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const openDobPicker = () => {
    if (Platform.OS === 'ios') {
      setIosDobDraft(parseDateForPicker(formData.dateOfBirth) || today);
    }
    setShowDobPicker(true);
  };

  const cancelDobSelection = () => {
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  const confirmDobSelection = () => {
    if (iosDobDraft) {
      updateField('dateOfBirth', toDateOnlyString(iosDobDraft));
    }
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  // Keyboard handling is managed by KeyboardAvoidingView

  const handleInputFocus = (fieldName: string) => {
    setTimeout(() => {
      inputRefs.current[fieldName]?.measureInWindow((x, y, width, height) => {
        // Scroll so the field is visible with some padding from top
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 150), animated: true });
      });
    }, 100);
  };

  const handleInputBlur = () => {
    // Reset scroll to top when keyboard closes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const validateStep1 = () => {
    let valid = true;
    const newErrors: any = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required';
      valid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const validateStep2 = () => {
    let valid = true;
    const newErrors: any = {};

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        newErrors.dateOfBirth = 'Please select a valid date of birth';
        valid = false;
      } else if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        valid = false;
      }
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 1)) {
      newErrors.weight = 'Weight must be a valid number';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const validateStep3 = () => {
    let valid = true;
    const newErrors: any = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setErrors({});
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      setErrors({});
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const appRedirectUrl = ExpoLinking.createURL('/google-auth-callback');
      const authUrl = `${API_URL}/auth/google/mobile/initiate?deeplink=${encodeURIComponent(
        appRedirectUrl
      )}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUrl);

      if (result.type === 'success' && result.url) {
        await ExpoLinking.openURL(result.url);
        return;
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setGoogleError('Google signup was cancelled.');
      } else {
        setGoogleError('Google signup failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google signup error:', error);
      setGoogleError(error.message || 'Google signup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateStep3()) return;
    
    console.log('Starting signup process...');
    setSignupError('');

    try {
      const otpData: any = {
        username: formData.username,
        email: formData.email,
        fullname: formData.fullname,
        phone: formData.phone,
        password: formData.password
      };

      if (formData.dateOfBirth) {
        otpData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.weight && !isNaN(Number(formData.weight))) {
        otpData.weight = Number(formData.weight);
      }

      console.log('Calling sendOTP with data:', otpData);
      const email = await sendOTP(otpData);
      console.log('OTP sent successfully, received email:', email);
      console.log('Navigating to verify-otp screen...');
      router.push({ pathname: '/verify-otp', params: { email } });
    } catch (error: any) {
      console.log('Signup error caught:', error.message);
      console.error('Signup error details:', error);
      setSignupError(error.message);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        bounces={false}
        keyboardDismissMode="interactive"
      >
        {/* Back Button */}
        {step === 1 && (
          <TouchableOpacity
            style={styles.backButtonTop}
            onPress={() => router.push('/auth-choice')}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your fitness transformation today</Text>
          <Text style={styles.stepIndicator}>Step {step} of 3</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, step >= 1 && styles.progressActive]} />
          <View style={[styles.progressSegment, step >= 2 && styles.progressActive]} />
          <View style={[styles.progressSegment, step >= 3 && styles.progressActive]} />
        </View>

        {/* Google Sign-Up Option - Always show */}
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={googleLoading}
          >
            <View style={styles.googleButtonContent}>
              <Image
                source={require('@/assets/images/google_logo.webp')}
                style={styles.googleLogo}
                resizeMode="contain"
              />
              {googleLoading ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              )}
            </View>
          </TouchableOpacity>

          {googleError ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={20} color={Colors.error} />
              <Text style={styles.errorAlertText}>{googleError}</Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        <View style={styles.formContainer}>
          {signupError ? (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={20} color={Colors.white} />
              <Text style={styles.errorAlertText}>{signupError}</Text>
            </View>
          ) : null}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>User Information</Text>
              
              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['username'] = ref; }}
              >
                <Ionicons name="person-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.username}
                  onChangeText={(text) => updateField('username', text)}
                  onFocus={() => handleInputFocus('username')}
                  onBlur={handleInputBlur}
                  autoCapitalize="none"
                />
              </View>
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['email'] = ref; }}
              >
                <Ionicons name="mail-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={handleInputBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['fullname'] = ref; }}
              >
                <Ionicons name="person-circle-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.fullname}
                  onChangeText={(text) => updateField('fullname', text)}
                  onFocus={() => handleInputFocus('fullname')}
                  onBlur={handleInputBlur}
                  autoCapitalize="words"
                />
              </View>
              {errors.fullname ? <Text style={styles.errorText}>{errors.fullname}</Text> : null}

              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['phone'] = ref; }}
              >
                <Ionicons name="call-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (10 digits)"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.phone}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '').slice(0, 10);
                    updateField('phone', cleaned);
                  }}
                  onFocus={() => handleInputFocus('phone')}
                  onBlur={handleInputBlur}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

              <TouchableOpacity
                style={[styles.button, styles.nextButton, styles.fullWidthButton]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Optional Info */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Additional Information (Optional)</Text>
              
              <View style={styles.row}>
                <View style={[styles.pickerContainer, styles.halfInput]}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={openDobPicker}
                  >
                    <Text style={[styles.datePickerText, !formData.dateOfBirth && styles.datePickerPlaceholder]}>
                      {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Date of Birth'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View 
                  style={[styles.inputContainer, styles.halfInput]}
                  ref={(ref) => { if (ref) inputRefs.current['weight'] = ref; }}
                >
                  <Ionicons name="fitness-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Weight (kg)"
                    placeholderTextColor={Colors.darkGray}
                    value={formData.weight}
                    onChangeText={(text) => updateField('weight', text)}
                    onFocus={() => handleInputFocus('weight')}
                    onBlur={handleInputBlur}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
                </View>
                <View style={styles.halfWidth}>
                  {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}
                </View>
              </View>

              {showDobPicker && (
                <>
                  <DateTimePicker
                    value={Platform.OS === 'ios' ? (iosDobDraft || parseDateForPicker(formData.dateOfBirth) || today) : (parseDateForPicker(formData.dateOfBirth) || today)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={today}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'ios') {
                        if (selectedDate) {
                          setIosDobDraft(selectedDate);
                        }
                        return;
                      }

                      setShowDobPicker(false);
                      if (event.type === 'dismissed' || !selectedDate) {
                        return;
                      }
                      updateField('dateOfBirth', toDateOnlyString(selectedDate));
                    }}
                  />

                  {Platform.OS === 'ios' && (
                    <View style={styles.iosPickerActions}>
                      <TouchableOpacity style={styles.iosPickerActionButton} onPress={cancelDobSelection}>
                        <Text style={styles.iosPickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iosPickerActionButton} onPress={confirmDobSelection}>
                        <Text style={styles.iosPickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.backButton, styles.flexButton]}
                  onPress={handleBack}
                >
                  <Ionicons name="arrow-back" size={20} color={Colors.white} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.nextButton, styles.flexButton]}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Set Your Password</Text>
              
              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['password'] = ref; }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.password}
                  onChangeText={(text) => updateField('password', text)}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={handleInputBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.darkGray}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

              <PasswordStrengthIndicator password={formData.password} />

              <View 
                style={styles.inputContainer}
                ref={(ref) => { if (ref) inputRefs.current['confirmPassword'] = ref; }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.darkGray}
                  value={formData.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  onFocus={() => handleInputFocus('confirmPassword')}
                  onBlur={handleInputBlur}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.darkGray}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.backButton, styles.flexButton]}
                  onPress={handleBack}
                >
                  <Ionicons name="arrow-back" size={20} color={Colors.white} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.nextButton, styles.flexButton, isAuthenticating && styles.signupButtonDisabled]}
                  onPress={handleSignup}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Sign Up</Text>
                      <Ionicons name="arrow-forward" size={20} color={Colors.white} style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 1 && (
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth-choice' as any)}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
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
    paddingHorizontal: 20,
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
  formContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 20,
    fontFamily: 'Poppins',
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
    fontSize: 16,
    height: 56,
    paddingHorizontal: 0,
    color: Colors.white,
  },
  datePickerButton: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  datePickerText: {
    color: Colors.white,
    fontSize: 16,
  },
  datePickerPlaceholder: {
    color: Colors.darkGray,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  iosPickerActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  iosPickerCancelText: {
    color: Colors.lightGray,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  iosPickerDoneText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },

  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    width: '100%'
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  halfWidth: {
    width: '48%',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 12,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: Colors.darkGray,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthButton: {
    width: '100%',
    marginTop: 16,
  },
  flexButton: {
    flex: 1,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
    minHeight: 56,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleLogo: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.darkGray,
  },
  dividerText: {
    color: Colors.darkGray,
    fontSize: 14,
    paddingHorizontal: 12,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 12,
  },
  errorAlertText: {
    color: Colors.white,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  backButtonTop: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
  },
});
