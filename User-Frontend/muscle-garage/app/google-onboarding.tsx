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
  ActivityIndicator,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NEPAL_MOBILE_REGEX = /^9[678]\d{8}$/;

export default function GoogleOnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeGoogleOnboarding } = useAuth();
  const params = useLocalSearchParams();
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [iosDobDraft, setIosDobDraft] = useState<Date | null>(null);

  const today = new Date();

  const formatDate = (value: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', {
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
      setIosDobDraft(parseDateForPicker(dateOfBirth) || today);
    }
    setShowDobPicker(true);
  };

  const cancelDobSelection = () => {
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  const confirmDobSelection = () => {
    if (iosDobDraft) {
      setDateOfBirth(toDateOnlyString(iosDobDraft));
    }
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  const fullname = params.fullname as string;
  const email = params.email as string;
  const googleId = params.googleId as string;
  const profilePicture = params.profilePicture as string;

  const validateStep1 = () => {
    let valid = true;
    const newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      valid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else {
      const sanitizedPhone = phone.replace(/\D/g, '');
      if (!NEPAL_MOBILE_REGEX.test(sanitizedPhone)) {
        newErrors.phone = 'Enter a valid Nepal mobile number (98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX)';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await completeGoogleOnboarding(
        googleId,
        email,
        fullname,
        username,
        phone,
        dateOfBirth || undefined,
        weight ? Number(weight) : undefined,
        profilePicture
      );

      setLoading(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error?.message || 'Onboarding failed';

      if (/username already exists/i.test(errorMsg)) {
        setStep(1);
        setErrors((prev: any) => ({
          ...prev,
          username: 'Username already exists. Please choose another username.',
        }));
        setErrorMessage('Please pick a different username to continue.');
        return;
      }

      if (/date of birth/i.test(errorMsg)) {
        setStep(2);
      }

      if (/phone/i.test(errorMsg)) {
        setStep(1);
        setErrors((prev: any) => ({
          ...prev,
          phone: 'Enter a valid Nepal mobile number (98XXXXXXXX, 97XXXXXXXX, or 96XXXXXXXX)',
        }));
      }

      setErrorMessage(errorMsg);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          {profilePicture && (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profilePicture}
            />
          )}
          <Text style={styles.welcomeText}>Welcome, {fullname.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Tell us a bit about yourself'
              : 'Almost there! Add optional details'}
          </Text>
          <Text style={styles.stepIndicator}>
            Step {step} of 2
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, step >= 1 && styles.progressActive]} />
          <View style={[styles.progressSegment, step >= 2 && styles.progressActive]} />
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorAlertText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Step 1 - Required Fields */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.darkGray}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (10 digits)"
                placeholderTextColor={Colors.darkGray}
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').slice(0, 10);
                  setPhone(cleaned);
                }}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleNextStep}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2 - Optional Fields */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.row}>
              <View style={[styles.pickerContainer, styles.halfInput]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={openDobPicker}
                >
                  <Text style={[styles.datePickerText, !dateOfBirth && styles.datePickerPlaceholder]}>
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Date of Birth'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="fitness-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Weight (kg)"
                  placeholderTextColor={Colors.darkGray}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.optionalText}>Optional - You can update these later</Text>

            {showDobPicker && (
              <>
                <DateTimePicker
                  value={Platform.OS === 'ios' ? (iosDobDraft || parseDateForPicker(dateOfBirth) || today) : (parseDateForPicker(dateOfBirth) || today)}
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
                    setDateOfBirth(toDateOnlyString(selectedDate));
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
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.completeButton, loading && styles.buttonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Complete</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    padding: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  stepIndicator: {
    fontSize: 12,
    color: Colors.darkGray,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  optionalText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    marginTop: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButton: {
    backgroundColor: Colors.primary,
    flex: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButtonText: {
    color: Colors.lightGray,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C41717',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  errorAlertText: {
    color: Colors.white,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});
