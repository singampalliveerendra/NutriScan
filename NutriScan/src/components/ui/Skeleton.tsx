import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, DimensionValue } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../../constants';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.md,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.skeletonFill,
          { opacity },
        ]}
      />
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceAlt }, style]}>
      <Skeleton width="100%" height={120} borderRadius={BORDER_RADIUS.lg} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} style={{ marginTop: SPACING.md }} />
        <Skeleton width="50%" height={12} style={{ marginTop: SPACING.sm }} />
        <View style={styles.cardRow}>
          <Skeleton width={60} height={24} borderRadius={BORDER_RADIUS.sm} />
          <Skeleton width={60} height={24} borderRadius={BORDER_RADIUS.sm} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: SPACING.md }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  skeletonFill: {
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  cardContent: {
    padding: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  list: {
    flex: 1,
  },
});
