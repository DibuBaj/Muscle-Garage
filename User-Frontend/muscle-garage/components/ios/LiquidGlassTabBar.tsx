import React from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

export function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const supportsNativeLiquidGlass = isLiquidGlassAvailable();

  const tabCount = state.routes.length;
  const layoutWidth = useSharedValue(0);
  const activeIndex = useSharedValue(state.index);
  const blobPressScale = useSharedValue(1);
  const hiddenProgress = useSharedValue(0);
  const isDark = true;

  React.useEffect(() => {
    activeIndex.value = withSpring(state.index, { mass: 0.6, damping: 15, stiffness: 180 });
  }, [activeIndex, state.index]);

  const onLayout = (event: LayoutChangeEvent) => {
    layoutWidth.value = event.nativeEvent.layout.width;
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(hiddenProgress.value, [0, 1], [0, 120], Extrapolation.CLAMP) }],
    opacity: interpolate(hiddenProgress.value, [0, 1], [1, 0.95], Extrapolation.CLAMP),
  }));

  const blobStyle = useAnimatedStyle(() => {
    const width = layoutWidth.value / Math.max(tabCount, 1);
    const left = activeIndex.value * width;

    return {
      width: width - 12,
      transform: [
        { translateX: left + 6 },
        { scaleX: withSpring(blobPressScale.value, { mass: 0.6, damping: 15, stiffness: 180 }) },
      ],
    };
  });

  if (Platform.OS === 'android') {
    return null;
  }

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.wrapper,
        {
          marginBottom: insets.bottom + 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 12 },
        },
        containerAnimatedStyle,
      ]}
    >
      {supportsNativeLiquidGlass ? (
        <GlassContainer style={StyleSheet.absoluteFillObject}>
          <GlassView
            style={StyleSheet.absoluteFillObject}
            glassEffectStyle={{ style: 'regular', animate: true, animationDuration: 0.24 }}
            tintColor="rgba(255,255,255,0.18)"
            colorScheme={isDark ? 'dark' : 'light'}
          />
        </GlassContainer>
      ) : (
        <>
          <BlurView tint="dark" intensity={40} style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
        </>
      )}
      <View style={[styles.border, { borderColor: 'rgba(255,255,255,0.5)' }]} />

      <Animated.View style={[styles.activeBlob, blobStyle]} />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const focused = state.index === index;

          const onPress = async () => {
            hiddenProgress.value = withSpring(0, { mass: 0.6, damping: 15, stiffness: 180 });
            blobPressScale.value = 0.88;
            blobPressScale.value = withSpring(1, { mass: 0.6, damping: 15, stiffness: 180 });
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

          const icon = options.tabBarIcon?.({
            focused,
            color: focused ? Colors.primary : 'rgba(255, 165, 0, 0.5)',
            size: 22,
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <AnimatedTabItem icon={icon} label={String(label)} focused={focused} />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

function AnimatedTabItem({
  icon,
  label,
  focused,
}: {
  icon: React.ReactNode;
  label: string;
  focused: boolean;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const opacity = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 18, stiffness: 200 });
    opacity.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 200 });
  }, [focused, opacity, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [-4, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={styles.tabInner}>
      <Animated.View style={iconStyle}>{icon}</Animated.View>
      <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
    height: 72,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 100,
  },
  activeBlob: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
});
