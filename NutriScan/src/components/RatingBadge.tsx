import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants';
import { HealthRating } from '../types';
import { getRatingColor, getRatingLabel } from '../utils';

interface RatingBadgeProps {
  rating: HealthRating;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showIcon?: boolean;
}

export function RatingBadge({ rating, size = 'medium', style, showIcon = true }: RatingBadgeProps) {
  const sizeStyles = {
    small: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      fontSize: FONT_SIZE.xs,
    },
    medium: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: FONT_SIZE.sm,
    },
    large: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      fontSize: FONT_SIZE.lg,
    },
    xlarge: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.lg,
      fontSize: FONT_SIZE.xxl,
    },
  };

  const icons = {
    healthy: '✓',
    moderate: '⚠',
    avoid: '✕',
  };

  const color = getRatingColor(rating);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color },
        {
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Health rating: ${getRatingLabel(rating)}`}
    >
      {showIcon && size !== 'small' && (
        <Text style={[styles.icon, { fontSize: sizeStyles[size].fontSize + 4 }]}>
          {icons[rating]}
        </Text>
      )}
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {getRatingLabel(rating)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  icon: {
    color: COLORS.white,
    fontWeight: '700',
  },
  text: {
    color: COLORS.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
