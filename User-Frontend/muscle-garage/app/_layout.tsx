import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';
import { useFonts } from '@/hooks/useFonts';
import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const fontsLoaded = useFonts();

  useEffect(() => {
    // Ensure proper keyboard handling
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      // Handle any cleanup if needed
    });
    
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#1C1C1C' },
        gestureEnabled: Platform.OS === 'ios',
        fullScreenGestureEnabled: Platform.OS === 'ios',
        animation: Platform.OS === 'ios' ? 'ios_from_right' : 'default',
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth-choice" options={{ headerShown: false }} />
        <Stack.Screen name="auth-email" options={{ headerShown: false }} />
        <Stack.Screen name="google-onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="google-auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="payment-callback" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            // Prevent iOS swipe-back to previous auth routes once user is in the main app tabs.
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal',
            gestureEnabled: Platform.OS === 'ios',
            title: 'Modal',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
