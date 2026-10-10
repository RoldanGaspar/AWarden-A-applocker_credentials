import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { motion } from '../../theme/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  disabled = false,
  onPressIn,
  onPressOut,
  ...restProps
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const useNativeDriver = Platform.OS !== 'web';

  const animatePressIn = () => {
    if (disabled) return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: motion.pressScale,
        useNativeDriver,
        ...motion.spring,
      }),
      Animated.timing(opacity, {
        toValue: motion.pressOpacity,
        duration: motion.duration.press,
        useNativeDriver,
      }),
    ]).start();
  };

  const animatePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver,
        ...motion.spring,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.press,
        useNativeDriver,
      }),
    ]).start();
  };

  return (
    <AnimatedPressableBase
      {...restProps}
      disabled={disabled}
      onPressIn={(event) => {
        animatePressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animatePressOut();
        onPressOut?.(event);
      }}
      style={[style, { opacity, transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressableBase>
  );
};
