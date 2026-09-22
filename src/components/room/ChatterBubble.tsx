import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { nextChatter, type ChatterLine } from '@/domain/chatter';

const VISIBLE_MS = 6500;
const GAP_MS = 14000;
const GAP_JITTER_MS = 16000;
const FADE_IN_MS = 260;
const FADE_OUT_MS = 200;

/**
 * Reserves its height whether or not a line is showing, so the pet below never shifts
 * when a bubble appears. The caller passes `key={petId}` so switching pets restarts the
 * rhythm by remounting rather than by resetting state from an effect.
 *
 * The fade is driven by a shared value rather than Reanimated's entering/exiting helpers:
 * those apply only after the element has been painted, so the bubble flashed at full
 * opacity for a frame and jumped a dozen pixels on its way out. Holding the line mounted
 * and animating opacity alone keeps it perfectly still.
 */
export function ChatterBubble({ gender }: { gender: 'f' | 'm' }) {
  const [line, setLine] = useState<ChatterLine | null>(null);
  const [visible, setVisible] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const hide = setTimeout(() => setVisible(false), VISIBLE_MS);
      return () => clearTimeout(hide);
    }
    const show = setTimeout(() => {
      // Swapped while still invisible, so a new line never appears mid-fade.
      setLine((prev) => nextChatter(prev, gender));
      setVisible(true);
    }, GAP_MS + Math.random() * GAP_JITTER_MS);
    return () => clearTimeout(show);
  }, [visible, gender]);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? FADE_IN_MS : FADE_OUT_MS });
  }, [visible, opacity]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.slot} pointerEvents="none">
      {line ? (
        <Animated.View style={[styles.bubble, fade]}>
          <Text style={styles.text}>{line.text}</Text>
          <View style={styles.tail} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.sm,
  },
  bubble: {
    maxWidth: 280,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOW.soft,
  },
  text: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.text,
    textAlign: 'center',
  },
  // Little pointer toward the pet below.
  tail: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 14,
    height: 14,
    backgroundColor: COLORS.card,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
});
