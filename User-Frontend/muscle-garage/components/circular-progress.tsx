import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface CircularProgressProps {
  daysLeft: number;
  totalDays: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  daysLeft,
  totalDays,
  size = 200,
  strokeWidth = 12,
}: CircularProgressProps) {
  const percentage = totalDays > 0 ? (daysLeft / totalDays) * 100 : 0;
  const segments = 60; // Number of segments for smooth progress
  const filledSegments = Math.ceil((percentage / 100) * segments);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background gray circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#333333',
          },
        ]}
      />

      {/* Progress segments */}
      {Array.from({ length: segments }).map((_, index) => {
        const rotation = (360 / segments) * index;
        const isFilledSegment = index < filledSegments;

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                width: strokeWidth,
                height: size / 2,
                left: size / 2 - strokeWidth / 2,
                top: 0,
                backgroundColor: isFilledSegment ? Colors.primary : 'transparent',
                transform: [
                  { translateY: size / 2 },
                  { rotate: `${rotation}deg` },
                  { translateY: -size / 2 },
                ],
              },
            ]}
          />
        );
      })}

      {/* Inner circle - creates donut hole */}
      <View
        style={[
          styles.innerCircle,
          {
            width: size - strokeWidth * 4,
            height: size - strokeWidth * 4,
            borderRadius: (size - strokeWidth * 4) / 2,
            backgroundColor: Colors.background,
          },
        ]}
      />

      {/* Center text content */}
      <View style={[styles.textWrapper, { width: size, height: size }]}>
        <Text style={styles.daysText}>{Math.round(daysLeft)}</Text>
        <Text style={styles.labelText}>days left</Text>
        <Text style={styles.totalText}>of {totalDays}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  segment: {
    position: 'absolute',
    borderRadius: 4,
  },
  innerCircle: {
    position: 'absolute',
    zIndex: 5,
  },
  textWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  daysText: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    fontFamily: 'Poppins',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  totalText: {
    fontSize: 11,
    color: Colors.lightGray,
    marginTop: 3,
    fontFamily: 'Poppins',
  },
});
