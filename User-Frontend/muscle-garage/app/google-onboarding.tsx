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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function GoogleOnboardingScreen() {
  const router = useRouter();
  const { completeGoogleOnboarding } = useAuth();
  const params = useLocalSearchParams();
  const [step, setStep] = useState(1);

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
      valid = false;
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
        age ? Number(age) : undefined,
        weight ? Number(weight) : undefined,
        profilePicture
      );

      setLoading(false);
      router.replace('/(tabs)');
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.message || 'Onboarding failed';
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
        contentContainerStyle={styles.scrollContent}
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
                <Picker
                  selectedValue={age}
                  onValueChange={(itemValue) => setAge(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={Colors.white}
                  mode="dropdown"
                >
                  <Picker.Item label="Age" value="" />
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((ageNum) => (
                    <Picker.Item key={ageNum} label={ageNum.toString()} value={ageNum.toString()} />
                  ))}
                </Picker>
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
    padding: 24,
    paddingTop: 16,
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
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 12,
    color: Colors.darkGray,
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
  picker: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    height: 56,
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
