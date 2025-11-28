import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Discover new ways to reach your fitness goals</Text>

      <View style={styles.card}>
        <Ionicons name="barbell" size={32} color={Colors.primary} />
        <Text style={styles.cardTitle}>Workout Programs</Text>
        <Text style={styles.cardText}>
          Browse through various workout programs tailored to your fitness level and goals.
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="nutrition" size={32} color={Colors.primary} />
        <Text style={styles.cardTitle}>Nutrition Plans</Text>
        <Text style={styles.cardText}>
          Get personalized meal plans and track your daily calorie intake.
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="people" size={32} color={Colors.primary} />
        <Text style={styles.cardTitle}>Community</Text>
        <Text style={styles.cardText}>
          Connect with like-minded individuals and share your fitness journey.
        </Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="analytics" size={32} color={Colors.primary} />
        <Text style={styles.cardTitle}>Analytics</Text>
        <Text style={styles.cardText}>
          Track your progress with detailed analytics and insights.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 32,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 20,
  },
});
