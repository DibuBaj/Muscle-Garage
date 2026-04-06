import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useIOSDesign } from '@/hooks/useIOSDesign';

type GlassButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'success' | 'none';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({
  label,
  onPress,
  style,
  textStyle,
  disabled,
  haptic = 'light',
}: GlassButtonProps) {
  const iosDesign = useIOSDesign();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, { damping: 18, stiffness: 200 }) }],
    opacity: withSpring(pressed.value ? 0.85 : 1, { damping: 18, stiffness: 200 }),
  }));

  const triggerHaptic = async () => {
    if (Platform.OS !== 'ios' || haptic === 'none') {
      return;
    }
    if (haptic === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (haptic === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (Platform.OS === 'android') {
    return (
      <Pressable
        android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
        style={[styles.androidButton, style]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </Pressable>
    );
  }

  const token = iosDesign.materials.button;

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={async () => {
        await triggerHaptic();
        onPress();
      }}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      style={[
        styles.iosButton,
        {
          borderColor: token.border,
          shadowColor: token.shadowColor,
          shadowOpacity: token.shadowOpacity,
          shadowRadius: token.shadowRadius,
          shadowOffset: token.shadowOffset,
        },
        animatedStyle,
        style,
      ]}
    >
      <BlurView tint={token.tint as any} intensity={token.intensity} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: token.overlay }]} />
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  iosButton: {
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
