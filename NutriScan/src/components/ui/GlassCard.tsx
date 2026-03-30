import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING, SHADOWS } from '../../constants';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
}

export function GlassCard({ children, style, onPress, elevated = false }: GlassCardProps) {
  const { colors, isDark } = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? 'rgba(30, 30, 45, 0.7)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
      ...(elevated ? SHADOWS.medium : {}),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
