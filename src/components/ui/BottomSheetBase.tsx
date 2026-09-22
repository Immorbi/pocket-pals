import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';

interface BottomSheetBaseProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheetBase({ visible, title, onClose, children }: BottomSheetBaseProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [visible, progress]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 320 }],
    opacity: progress.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.5 }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      </Pressable>
      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }, sheetStyle]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.soft,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.heading,
    marginBottom: SPACING.md,
  },
});
