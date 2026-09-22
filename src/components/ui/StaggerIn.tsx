import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface StaggerInProps {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** One-shot fade + rise entrance, meant to be staggered across a screen's sections on mount. */
export function StaggerIn({ delay = 0, style, children }: StaggerInProps) {
  // With motion turned down the section is simply there from the first frame: the entrance
  // fades content in from nothing, so skipping it has to mean visible, never blank.
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration: 420 }));
  }, [delay, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
