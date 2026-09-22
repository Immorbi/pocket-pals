import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '@/constants/theme';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { TOYS } from '@/domain/toys';
import type { PetId, ToyId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

interface MiniGameOverlayProps {
  toyId: ToyId;
  petId: PetId;
  onClose: () => void;
}

const AREA_HEIGHT = 260;

export function MiniGameOverlay({ toyId, petId, onClose }: MiniGameOverlayProps) {
  const toy = TOYS[toyId];
  const def = PET_DEFINITIONS[petId];
  const startPlaying = useGameStore((s) => s.startPlaying);
  const finishPlaying = useGameStore((s) => s.finishPlaying);

  const [secondsLeft, setSecondsLeft] = useState(toy.durationSeconds);
  const finished = secondsLeft <= 0;
  const hasFinishedRef = useRef(false);
  const areaWidth = Dimensions.get('window').width - SPACING.lg * 2;

  const toyX = useSharedValue(areaWidth / 2 - 20);
  const toyY = useSharedValue(AREA_HEIGHT / 2 - 20);
  const petX = useSharedValue(areaWidth / 2 - 22);
  const petY = useSharedValue(AREA_HEIGHT / 2 - 22);
  const entrance = useSharedValue(0);

  useEffect(() => {
    startPlaying(petId);
    entrance.value = withSpring(1, { damping: 14, stiffness: 220 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId, startPlaying]);

  useEffect(() => {
    if (!finished || hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    finishPlaying(petId, toyId);
    const timer = setTimeout(onClose, 1300);
    return () => clearTimeout(timer);
  }, [finished, petId, toyId, finishPlaying, onClose]);

  useEffect(() => {
    if (finished) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, finished]);

  const followToy = () => {
    petX.value = withSpring(toyX.value + 2, { damping: 12 });
    petY.value = withSpring(toyY.value + 2, { damping: 12 });
  };

  const panGesture = Gesture.Pan().onChange((e) => {
    toyX.value = Math.min(Math.max(0, toyX.value + e.changeX), areaWidth - 40);
    toyY.value = Math.min(Math.max(0, toyY.value + e.changeY), AREA_HEIGHT - 40);
    runOnJS(followToy)();
  });

  const toyStyle = useAnimatedStyle(() => ({ transform: [{ translateX: toyX.value }, { translateY: toyY.value }] }));
  const petStyle = useAnimatedStyle(() => ({ transform: [{ translateX: petX.value }, { translateY: petY.value }] }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.9 + entrance.value * 0.1 }],
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.title}>{finished ? 'Отлично!' : `Игра с ${def.nameInstrumental}`}</Text>

        {finished ? (
          <View style={styles.rewardBox}>
            <Text style={styles.rewardEmoji}>{toy.emoji} 🎉</Text>
            <Text style={styles.rewardText}>
              Веселье +{toy.funReward}
              {toy.attentionReward ? ` · Внимание +${toy.attentionReward}` : ''}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.timer}>{secondsLeft} с</Text>
            <GestureDetector gesture={panGesture}>
              <View style={[styles.playArea, { height: AREA_HEIGHT }]}>
                {def.playSprite ? (
                  <Animated.View style={[styles.petSprite, petStyle]}>
                    <Image source={def.playSprite} style={styles.petSpriteImage} resizeMode="contain" />
                  </Animated.View>
                ) : (
                  <Animated.Text style={[styles.petEmoji, petStyle]}>{def.emoji.PLAYING ?? def.emoji.base}</Animated.Text>
                )}
                <Animated.Text style={[styles.toyEmoji, toyStyle]}>{toy.emoji}</Animated.Text>
              </View>
            </GestureDetector>
            <Text style={styles.hint}>Двигайте пальцем — {def.name} будет гоняться следом</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.heading,
    marginBottom: SPACING.sm,
  },
  timer: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  playArea: {
    width: '100%',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardMuted,
    overflow: 'hidden',
  },
  petEmoji: {
    position: 'absolute',
    fontSize: 40,
  },
  petSprite: {
    position: 'absolute',
    width: 72,
    height: 72,
  },
  petSpriteImage: {
    width: '100%',
    height: '100%',
  },
  toyEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  rewardBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  rewardEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  rewardText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.heading,
  },
});
