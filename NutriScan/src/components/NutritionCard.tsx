import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants';

interface NutritionCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function NutritionCard({ 
  title, 
  value, 
  unit = 'g', 
  icon, 
  color = COLORS.primary,
  size = 'medium',
  style 
}: NutritionCardProps) {
  const sizeStyles = {
    small: {
      padding: SPACING.sm,
      iconSize: 20,
      valueSize: FONT_SIZE.md,
      titleSize: FONT_SIZE.xs,
    },
    medium: {
      padding: SPACING.md,
      iconSize: 24,
      valueSize: FONT_SIZE.xl,
      titleSize: FONT_SIZE.sm,
    },
    large: {
      padding: SPACING.lg,
      iconSize: 28,
      valueSize: FONT_SIZE.xxl,
      titleSize: FONT_SIZE.md,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View 
      style={[
        styles.card, 
        { padding: currentSize.padding },
        style
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: currentSize.iconSize }}>{icon}</Text>
      </View>
      <Text style={[styles.title, { fontSize: currentSize.titleSize }]}>{title}</Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { fontSize: currentSize.valueSize, color }]}>
          {value}
        </Text>
        <Text style={[styles.unit, { fontSize: currentSize.titleSize }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    minWidth: 100,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    fontWeight: '800',
  },
  unit: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
