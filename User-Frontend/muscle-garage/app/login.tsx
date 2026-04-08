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
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticating, user, loading } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const inputRefs = React.useRef<Record<string, View>>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', auth: '' });

  React.useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Keyboard dismissal is handled by KeyboardAvoidingView
    });

    return () => keyboardDidHideListener.remove();
  }, []);

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [loading, user, router]);

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

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '', auth: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setErrors({ email: '', password: '', auth: '' });
      await login(email, password);
      console.log('Login completed, navigating to dashboard...');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error: any) {
      const errorMessage = error.message || 'Invalid email or password';
      setErrors(prev => ({ ...prev, auth: errorMessage }));
    }
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
        scrollEnabled={true}
        bounces={false}
        keyboardDismissMode="interactive"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/auth-choice')}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
        </View>

        <View style={styles.formContainer}>
          <View 
            style={styles.inputContainer}
            ref={(ref) => { if (ref) inputRefs.current['email'] = ref; }}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.darkGray}
              value={email}
              onChangeText={setEmail}
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
            ref={(ref) => { if (ref) inputRefs.current['password'] = ref; }}
          >
            <Ionicons name="lock-closed-outline" size={20} color={Colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.darkGray}
              value={password}
              onChangeText={setPassword}
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

          {errors.auth ? (
            <View style={styles.authErrorContainer}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} style={styles.errorIcon} />
              <Text style={styles.authErrorText}>{errors.auth}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginButton, isAuthenticating && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => router.replace('/forgot-password' as any)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/signup' as any)}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    borderRadius: 20,
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
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  formContainer: {
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
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: Colors.lightGray,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  authErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 23, 23, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorIcon: {
    marginRight: 8,
  },
  authErrorText: {
    color: Colors.error,
    fontSize: 14,
    flex: 1,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    paddingRight:5
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
  },
});
