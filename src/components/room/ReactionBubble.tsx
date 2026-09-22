import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';

const VISIBLE_MS = 4200;
const FADE_IN_MS = 180;
const FADE_OUT_MS = 220;

/**
 * A line the pet says right after being fed or played with. Purely presentational: the
 * caller decides which text to show and for how long by remounting with a fresh `text` prop
 * (see PetChatter, which prefers this over the ambient ChatterBubble whenever one is fresh).
 * Visuals mirror ChatterBubble's bubble so a reaction and small talk look like the same voice.
 */
export function ReactionBubble({ text, onDone }: { text: string; onDone: () => void }) {
  // Starts already visible — a new instance is mounted (via key) for every fresh line, so
  // there is nothing to wait for before showing it.
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => clearTimeout(hide);
  }, []);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? FADE_IN_MS : FADE_OUT_MS });
    // Skip the initial mount, where `visible` starts false before the effect above flips it —
    // only a real hide (after having shown) should hand back to the caller.
    if (mounted.current && !visible) {
      const timer = setTimeout(onDone, FADE_OUT_MS);
      return () => clearTimeout(timer);
    }
    mounted.current = true;
  }, [visible, opacity, onDone]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.slot} pointerEvents="none">
      <Animated.View style={[styles.bubble, fade]}>
        <Text style={styles.text}>{text}</Text>
        <View style={styles.tail} />
      </Animated.View>
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
