import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const GRID_POSITIONS = [0, 16, 32, 48, 64, 80, 96];

export interface AnimatedPatternBackgroundProps {
  intensity?: number;
  active?: boolean;
}

export const AnimatedPatternBackground: React.FC<AnimatedPatternBackgroundProps> = ({
  intensity = 1,
  active = true,
}) => {
  const { accent } = useTheme();
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const patternIntensity = Math.max(0, Math.min(1, intensity));

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    drift.stopAnimation();
    pulse.stopAnimation();

    if (reduceMotion || !active) {
      drift.setValue(0);
      pulse.setValue(0);
      return;
    }

    const useNativeDriver = Platform.OS !== 'web';
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver,
        }),
      ])
    );

    driftLoop.start();
    pulseLoop.start();

    return () => {
      driftLoop.stop();
      pulseLoop.stop();
    };
  }, [active, drift, pulse, reduceMotion]);

  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] });
  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [18, -18] });
  const orbitRotation = drift.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08 * patternIntensity, 0.2 * patternIntensity],
  });
  const orbitOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16 * patternIntensity, 0.32 * patternIntensity],
  });

  return (
    <View style={styles.layer} accessibilityElementsHidden>
      <View style={[styles.grid, { transform: [{ rotate: '-12deg' }, { scale: 1.25 }] }]}>
        {GRID_POSITIONS.map((position) => (
          <View
            key={`vertical-${position}`}
            style={[
              styles.verticalLine,
              { left: `${position}%`, backgroundColor: accent.primary, opacity: 0.055 * patternIntensity },
            ]}
          />
        ))}
        {GRID_POSITIONS.map((position) => (
          <View
            key={`horizontal-${position}`}
            style={[
              styles.horizontalLine,
              { top: `${position}%`, backgroundColor: accent.primary, opacity: 0.055 * patternIntensity },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.orbit,
          {
            borderColor: accent.primary,
            opacity: reduceMotion ? 0.2 * patternIntensity : orbitOpacity,
            transform: [{ translateX: driftX }, { translateY: driftY }, { rotate: orbitRotation }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.innerOrbit,
          {
            borderColor: accent.primary,
            opacity: reduceMotion ? 0.14 * patternIntensity : orbitOpacity,
            transform: [{ translateX: driftX }, { translateY: driftY }, { rotate: orbitRotation }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.topGlow,
          { backgroundColor: accent.primary, opacity: reduceMotion ? 0.1 * patternIntensity : glowOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.bottomGlow,
          {
            backgroundColor: accent.primary,
            opacity: reduceMotion ? 0.06 * patternIntensity : glowOpacity,
            transform: [{ translateX: driftX }, { translateY: driftY }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  orbit: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    right: -250,
    top: -150,
  },
  innerOrbit: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    borderWidth: 1,
    right: -150,
    top: -50,
  },
  topGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -90,
    top: -60,
  },
  bottomGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    left: -150,
    bottom: -120,
  },
});
