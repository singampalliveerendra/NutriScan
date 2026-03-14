import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants';
import { NutritionFacts } from '../types';

interface NutritionFactsTableProps {
  nutrition: NutritionFacts;
  servingSize?: string;
}

export function NutritionFactsTable({ nutrition, servingSize = '100g' }: NutritionFactsTableProps) {
  const nutrients = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal' },
    { label: 'Protein', value: nutrition.protein, unit: 'g' },
    { label: 'Carbohydrates', value: nutrition.carbohydrates, unit: 'g' },
    { label: 'Fat', value: nutrition.fat, unit: 'g' },
    { label: 'Sugar', value: nutrition.sugar, unit: 'g', highlight: nutrition.sugar > 15 },
    { label: 'Sodium', value: nutrition.sodium / 1000, unit: 'g', highlight: nutrition.sodium > 800 },
    { label: 'Saturated Fat', value: nutrition.saturatedFat, unit: 'g', highlight: nutrition.saturatedFat > 4 },
  ];

  if (nutrition.fiber !== undefined) {
    nutrients.push({ label: 'Fiber', value: nutrition.fiber, unit: 'g' });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Facts</Text>
      <Text style={styles.servingSize}>Per {servingSize}</Text>
      <View style={styles.divider} />
      {nutrients.map((nutrient, index) => (
        <View
          key={nutrient.label}
          style={[styles.row, index === nutrients.length - 1 && styles.lastRow]}
          accessibilityLabel={`${nutrient.label}: ${nutrient.value}${nutrient.unit}`}
        >
          <Text style={[styles.label, nutrient.highlight && styles.highlightText]}>
            {nutrient.label}
          </Text>
          <Text style={[styles.value, nutrient.highlight && styles.highlightText]}>
            {nutrient.value.toFixed(1)}{nutrient.unit}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  servingSize: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  value: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  highlightText: {
    color: COLORS.error,
  },
});
