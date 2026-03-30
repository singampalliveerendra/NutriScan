import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = BORDER_RADIUS.md,
  style,
  children,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
            borderRadius,
          },
        ]}
      />
      {children}
    </View>
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonLoader width={72} height={72} borderRadius={BORDER_RADIUS.lg} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: SPACING.sm }} />
        <SkeletonLoader width="50%" height={12} style={{ marginTop: SPACING.xs }} />
      </View>
    </View>
  );
}

export function SkeletonProductCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.productCard, style]}>
      <SkeletonLoader width={180} height={180} borderRadius={BORDER_RADIUS.xl} />
      <View style={styles.productContent}>
        <SkeletonLoader width="80%" height={24} />
        <SkeletonLoader width="40%" height={16} style={{ marginTop: SPACING.sm }} />
        <SkeletonLoader width="60%" height={40} style={{ marginTop: SPACING.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  productContent: {
    width: '100%',
    marginTop: SPACING.md,
  },
});
