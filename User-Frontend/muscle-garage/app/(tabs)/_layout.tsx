import { useRouter } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
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
