import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export interface AWardenMarkProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

export const AWardenMark: React.FC<AWardenMarkProps> = ({
  size = 80,
  style,
  accessibilityLabel = 'AWarden guardian mark',
}) => (
  <Image
    source={require('../../../assets/images/awarden-mark.png')}
    resizeMode="contain"
    accessible
    accessibilityLabel={accessibilityLabel}
    style={[{ width: size, height: size }, style]}
  />
);
