import React, { useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useIOSDesign } from '@/hooks/useIOSDesign';
import { Colors } from '@/constants/colors';

type GlassInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  showClearButton?: boolean;
};

export function GlassInput({
  containerStyle,
  style,
  value,
  onChangeText,
  showClearButton = true,
  ...rest
}: GlassInputProps) {
  const iosDesign = useIOSDesign();
  const [focused, setFocused] = useState(false);

  const hasValue = useMemo(() => Boolean(value && `${value}`.length > 0), [value]);

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidContainer, containerStyle]}>
        <TextInput value={value} onChangeText={onChangeText} style={[styles.input, style]} {...rest} />
      </View>
    );
  }

  const token = iosDesign.materials.card;

  return (
    <View
      style={[
        styles.iosContainer,
        {
          borderColor: focused ? iosDesign.accentGlow : token.border,
          shadowColor: focused ? Colors.primary : token.shadowColor,
          shadowOpacity: focused ? 0.24 : token.shadowOpacity,
          shadowRadius: focused ? 22 : token.shadowRadius,
          shadowOffset: token.shadowOffset,
        },
        containerStyle,
      ]}
    >
      <BlurView tint={token.tint as any} intensity={token.intensity} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: token.overlay }]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        style={[styles.input, style]}
        onFocus={(event) => {
          setFocused(true);
          rest.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          rest.onBlur?.(event);
        }}
        {...rest}
      />
      {showClearButton && hasValue ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onChangeText?.('')}
          accessibilityRole="button"
          accessibilityLabel="Clear text"
        >
          <Ionicons name="close-circle" size={18} color={Colors.lightGray} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  iosContainer: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  androidContainer: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
  },
  clearButton: {
    marginLeft: 8,
  },
});
