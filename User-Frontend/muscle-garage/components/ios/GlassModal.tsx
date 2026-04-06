import React, { useEffect } from 'react';
import { Modal, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useIOSDesign } from '@/hooks/useIOSDesign';

type GlassModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlassModal({ visible, onClose, children, style }: GlassModalProps) {
  const iosDesign = useIOSDesign();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(640);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 640, { damping: 18, stiffness: 200 });
  }, [translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (Platform.OS === 'android') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.androidOverlay}>
          <View style={[styles.androidContent, style]}>{children}</View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={StyleSheet.absoluteFillObject} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            borderColor: iosDesign.materials.card.border,
            shadowColor: iosDesign.materials.card.shadowColor,
            shadowOpacity: iosDesign.materials.card.shadowOpacity,
            shadowRadius: iosDesign.materials.card.shadowRadius,
            shadowOffset: iosDesign.materials.card.shadowOffset,
            paddingBottom: insets.bottom + 20,
          },
          sheetStyle,
          style,
        ]}
      >
        <BlurView tint={iosDesign.materials.card.tint as any} intensity={iosDesign.materials.card.intensity} style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: iosDesign.materials.card.overlay }]} />
        <View style={[styles.dragHandle, { backgroundColor: iosDesign.dragHandleColor }]} />
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  androidOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  androidContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
});
