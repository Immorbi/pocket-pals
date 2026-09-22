import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { TOYS } from '@/domain/toys';
import type { PetId, ToyId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

export interface PetHitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ToyPlayProps {
  toyId: ToyId;
  petId: PetId;
  /** Where the pet is on screen, in window coordinates. */
  hitBox: PetHitBox | null;
  onDone: () => void;
}

const TOY_SIZE = 76;
/** The toy rests near the bottom-left so it never spawns already on top of the pet. */
const TOY_START_X = 28;
const TOY_BOTTOM = 150;

export function ToyPlay({ toyId, petId, hitBox, onDone }: ToyPlayProps) {
  const toy = TOYS[toyId];
  const def = PET_DEFINITIONS[petId];
  const { height: screenHeight } = useWindowDimensions();
  const toyStartY = screenHeight - TOY_BOTTOM - TOY_SIZE;
  const startPlaying = useGameStore((s) => s.startPlaying);
  const finishPlaying = useGameStore((s) => s.finishPlaying);

  const [touching, setTouching] = useState(false);
  const [left, setLeft] = useState(toy.durationSeconds);
  const done = left <= 0;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const grabbed = useSharedValue(0);

  // Only the seconds the toy actually spends on the pet count, so the game is about
  // playing with them rather than waiting out a timer.
  useEffect(() => {
    if (!touching || done) return;
    const tick = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [touching, left, done]);

  useEffect(() => {
    if (touching) startPlaying(petId);
  }, [touching, petId, startPlaying]);

  useEffect(() => {
    if (!done) return;
    finishPlaying(petId, toyId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [done, petId, toyId, finishPlaying, onDone]);

  const reportTouch = (value: boolean) => setTouching(value);

  const pan = Gesture.Pan()
    .onBegin(() => {
      grabbed.value = withSpring(1, { damping: 12 });
    })
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
      if (!hitBox) return;
      const cx = TOY_START_X + x.value + TOY_SIZE / 2;
      const cy = toyStartY + y.value + TOY_SIZE / 2;
      const inside =
        cx > hitBox.x && cx < hitBox.x + hitBox.width && cy > hitBox.y && cy < hitBox.y + hitBox.height;
      runOnJS(reportTouch)(inside);
    })
    .onFinalize(() => {
      grabbed.value = withTiming(0, { duration: 160 });
      runOnJS(reportTouch)(false);
    });

  const toyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 + grabbed.value * 0.12 }],
  }));

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>
          {done ? `${def.name} ${def.gender === 'f' ? 'наигралась' : 'наигрался'}!` : touching ? `Ещё ${left} с` : `Поводите ${toy.label.toLowerCase()} по ${def.nameGenitive}`}
        </Text>
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
