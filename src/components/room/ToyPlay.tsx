import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { TOYS } from '@/domain/toys';
import type { PetId, ToyId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

interface ToyPlayProps {
  toyId: ToyId;
  petId: PetId;
  onDone: () => void;
}

/** Сколько раз нужно бросить игрушку, чтобы питомец наигрался. */
const THROWS_PER_SESSION = 5;

/** 1 бросок, 2–4 броска, 5 бросков. */
function throwWord(n: number): string {
  const tens = n % 100;
  const ones = n % 10;
  if (ones === 1 && tens !== 11) return 'бросок';
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return 'броска';
  return 'бросков';
}

const TOY_SIZE = 76;
/** The toy rests near the bottom-left so it never spawns already on top of the pet. */
const TOY_START_X = 28;
const TOY_BOTTOM = 150;

/**
 * Throwing physics, in pixels and seconds. The toy rests on the grass at translateY 0, so
 * that line is the floor and everything above it is negative.
 */
const GRAVITY = 2600;
/** How much of the fall is kept on the way back up — a toy, not a superball. */
const BOUNCE = 0.52;
const WALL_BOUNCE = 0.45;
/** Each floor hit scrubs sideways speed; rolling then bleeds off the rest, per second. */
const BOUNCE_DRAG = 0.78;
const ROLL_DRAG = 2.4;
/** Below this it has stopped in any way that matters, so it settles instead of jittering. */
const REST_SPEED = 42;
const EDGE_PADDING = 8;

export function ToyPlay({ toyId, petId, onDone }: ToyPlayProps) {
  const toy = TOYS[toyId];
  const def = PET_DEFINITIONS[petId];
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const toyStartY = screenHeight - TOY_BOTTOM - TOY_SIZE;
  const startPlaying = useGameStore((s) => s.startPlaying);
  const finishPlaying = useGameStore((s) => s.finishPlaying);

  const [throws, setThrows] = useState(0);
  const left = THROWS_PER_SESSION - throws;
  const done = left <= 0;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const velocityX = useSharedValue(0);
  const velocityY = useSharedValue(0);
  const spin = useSharedValue(0);
  const flying = useSharedValue(false);
  const grabbed = useSharedValue(0);

  // Игра начинается с первого броска, а не с касания питомца.
  useEffect(() => {
    if (throws === 1) startPlaying(petId);
  }, [throws, petId, startPlaying]);

  useEffect(() => {
    if (!done) return;
    finishPlaying(petId, toyId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [done, petId, toyId, finishPlaying, onDone]);

  const reportThrown = () => setThrows((n) => Math.min(THROWS_PER_SESSION, n + 1));
  const bounceFeedback = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  useFrameCallback((frame) => {
    'worklet';
    if (!flying.value) return;

    // Clamp the step: a dropped frame must not teleport the toy through the floor.
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, 32) / 1000;
    const minX = EDGE_PADDING - TOY_START_X;
    const maxX = screenWidth - TOY_SIZE - EDGE_PADDING - TOY_START_X;
    const ceiling = -(toyStartY - EDGE_PADDING);

    velocityY.value += GRAVITY * dt;
    let nextX = x.value + velocityX.value * dt;
    let nextY = y.value + velocityY.value * dt;

    if (nextX < minX || nextX > maxX) {
      nextX = nextX < minX ? minX : maxX;
      velocityX.value = -velocityX.value * WALL_BOUNCE;
    }
    if (nextY < ceiling) {
      nextY = ceiling;
      velocityY.value = -velocityY.value * WALL_BOUNCE;
    }

    if (nextY >= 0) {
      nextY = 0;
      if (Math.abs(velocityY.value) > REST_SPEED) {
        velocityY.value = -velocityY.value * BOUNCE;
        velocityX.value *= BOUNCE_DRAG;
        runOnJS(bounceFeedback)();
      } else {
        // Landed for good: roll to a stop instead of trembling on the spot.
        velocityY.value = 0;
        velocityX.value *= Math.max(0, 1 - ROLL_DRAG * dt);
        if (Math.abs(velocityX.value) < REST_SPEED / 2) {
          velocityX.value = 0;
          flying.value = false;
        }
      }
    }

    x.value = nextX;
    y.value = nextY;
    spin.value += velocityX.value * dt * 0.9;
  });

  /* eslint-disable react-hooks/immutability -- Reanimated shared values written from gesture
     callbacks on the UI thread, never React state written during render. */
  const pan = Gesture.Pan()
    .onBegin(() => {
      // Catching it mid-flight stops it dead in your hand.
      flying.value = false;
      velocityX.value = 0;
      velocityY.value = 0;
      grabbed.value = withSpring(1, { damping: 12 });
    })
    .onChange((event) => {
      x.value += event.changeX;
      y.value += event.changeY;
      spin.value += event.changeX * 0.4;
    })
    .onEnd((event) => {
      // Let go mid-air and it keeps the speed of your hand — that is the throw.
      velocityX.value = event.velocityX;
      velocityY.value = event.velocityY;
      flying.value = true;
      if (Math.abs(event.velocityX) + Math.abs(event.velocityY) > 300) runOnJS(reportThrown)();
    })
    .onFinalize(() => {
      grabbed.value = withTiming(0, { duration: 160 });
    });
  /* eslint-enable react-hooks/immutability */

  const toyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${spin.value}deg` },
      { scale: 1 + grabbed.value * 0.12 },
    ],
  }));

  const hint = done
    ? `${def.name} ${def.gender === 'f' ? 'наигралась' : 'наигрался'}!`
    : throws === 0
      ? `Брось ${toy.label.toLowerCase()} — ${THROWS_PER_SESSION} раз`
      : `Ещё ${left} ${throwWord(left)}`;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{hint}</Text>
      </View>

      {done ? null : (
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.toy, toyStyle]}>
            {toy.image ? (
              <Image source={toy.image} style={styles.toyImage} resizeMode="contain" />
            ) : (
              <Text style={styles.toyEmoji}>{toy.emoji}</Text>
            )}
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  banner: {
    position: 'absolute',
    top: 128,
    alignSelf: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    ...SHADOW.soft,
  },
  bannerText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.text,
  },
  toy: {
    position: 'absolute',
    left: TOY_START_X,
    bottom: TOY_BOTTOM,
    width: TOY_SIZE,
    height: TOY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toyImage: {
    width: '100%',
    height: '100%',
  },
  toyEmoji: {
    fontSize: 46,
  },
});
