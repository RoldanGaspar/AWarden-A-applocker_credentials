import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'bottomSheet' | 'center';
  showCloseButton?: boolean;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'bottomSheet',
  showCloseButton = true,
  contentStyle,
}) => {
  const { colors, radius, spacing, typography, shadows } = useTheme();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  };

  const isBottomSheet = variant === 'bottomSheet';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={isBottomSheet ? 'slide' : 'fade'}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dialog,
                  isBottomSheet
                    ? {
                        borderTopLeftRadius: radius.xl,
                        borderTopRightRadius: radius.xl,
                        backgroundColor: colors.bgElevated,
                        maxHeight: '90%',
                      }
                    : {
                        borderRadius: radius.lg,
                        backgroundColor: colors.bgElevated,
                        marginHorizontal: spacing.lg,
                        maxWidth: 480,
                        maxHeight: '85%',
                        ...shadows.elevated,
                      },
                  contentStyle,
                ]}
              >
                {/* Drag handle for bottom sheet */}
                {isBottomSheet && (
                  <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: colors.borderMedium }]} />
                  </View>
                )}

                {/* Header */}
                {(title || showCloseButton) && (
                  <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
                    <View style={styles.titleContainer}>
                      {title && (
                        <Text
                          style={[
                            styles.title,
                            { color: colors.textPrimary, fontSize: typography.lg },
                          ]}
                        >
                          {title}
                        </Text>
                      )}
                      {subtitle && (
                        <Text
                          style={[
                            styles.subtitle,
                            { color: colors.textTertiary, fontSize: typography.sm },
                          ]}
                        >
                          {subtitle}
                        </Text>
                      )}
                    </View>

                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={handleClose}
                        style={[
                          styles.closeButton,
                          { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Close dialog"
                      >
                        <X size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Body */}
                <ScrollView
                  style={styles.body}
                  contentContainerStyle={[styles.bodyContent, { padding: spacing.lg }]}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dialog: {
    width: '100%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
});
