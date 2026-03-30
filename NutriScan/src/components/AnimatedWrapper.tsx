import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp, Easing } from 'react-native';

interface AnimatedWrapperProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  style?: StyleProp<ViewStyle>;
}

export function AnimatedWrapper({
  children,
  delay = 0,
  duration = 400,
  animationType = 'fadeIn',
  style,
}: AnimatedWrapperProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay, duration]);

  const getAnimatedStyle = () => {
    switch (animationType) {
      case 'fadeIn':
        return {
          opacity: animatedValue,
        };
      case 'slideUp':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        };
      case 'slideLeft':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        };
      case 'slideRight':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        };
      case 'slideDown':
        return {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              }),
            },
          ],
        };
      case 'scale':
        return {
          opacity: animatedValue,
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        };
      default:
        return { opacity: animatedValue };
    }
  };

  return (
    <Animated.View style={[getAnimatedStyle(), style]}>
      {children}
    </Animated.View>
  );
}
