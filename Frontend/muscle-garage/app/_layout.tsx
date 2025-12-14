import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Keyboard } from 'react-native';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  useEffect(() => {
    // Ensure proper keyboard handling
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      // Handle any cleanup if needed
    });
    
    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#1C1C1C' }
      }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
