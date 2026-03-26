import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  children?: React.ReactNode;
  style?: any;
}

export const Text: React.FC<CustomTextProps> = ({ style, ...props }) => {
  const mergedStyle = [styles.defaultText, style];
  return <RNText {...props} style={mergedStyle} />;
};

const styles = StyleSheet.create({
  defaultText: {
    fontFamily: 'Poppins',
  },
});
