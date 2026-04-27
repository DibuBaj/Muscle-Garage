import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors } from '@/constants/colors';

type WorkoutInputProps = TextInputProps & {
  label: string;
};

export function WorkoutInput({ label, style, ...props }: WorkoutInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.darkGray}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 14,
    color: Colors.white,
    fontSize: 15,
  },
});
