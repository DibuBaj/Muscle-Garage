import React, { useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function ToastNotification({
  visible,
  message,
  type,
}: ToastNotificationProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  if (!visible && !message) {
    return null;
  }

  const backgroundColor =
    type === 'success'
      ? 'rgba(40, 167, 69, 0.95)'
      : 'rgba(196, 23, 23, 0.95)';

  const iconName = type === 'success' ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY }],
          top: insets.top + 10,
        },
      ]}
    >
      <Ionicons name={iconName} size={24} color={Colors.white} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
