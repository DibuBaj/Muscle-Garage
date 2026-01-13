import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength, getPasswordStrengthColor, getPasswordStrengthLabel } from '@/utils/passwordStrength';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, score, suggestions } = getPasswordStrength(password);
  const strengthColor = getPasswordStrengthColor(strength);

  // Only show indicator if password has content
  if (!password) {
    return null;
  }

  // Calculate progress in three steps: 0%, 33%, 66%, 100%
  let progressPercentage = 0;
  if (score >= 2) progressPercentage = 33;
  if (score >= 5) progressPercentage = 66;
  if (score >= 7) progressPercentage = 100;

  return (
    <View style={styles.container}>
      {/* Three-Step Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressPercentage}%`,
              backgroundColor: strengthColor,
            },
          ]}
        />
      </View>

      {/* Step Labels */}
      <View style={styles.labelsContainer}>
        <Text style={[styles.labelText, progressPercentage >= 33 && { color: strengthColor }]}>Weak</Text>
        <Text style={[styles.labelText, progressPercentage >= 66 && { color: strengthColor }]}>Strong</Text>
        <Text style={[styles.labelText, progressPercentage >= 100 && { color: strengthColor }]}>Very Strong</Text>
      </View>

      {/* Suggestions and Messages */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status Messages */}
      {strength === 'weak' && suggestions.length === 0 && (
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.messageText}>Password is weak</Text>
        </View>
      )}

      {strength === 'strong' && suggestions.length === 0 && (
        <View style={styles.messageContainer}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
          <Text style={styles.messageText}>Good password!</Text>
        </View>
      )}

      {strength === 'very-strong' && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.successText}>Very strong password!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.inputBackground,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  suggestionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.lightGray,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  successText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  messageText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
});
