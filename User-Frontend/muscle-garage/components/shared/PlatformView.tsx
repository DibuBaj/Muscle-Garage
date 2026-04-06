import React from 'react';
import { Platform } from 'react-native';

type PlatformViewProps = {
  ios: React.ReactNode;
  android: React.ReactNode;
};

export function PlatformView({ ios, android }: PlatformViewProps) {
  return <>{Platform.OS === 'ios' ? ios : android}</>;
}
