import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants';
import { HealthRating } from '../types';
import { getRatingColor, getRatingLabel } from '../utils';

interface RatingBadgeProps {
  rating: HealthRating;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function RatingBadge({ rating, size = 'medium', style }: RatingBadgeProps) {
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
      fontSize: FONT_SIZE.md,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getRatingColor(rating) },
        {
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Health rating: ${getRatingLabel(rating)}`}
    >
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {getRatingLabel(rating)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.white,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});