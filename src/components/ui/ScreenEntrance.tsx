import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { motion } from '../../theme/motion';

export interface ScreenEntranceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ScreenEntrance: React.FC<ScreenEntranceProps> = ({ children, style }) => {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : motion.screenOffset)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.screen,
        useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.duration.screen,
        useNativeDriver,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, reduceMotion, translateY, useNativeDriver]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};
