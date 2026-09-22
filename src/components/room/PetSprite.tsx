import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import type { PetId, PetStateName } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';


const TRANSIENT_DURATIONS: Partial<Record<PetStateName, number>> = {
  EATING: 2200,
  AMBIENT_EVENT: 2400,
  SPECIAL_EVENT: 2800,
  REQUESTING_FOOD: 6000,
  REQUESTING_PLAY: 6000,
  REQUESTING_ATTENTION: 6000,
};

const PETTING_THROTTLE_MS = 350;

/** How much of the square sprite frame the drawn animal actually fills — see ToyPlay's hit box. */
const TOUCH_WIDTH = 0.55;
const TOUCH_HEIGHT = 0.8;

interface PetSpriteProps {
  petId: PetId;
  /** Overrides the pet's stored room position — used by the single-pet "featured" view. */
  position?: { x: number; y: number };
  /** Visual size multiplier around the base 72px sprite box. */
  scale?: number;
  /** Set false to hold the sprite still — used for the large featured portrait on Home. */
  animateIdle?: boolean;
}

export function PetSprite({ petId, position, scale = 1, animateIdle = true }: PetSpriteProps) {
  const def = PET_DEFINITIONS[petId];
  const pet = useGameStore((s) => s.pets[petId]);
  const tapPet = useGameStore((s) => s.tapPet);
  const startPetting = useGameStore((s) => s.startPetting);
  const applyPetting = useGameStore((s) => s.applyPetting);
  const endPetting = useGameStore((s) => s.endPetting);
  const completeTransientState = useGameStore((s) => s.completeTransientState);

  const lastPettingCallAt = useSharedValue(0);
  const wobble = useSharedValue(0);
  const bounce = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const triggerTapHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Auto-revert transient, non-user-driven states back to idle/sleep after their animation plays out.
  useEffect(() => {
    const duration = TRANSIENT_DURATIONS[pet.currentState];
    if (!duration) return;
    const timer = setTimeout(() => completeTransientState(petId), duration);
    return () => clearTimeout(timer);
  }, [pet.currentState, petId, completeTransientState]);

  // Thought bubbles fade on their own after a few seconds.
  useEffect(() => {
    if (!pet.thought) return;
    const timer = setTimeout(() => useGameStore.getState().clearThought(petId), 3400);
    return () => clearTimeout(timer);
  }, [pet.thought, petId]);

  // Idle "the world is alive" wobble: a small looping bob, paused during high-focus states.
  useEffect(() => {
    if (!animateIdle) return;
    const isBusy = pet.currentState === 'EATING' || pet.currentState === 'PLAYING' || pet.currentState === 'PETTING' || pet.isSleeping;
    if (isBusy) {
      wobble.value = withTiming(0, { duration: 200 });
      return;
    }
    wobble.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1, true);
  }, [pet.currentState, pet.isSleeping, wobble, animateIdle]);

  useEffect(() => {
    if (!animateIdle) return;
    if (pet.currentState === 'EATING' || pet.currentState === 'REQUESTING_FOOD') {
      bounce.value = withRepeat(withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: 220 })), 3, true);
    }
  }, [pet.currentState, bounce, animateIdle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -wobble.value * 5 - bounce.value * 8 }, { scale: pressScale.value }],
  }));

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
      pressScale.value = withTiming(0.9, { duration: 80 });
    })
    .onFinalize(() => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
      pressScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    })
    .onEnd(() => {
      runOnJS(triggerTapHaptic)();
      runOnJS(tapPet)(petId);
    });

  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
      pressScale.value = withTiming(0.94, { duration: 100 });
    })
    .onStart(() => {
      lastPettingCallAt.value = 0;
      runOnJS(startPetting)(petId);
    })
    .onUpdate(() => {
      // Worklet: runs on the UI thread from real gesture events only, never during render.
      // eslint-disable-next-line react-hooks/purity -- gesture-handler callback, not render code
      const now = Date.now();
      if (now - lastPettingCallAt.value < PETTING_THROTTLE_MS) return;
      lastPettingCallAt.value = now;
      runOnJS(applyPetting)(petId);
    })
    .onEnd(() => {
      runOnJS(endPetting)(petId);
    })
    .onFinalize(() => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, not React state
      pressScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const emoji = pet.isSleeping ? def.emoji.SLEEPING ?? '😴' : def.emoji[pet.currentState] ?? def.emoji.base;

  // Once a pet has real artwork it stays on screen in every state — swapping the whole
  // animal for a giant emoji wrecked the illustrated scene. State reads from the badge instead.
  const useIdleSprite = !!def.idleSprite;
  const targetSprite = pet.currentState === 'PLAYING' && def.playSprite ? def.playSprite : def.idleSprite;

  // Both clips are cut to begin and end on the very same drawing, so swapping them is
  // invisible — but only exactly on a loop boundary. Let the running clip play out to that
  // frame first, then switch. Without measured loop lengths there is nothing to wait for.
  const canDefer = !!def.playSprite && !!def.idleLoopMs && !!def.playLoopMs;
  const [heldSprite, setHeldSprite] = useState(targetSprite);
  const cycleStartedAt = useRef(0);

  // The clip starts playing as the sprite is painted, so that is when its cycle begins.
  useEffect(() => {
    cycleStartedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!canDefer || heldSprite === targetSprite) return;
    const loopMs = (heldSprite === def.playSprite ? def.playLoopMs : def.idleLoopMs) as number;
    const untilBoundary = loopMs - ((Date.now() - cycleStartedAt.current) % loopMs);
    const timer = setTimeout(() => {
      cycleStartedAt.current = Date.now();
      setHeldSprite(targetSprite);
    }, untilBoundary);
    return () => clearTimeout(timer);
  }, [canDefer, heldSprite, targetSprite, def]);

  const shownSprite = canDefer ? heldSprite : targetSprite;

  const displayPosition = position ?? pet.position;
  const boxSize = 72 * scale;


  return (
    <View
      style={[
        styles.wrapper,
        { left: `${displayPosition.x * 100}%`, top: `${displayPosition.y * 100}%`, width: boxSize, height: boxSize, marginLeft: -boxSize / 2, marginTop: -boxSize / 2 },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.hitArea, { width: boxSize, height: boxSize }, animatedStyle]} pointerEvents="box-none">
        {useIdleSprite ? (
          <View style={styles.spriteFill} pointerEvents="none">
            <Image source={shownSprite} style={styles.spriteFill} resizeMode="contain" />
          </View>
        ) : (
          <Text style={[styles.sprite, { fontSize: 44 * scale }]}>{emoji}</Text>
        )}
        {/* Only the drawn animal takes touches — the rest of the frame is transparent padding
            that would otherwise swallow taps meant for whatever sits behind it. */}
        <GestureDetector gesture={composedGesture}>
          <View style={[styles.touchArea, { width: boxSize * TOUCH_WIDTH, height: boxSize * TOUCH_HEIGHT }]} />
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  hitArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    fontSize: 44,
  },
  spriteFill: {
    width: '100%',
    height: '100%',
  },
  // No insets, so Yoga centres it with the frame's own alignment.
  touchArea: {
    position: 'absolute',
  },
});
