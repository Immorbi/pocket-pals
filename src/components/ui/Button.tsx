import * as Haptics from 'expo-haptics';
import { Image, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';

interface ButtonProps {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTTON_BG = {
  primary: require('../../../assets/images/buttons/primary.png'),
  secondary: require('../../../assets/images/buttons/secondary.png'),
};

export function Button({ label, icon, onPress, variant = 'primary', style }: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
        scale.value = withSpring(0.95, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }}
      style={[styles.base, animatedStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Image source={BUTTON_BG[variant]} style={styles.background} resizeMode="stretch" />
      {icon}
      <Text style={[styles.label, variant === 'secondary' && styles.labelSecondary]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    gap: SPACING.xs,
    minHeight: 52,
    ...SHADOW.soft,
  },
  label: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  labelSecondary: {
    color: COLORS.text,
  },
});
