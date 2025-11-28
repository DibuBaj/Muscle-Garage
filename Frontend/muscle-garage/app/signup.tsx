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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isAuthenticating } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullname: '',
    password: '',
    confirmPassword: '',
    age: '',
    weight: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validateForm = () => {
    let valid = true;
    const newErrors: any = {};

    if (!formData.username) {
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

    if (!formData.fullname) {
      newErrors.fullname = 'Full name is required';
      valid = false;
    }

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

    if (!formData.age) {
      newErrors.age = 'Age is required';
      valid = false;
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 1) {
      newErrors.age = 'Age must be a valid number';
      valid = false;
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) < 1)) {
      newErrors.weight = 'Weight must be a valid number';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await signup(
        formData.username,
        formData.email,
        formData.fullname,
        formData.password,
        Number(formData.age),
        formData.weight ? Number(formData.weight) : undefined
      );
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your fitness transformation today</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.darkGray}
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              autoCapitalize="none"
            />
          </View>
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.darkGray}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.darkGray}
              value={formData.fullname}
              onChangeText={(text) => updateField('fullname', text)}
              autoCapitalize="words"
            />
          </View>
          {errors.fullname ? <Text style={styles.errorText}>{errors.fullname}</Text> : null}

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="calendar-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Age"
                placeholderTextColor={Colors.darkGray}
                value={formData.age}
                onChangeText={(text) => updateField('age', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Ionicons name="fitness-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Weight (kg)"
                placeholderTextColor={Colors.darkGray}
                value={formData.weight}
                onChangeText={(text) => updateField('weight', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
            </View>
            <View style={styles.halfWidth}>
              {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.darkGray}
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.darkGray}
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
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

          <TouchableOpacity
            style={[styles.signupButton, isAuthenticating && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login' as any)}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    marginBottom: 8,
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
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
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
});
