import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { motion } from '../../theme/motion';
import { AnimatedPressable } from './AnimatedPressable';

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
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const isBottomSheet = variant === 'bottomSheet';
  const [mounted, setMounted] = useState(visible);
  const overlayOpacity = useRef(new Animated.Value(visible && !reduceMotion ? 0 : 1)).current;
  const sheetProgress = useRef(new Animated.Value(visible && !reduceMotion ? 1 : 0)).current;
  const dialogScale = useRef(new Animated.Value(visible && !reduceMotion ? 0.96 : 1)).current;
  const useNativeDriver = Platform.OS !== 'web';

  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;

    if (reduceMotion) {
      if (visible) {
        overlayOpacity.setValue(1);
        sheetProgress.setValue(0);
        dialogScale.setValue(1);
      } else {
        setMounted(false);
      }
      return;
    }

    if (visible) {
      overlayOpacity.setValue(0);
      sheetProgress.setValue(isBottomSheet ? 1 : 0);
      dialogScale.setValue(isBottomSheet ? 1 : 0.96);

      const openAnimation = Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: motion.duration.backdrop,
          useNativeDriver,
        }),
        isBottomSheet
          ? Animated.timing(sheetProgress, {
              toValue: 0,
              duration: motion.duration.modal,
              useNativeDriver,
            })
          : Animated.spring(dialogScale, {
              toValue: 1,
              useNativeDriver,
              ...motion.spring,
            }),
      ]);

      openAnimation.start();
      return () => openAnimation.stop();
    }

    const closeAnimation = Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: motion.duration.close,
        useNativeDriver,
      }),
      isBottomSheet
        ? Animated.timing(sheetProgress, {
            toValue: 1,
            duration: motion.duration.close,
            useNativeDriver,
          })
        : Animated.timing(dialogScale, {
            toValue: 0.96,
            duration: motion.duration.close,
            useNativeDriver,
          }),
    ]);

    closeAnimation.start(({ finished }) => {
      if (finished) setMounted(false);
    });

    return () => closeAnimation.stop();
  }, [
    dialogScale,
    isBottomSheet,
    mounted,
    overlayOpacity,
    reduceMotion,
    sheetProgress,
    useNativeDriver,
    visible,
  ]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  };

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: overlayOpacity, justifyContent: isBottomSheet ? 'flex-end' : 'center' },
            ]}
          >
            <TouchableWithoutFeedback>
              <Animated.View
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
                  isBottomSheet
                    ? { transform: [{ translateY: sheetTranslateY }] }
                    : { transform: [{ scale: dialogScale }] },
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
                      <AnimatedPressable
                        onPress={handleClose}
                        style={[
                          styles.closeButton,
                          { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Close dialog"
                      >
                        <X size={20} color={colors.textSecondary} />
                      </AnimatedPressable>
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
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
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
