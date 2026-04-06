import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useIOSDesign } from '@/hooks/useIOSDesign';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  depth?: 'screen' | 'card' | 'button';
  androidStyle?: StyleProp<ViewStyle>;
};

export function GlassCard({ children, style, depth = 'card', androidStyle }: GlassCardProps) {
  const iosDesign = useIOSDesign();

  if (Platform.OS === 'android') {
    return <View style={[styles.androidCard, androidStyle, style]}>{children}</View>;
  }

  const token = iosDesign.materials[depth];

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: token.border,
          shadowColor: token.shadowColor,
          shadowOpacity: token.shadowOpacity,
          shadowRadius: token.shadowRadius,
          shadowOffset: token.shadowOffset,
        },
        style,
      ]}
    >
      <BlurView tint={token.tint as any} intensity={token.intensity} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: token.overlay }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  androidCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
