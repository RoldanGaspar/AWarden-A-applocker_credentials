/**
 * AWarden - Interactive Owl Mascot Component
 * SVG-powered guardian mascot with dynamic facial expressions and security micro-interactions
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  G,
  Path,
  Circle,
  Ellipse,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

export type OwlMood = 'awake' | 'eyes_closed' | 'peeking' | 'happy' | 'alert' | 'curious';

export interface OwlMascotProps {
  size?: number;
  mood?: OwlMood;
  style?: ViewStyle;
}

export const OwlMascot: React.FC<OwlMascotProps> = ({
  size = 80,
  mood = 'awake',
  style,
}) => {
  const { colors, accent, isDark } = useTheme();

  const primaryColor = accent.primary;
  const bodyColor = isDark ? '#1E293B' : '#334155'; // Deep slate body
  const bellyColor = isDark ? '#0F172A' : '#F1F5F9';
  const beakColor = '#F59E0B'; // Amber beak
  const eyeSocketColor = isDark ? '#334155' : '#E2E8F0';
  const alertColor = '#EF4444'; // Red for alert

  // Render eyes based on mood
  const renderEyes = () => {
    switch (mood) {
      case 'eyes_closed':
        // Closed curved lines (shy / hiding password)
        return (
          <G>
            {/* Left Eye Closed Arch */}
            <Path
              d="M 32 46 Q 38 52 44 46"
              stroke={primaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Eye Closed Arch */}
            <Path
              d="M 56 46 Q 62 52 68 46"
              stroke={primaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cute blush marks */}
            <Ellipse cx="30" cy="54" rx="4" ry="2" fill={`${primaryColor}55`} />
            <Ellipse cx="70" cy="54" rx="4" ry="2" fill={`${primaryColor}55`} />
          </G>
        );

      case 'peeking':
        // Left eye open, Right eye squinted/wink
        return (
          <G>
            {/* Left Eye Open */}
            <Circle cx="38" cy="46" r="7" fill={eyeSocketColor} />
            <Circle cx="38" cy="46" r="4.5" fill={primaryColor} />
            <Circle cx="36" cy="44" r="1.5" fill="#FFFFFF" />

            {/* Right Eye Wink / Peeking Line */}
            <Path
              d="M 56 46 Q 62 52 68 46"
              stroke={primaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Blush */}
            <Ellipse cx="70" cy="54" rx="4" ry="2" fill={`${primaryColor}55`} />
          </G>
        );

      case 'happy':
        // Upward curved joyful eyes
        return (
          <G>
            {/* Left Joyful Eye */}
            <Path
              d="M 32 48 Q 38 40 44 48"
              stroke={primaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right Joyful Eye */}
            <Path
              d="M 56 48 Q 62 40 68 48"
              stroke={primaryColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Blushes */}
            <Ellipse cx="30" cy="54" rx="4" ry="2" fill={`${primaryColor}66`} />
            <Ellipse cx="70" cy="54" rx="4" ry="2" fill={`${primaryColor}66`} />
          </G>
        );

      case 'alert':
        // Stern furrowed brow with glowing warning eyes
        return (
          <G>
            {/* Furrowed Brow Left */}
            <Path d="M 30 38 L 46 42" stroke={alertColor} strokeWidth="3" strokeLinecap="round" />
            {/* Furrowed Brow Right */}
            <Path d="M 70 38 L 54 42" stroke={alertColor} strokeWidth="3" strokeLinecap="round" />

            {/* Alert Red/Amber Glowing Eyes */}
            <Circle cx="38" cy="47" r="7" fill={eyeSocketColor} />
            <Circle cx="38" cy="47" r="5" fill={alertColor} />
            <Circle cx="37" cy="46" r="1.5" fill="#FFFFFF" />

            <Circle cx="62" cy="47" r="7" fill={eyeSocketColor} />
            <Circle cx="62" cy="47" r="5" fill={alertColor} />
            <Circle cx="61" cy="46" r="1.5" fill="#FFFFFF" />
          </G>
        );

      case 'curious':
        // One eye slightly bigger with head-tilt vibe
        return (
          <G>
            {/* Left Eye Wide */}
            <Circle cx="38" cy="45" r="8" fill={eyeSocketColor} />
            <Circle cx="38" cy="45" r="5" fill={primaryColor} />
            <Circle cx="36" cy="43" r="2" fill="#FFFFFF" />

            {/* Right Eye Normal */}
            <Circle cx="62" cy="46" r="6.5" fill={eyeSocketColor} />
            <Circle cx="62" cy="46" r="4" fill={primaryColor} />
            <Circle cx="61" cy="44.5" r="1.5" fill="#FFFFFF" />
          </G>
        );

      case 'awake':
      default:
        // Large luminous wise guardian eyes
        return (
          <G>
            {/* Left Eye */}
            <Circle cx="38" cy="45" r="8" fill={eyeSocketColor} />
            <Circle cx="38" cy="45" r="5.5" fill={primaryColor} />
            <Circle cx="36" cy="43" r="2" fill="#FFFFFF" />
            <Circle cx="40" cy="47" r="0.8" fill="#FFFFFF" />

            {/* Right Eye */}
            <Circle cx="62" cy="45" r="8" fill={eyeSocketColor} />
            <Circle cx="62" cy="45" r="5.5" fill={primaryColor} />
            <Circle cx="60" cy="43" r="2" fill="#FFFFFF" />
            <Circle cx="64" cy="47" r="0.8" fill="#FFFFFF" />
          </G>
        );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg viewBox="0 0 100 100" width="100%" height="100%">
        <Defs>
          <LinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Aura / Halo Badge */}
        <Circle cx="50" cy="50" r="46" fill="url(#shieldGrad)" />

        {/* Ear Tufts / Horns */}
        <Path
          d="M 28 32 L 20 16 L 36 24 Z"
          fill={bodyColor}
          stroke={primaryColor}
          strokeWidth="1.5"
        />
        <Path
          d="M 72 32 L 80 16 L 64 24 Z"
          fill={bodyColor}
          stroke={primaryColor}
          strokeWidth="1.5"
        />

        {/* Main Body */}
        <Ellipse
          cx="50"
          cy="56"
          rx="32"
          ry="34"
          fill={bodyColor}
          stroke={primaryColor}
          strokeWidth="2"
        />

        {/* Wings (Left & Right) */}
        <Path
          d="M 18 52 Q 14 68 28 80 Q 24 64 22 52 Z"
          fill={isDark ? '#0F172A' : '#475569'}
        />
        <Path
          d="M 82 52 Q 86 68 72 80 Q 76 64 78 52 Z"
          fill={isDark ? '#0F172A' : '#475569'}
        />

        {/* Belly Shield Feather Patch */}
        <Path
          d="M 34 56 Q 50 48 66 56 Q 62 82 50 86 Q 38 82 34 56 Z"
          fill={bellyColor}
          opacity="0.9"
        />

        {/* Chest Feather Chevron Accents */}
        <Path
          d="M 44 64 L 50 68 L 56 64"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <Path
          d="M 42 72 L 50 77 L 58 72"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Facial Discs */}
        <Circle cx="38" cy="45" r="13" fill={bellyColor} opacity="0.3" />
        <Circle cx="62" cy="45" r="13" fill={bellyColor} opacity="0.3" />

        {/* Eyes (Reactive State) */}
        {renderEyes()}

        {/* Beak */}
        <Path
          d="M 46 51 L 54 51 L 50 60 Z"
          fill={beakColor}
        />

        {/* Talons / Perch Feet */}
        <Path
          d="M 38 88 L 38 93 M 42 88 L 42 93 M 46 88 L 46 93"
          stroke={beakColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M 54 88 L 54 93 M 58 88 L 58 93 M 62 88 L 62 93"
          stroke={beakColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
