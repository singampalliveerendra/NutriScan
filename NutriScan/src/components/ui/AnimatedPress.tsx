import React, { ReactNode } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressProps {
  children: ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scale?: number;
}

export function AnimatedPress({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  disabled = false,
  scale = 0.96,
}: AnimatedPressProps) {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressed.value }],
  }));

  const handlePressIn = (e: any) => {
    pressed.value = withSpring(scale, { damping: 15, stiffness: 300 });
    onPressIn?.();
  };

  const handlePressOut = (e: any) => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
