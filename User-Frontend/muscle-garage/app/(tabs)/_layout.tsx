import { Tabs, useRouter } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
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

  if (Platform.OS !== 'ios') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.lightGray,
          tabBarStyle: {
            backgroundColor: Colors.cardBackground,
            borderTopColor: 'rgba(255,255,255,0.08)',
            height: 66,
            paddingTop: 6,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="membership"
          options={{
            title: 'Plans',
            tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
            title: 'Store',
            tabBarIcon: ({ color, size }) => <Ionicons name="bag" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            title: 'Booking',
            tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      disableTransparentOnScrollEdge
      blurEffect="systemUltraThinMaterialDark"
      backgroundColor={null}
      labelStyle={{ fontSize: 12, fontWeight: '600' }}
      titlePositionAdjustment={{ vertical: -2 }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          selectedColor={Colors.primary}
          androidSrc={<VectorIcon family={Ionicons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="membership">
        <Label>Plans</Label>
        <Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          selectedColor={Colors.primary}
          androidSrc={<VectorIcon family={Ionicons} name="card" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="store">
        <Label>Store</Label>
        <Icon
          sf={{ default: 'bag', selected: 'bag.fill' }}
          selectedColor={Colors.primary}
          androidSrc={<VectorIcon family={Ionicons} name="bag" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="booking">
        <Label>Booking</Label>
        <Icon
          sf={{ default: 'book', selected: 'book.fill' }}
          selectedColor={Colors.primary}
          androidSrc={<VectorIcon family={Ionicons} name="book" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          selectedColor={Colors.primary}
          androidSrc={<VectorIcon family={Ionicons} name="settings" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
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
