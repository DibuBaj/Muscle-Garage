import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function AuthEmailScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/auth-choice')}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sign In or Create Account</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to continue with your email
        </Text>
      </View>

      {/* Options Container */}
      <View style={styles.optionsContainer}>
        {/* Sign In Button */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push('/login')}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIcon}>
              <Ionicons name="log-in-outline" size={28} color={Colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Sign In</Text>
              <Text style={styles.optionDescription}>
                Access your existing account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.darkGray} />
          </View>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => router.push('/signup')}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIcon}>
              <Ionicons name="person-add-outline" size={28} color={Colors.success} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Create Account</Text>
              <Text style={styles.optionDescription}>
                Start your fitness journey
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.darkGray} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account? Create one to get started with your fitness transformation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
