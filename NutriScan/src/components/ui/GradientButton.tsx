import React, { ReactNode } from 'react';
import { Text, StyleSheet, ViewStyle, Pressable, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING, FONT_SIZE, SHADOWS, GRADIENTS } from '../../constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function GradientButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  fullWidth = false,
}: GradientButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return GRADIENTS.secondary;
      case 'danger':
        return GRADIENTS.danger;
      case 'success':
        return GRADIENTS.success;
      default:
        return GRADIENTS.primary;
    }
  };

  const gradientColors = getGradientColors();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const sizeStyles = {
    small: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    medium: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
    large: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  };

  const textSizes = {
    small: FONT_SIZE.sm,
    medium: FONT_SIZE.md,
    large: FONT_SIZE.lg,
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles[size],
        { backgroundColor: gradientColors[0] },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={[styles.icon, { marginRight: SPACING.sm }]}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              { fontSize: textSizes[size], color: colors.white },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={[styles.icon, { marginLeft: SPACING.sm }]}>{icon}</View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
