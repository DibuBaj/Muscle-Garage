import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIOSDesign } from '@/hooks/useIOSDesign';
import { Colors } from '@/constants/colors';

type GlassHeaderProps = {
  title: string;
  scrollY?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
};

export function GlassHeader({ title, scrollY, style }: GlassHeaderProps) {
  const iosDesign = useIOSDesign();
  const insets = useSafeAreaInsets();

  const blurStyle = useAnimatedStyle(() => {
    const y = scrollY?.value ?? 0;
    return {
      opacity: interpolate(y, [0, 18, 72], [0, 0.55, 1], Extrapolation.CLAMP),
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const y = scrollY?.value ?? 0;
    return {
      transform: [{ scale: interpolate(y, [0, 60], [1, 0.86], Extrapolation.CLAMP) }],
      opacity: interpolate(y, [0, 80], [1, 0.92], Extrapolation.CLAMP),
    };
  });

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidHeader, { paddingTop: insets.top + 12 }, style]}>
        <Text style={styles.androidTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 6 }, style]}>
      <Animated.View style={[styles.blurLayer, blurStyle]}>
        <BlurView tint={iosDesign.materials.screen.tint as any} intensity={iosDesign.materials.screen.intensity} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: iosDesign.materials.screen.overlay }]} />
      </Animated.View>
      <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    paddingBottom: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.white,
  },
  androidHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  androidTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
});
