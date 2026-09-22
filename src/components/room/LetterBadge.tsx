import { useEffect } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

// Short, hard flicks with a long pause between them — a sharp shake that catches the eye
// without turning into a constant sway.
const SHAKE = [-14, 12, -9, 7, -4, 0];
const STEP_MS = 65;
const REST_MS = 2400;

export function LetterBadge({ onPress, shake }: { onPress: () => void; shake: boolean }) {
  const tilt = useSharedValue(0);
  // This one repeats forever until the note is opened, which is exactly the kind of motion
  // the system setting exists to stop.
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!shake || reduced) {
      tilt.value = withTiming(0, { duration: 160 });
      return;
    }
    tilt.value = withRepeat(
      withSequence(
        ...SHAKE.map((angle) => withTiming(angle, { duration: STEP_MS })),
        withDelay(REST_MS, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [tilt, shake, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="Открыть записку">
      <Animated.View style={style}>
        <Image source={require('../../../assets/images/letter.png')} style={styles.letter} resizeMode="contain" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  letter: {
    width: 54,
    height: 42,
  },
});
