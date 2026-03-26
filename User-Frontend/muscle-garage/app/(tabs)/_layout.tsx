import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, loading, isAuthenticating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticating && !user) {
      router.replace('/auth-choice');
    }
  }, [user, loading, isAuthenticating]);

  if (loading || isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(38, 38, 38, 0.8)',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
          borderRadius: 20,
          marginHorizontal: 12,
          marginBottom: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderCurve: 'continuous',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 0,
          zIndex: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
