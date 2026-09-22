import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { FOODS, foodReactionFor } from '@/domain/food';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import type { FoodId, PetId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

import type { PetHitBox } from './ToyPlay';

interface FoodPlayProps {
  foodId: FoodId;
  petId: PetId;
  /** Where the pet is on screen, in window coordinates. */
  hitBox: PetHitBox | null;
  onDone: () => void;
}

const FOOD_SIZE = 76;
/** The food rests near the bottom-left so it never spawns already on top of the pet. */
const FOOD_START_X = 28;
const FOOD_BOTTOM = 150;

/**
 * Drag-to-feed: near-identical staging and gesture handling to ToyPlay, but there is no
 * hold-it-there timer — reaching the pet feeds them at once, favourite or refused included.
 */
export function FoodPlay({ foodId, petId, hitBox, onDone }: FoodPlayProps) {
  const food = FOODS[foodId];
  const def = PET_DEFINITIONS[petId];
  const reaction = foodReactionFor(petId, foodId);
  const { height: screenHeight } = useWindowDimensions();
  const foodStartY = screenHeight - FOOD_BOTTOM - FOOD_SIZE;
  const feedPet = useGameStore((s) => s.feedPet);

  const [fed, setFed] = useState(false);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const grabbed = useSharedValue(0);

  const reportContact = () => setFed(true);

  useEffect(() => {
    if (!fed) return;
    feedPet(petId, foodId);
    Haptics.notificationAsync(reaction === 'refused' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once, exactly when `fed` flips true
  }, [fed]);

  const pan = Gesture.Pan()
    .enabled(!fed)
    .onBegin(() => {
      grabbed.value = withSpring(1, { damping: 12 });
    })
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
      if (!hitBox) return;
      const cx = FOOD_START_X + x.value + FOOD_SIZE / 2;
      const cy = foodStartY + y.value + FOOD_SIZE / 2;
      const inside =
        cx > hitBox.x && cx < hitBox.x + hitBox.width && cy > hitBox.y && cy < hitBox.y + hitBox.height;
      if (inside) runOnJS(reportContact)();
    })
    .onFinalize(() => {
      grabbed.value = withTiming(0, { duration: 160 });
    });

  const foodStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 + grabbed.value * 0.12 }],
  }));

  const bannerText = fed
    ? reaction === 'refused'
      ? `${def.name} отказывается от этого!`
      : `${def.name} ${def.gender === 'f' ? 'поела' : 'поел'}!`
    : `Поднесите ${food.label.toLowerCase()} к ${def.nameGenitive}`;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>{bannerText}</Text>
      </View>

      {fed ? null : (
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.food, foodStyle]}>
            {food.image ? (
              <Image source={food.image} style={styles.foodImage} resizeMode="contain" />
            ) : (
              <Text style={styles.foodEmoji}>{food.emoji}</Text>
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
  food: {
    position: 'absolute',
    left: FOOD_START_X,
    bottom: FOOD_BOTTOM,
    width: FOOD_SIZE,
    height: FOOD_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodEmoji: {
    fontSize: 46,
  },
});
