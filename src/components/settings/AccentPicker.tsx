/**
 * Life OS & Vault - Accent Palette Picker Component
 * Curated WCAG AA accent palettes
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { ACCENT_PALETTES, AccentName } from '../../theme/tokens';

export const AccentPicker: React.FC = () => {
  const { accentName, setAccent, colors, typography, radius } = useTheme();

  const palettes: { key: AccentName; name: string; hex: string }[] = [
    { key: 'sage', name: 'Sage', hex: ACCENT_PALETTES.sage.primary },
    { key: 'clay', name: 'Clay', hex: ACCENT_PALETTES.clay.primary },
    { key: 'slate', name: 'Slate', hex: ACCENT_PALETTES.slate.primary },
    { key: 'moss', name: 'Moss', hex: ACCENT_PALETTES.moss.primary },
    { key: 'dusk', name: 'Dusk', hex: ACCENT_PALETTES.dusk.primary },
    { key: 'obsidian', name: 'Obsidian', hex: ACCENT_PALETTES.obsidian.primary },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {palettes.map((p) => {
          const isSelected = accentName === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAccent(p.key);
              }}
              style={[
                styles.item,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: isSelected ? p.hex : colors.borderSubtle,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`Select ${p.name} accent`}
            >
              <View style={[styles.colorCircle, { backgroundColor: p.hex }]}>
                {isSelected && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.name, { color: colors.textPrimary, fontSize: typography.xs }]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    flexBasis: '31%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
  },
});
