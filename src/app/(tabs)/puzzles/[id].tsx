import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT, tabBarOverhang } from '@/constants/theme';
import { PUZZLES, PUZZLE_ORDER, type PuzzleDefinition, type PuzzleId, isComplete, pieceCount, shuffledOrder } from '@/domain/puzzles';
import { useGameStore } from '@/store/gameStore';


/** Shared empty list: a fresh `[]` from the selector would re-render on every store read. */
const NO_PIECES: number[] = [];

/**
 * Resolves a bundled image to a URL. Metro hands web a plain object with the uri already on
 * it; native needs resolveAssetSource, which react-native-web does not ship — calling it
 * blindly threw and swallowed the whole save.
 */
function assetUri(source: ImageSourcePropType): string | undefined {
  if (typeof source === 'object' && source !== null && 'uri' in source) {
    return (source as { uri?: string }).uri;
  }
  const resolve = (Image as unknown as { resolveAssetSource?: (s: ImageSourcePropType) => { uri?: string } }).resolveAssetSource;
  return resolve?.(source)?.uri;
}

/**
 * Hands the finished picture to the phone. In a browser that is a plain download; if the
 * browser ignores the download attribute the image simply opens, and it can be saved by hand.
 */
async function savePicture(def: PuzzleDefinition): Promise<boolean> {
  const uri = assetUri(def.image);
  if (!uri) return false;
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = uri;
    link.download = `${def.id}.png`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }
  const result = await Share.share({ url: uri, message: def.title });
  return result.action !== Share.dismissedAction;
}

/** One tile of the picture: an oversized image shifted behind a window the size of a piece. */
function PieceFace({ def, index, w, h }: { def: PuzzleDefinition; index: number; w: number; h: number }) {
  const col = index % def.cols;
  const row = Math.floor(index / def.cols);
  return (
    <View style={[styles.pieceFace, { width: w, height: h }]}>
      <Image
        source={def.image}
        style={{ width: w * def.cols, height: h * def.rows, marginLeft: -col * w, marginTop: -row * h }}
      />
    </View>
  );
}

function LoosePiece({
  def,
  index,
  w,
  h,
  onDrop,
}: {
  def: PuzzleDefinition;
  index: number;
  w: number;
  h: number;
  onDrop: (index: number, x: number, y: number) => void;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lift = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onBegin(() => {
      lift.value = withSpring(1, { damping: 14 });
    })
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onEnd((e) => {
      runOnJS(onDrop)(index, e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      // Always springs home: a piece that found its slot is re-rendered on the board instead.
      lift.value = withTiming(0, { duration: 160 });
      x.value = withSpring(0, { damping: 18 });
      y.value = withSpring(0, { damping: 18 });
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 + lift.value * 0.1 }],
    zIndex: lift.value > 0 ? 20 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.loose, style]}>
        <PieceFace def={def} index={index} w={w} h={h} />
      </Animated.View>
    </GestureDetector>
  );
}

export default function PuzzleBoardScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: PuzzleId }>();
  const id = (params.id && PUZZLES[params.id] ? params.id : 'night') as PuzzleId;
  const def = PUZZLES[id];

  const placed = useGameStore((s) => s.puzzles[id] ?? NO_PIECES);
  const placePiece = useGameStore((s) => s.placePuzzlePiece);
  const resetPuzzle = useGameStore((s) => s.resetPuzzle);

  // Bumped on every replay so the pieces come back in a different order, not the same pile.
  const [round, setRound] = useState(0);

  // The whole illustration is used, so the board takes its exact shape: as wide as the
  // screen allows, unless that would make it too tall to leave room for the loose pieces.
  const maxBoardHeight = height * 0.43;
  const boardWidth = Math.min(width - SPACING.lg * 2, maxBoardHeight / def.aspect);
  const boardHeight = boardWidth * def.aspect;
  const cellW = boardWidth / def.cols;
  const cellH = boardHeight / def.rows;
  // The loose pieces lie in rows below the board; a picture cut finer gets more per row so
  // the pile never grows taller than the space left under it.
  const perRow = pieceCount(id) > 12 ? 5 : 4;
  const looseW = Math.min(cellW, (width - SPACING.lg * 2 - SPACING.sm * (perRow - 1)) / perRow);
  const looseH = looseW * (cellH / cellW);

  const boardRef = useRef<View>(null);
  const boardRect = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const measureBoard = useCallback(() => {
    boardRef.current?.measureInWindow((x, y, w, h) => {
      boardRect.current = { x, y, w, h };
    });
  }, []);

  const done = isComplete(id, placed);
  const loose = shuffledOrder(id, round).filter((i) => !placed.includes(i));
  const nextId = PUZZLE_ORDER[PUZZLE_ORDER.indexOf(id) + 1];

  const toList = useCallback(() => router.replace('/(tabs)/puzzles'), []);

  const [saved, setSaved] = useState(false);
  const handleSave = useCallback(() => {
    savePicture(def).then((ok) => setSaved(ok));
  }, [def]);

  const handleAgain = useCallback(() => {
    setRound((r) => r + 1);
    setSaved(false);
    resetPuzzle(id);
  }, [id, resetPuzzle]);

  const handleDrop = useCallback(
    (index: number, dropX: number, dropY: number) => {
      const { x, y, w, h } = boardRect.current;
      if (w === 0) return;
      if (dropX < x || dropX > x + w || dropY < y || dropY > y + h) return;
      const col = Math.floor(((dropX - x) / w) * def.cols);
      const row = Math.floor(((dropY - y) / h) * def.rows);
      const slot = row * def.cols + col;
      if (slot !== index) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      placePiece(id, index);
    },
    [def.cols, def.rows, id, placePiece]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.topRow}>
        <Pressable onPress={toList} hitSlop={12} accessibilityRole="button" accessibilityLabel="Все пазлы" style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.heading} />
          <Text style={styles.backLabel}>Пазлы</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{def.title}</Text>
        <Text style={styles.counter}>
          {placed.length}/{pieceCount(id)}
        </Text>
      </View>

      <View
        ref={boardRef}
        onLayout={measureBoard}
        style={[styles.board, { width: boardWidth, height: boardHeight }]}
      >
        {Array.from({ length: pieceCount(id) }, (_, i) => {
          const col = i % def.cols;
          const row = Math.floor(i / def.cols);
          const slotStyle = { left: col * cellW, top: row * cellH, width: cellW, height: cellH };
          if (!placed.includes(i)) return <View key={i} style={[styles.slot, slotStyle]} />;
          return (
            <Animated.View key={i} entering={FadeIn.duration(180)} style={[styles.slotFilled, slotStyle]}>
              <PieceFace def={def} index={i} w={cellW} h={cellH} />
            </Animated.View>
          );
        })}
      </View>

      {done ? (
        <Animated.View entering={FadeIn.delay(180)} style={styles.finished}>
          <Text style={styles.reward}>{def.reward}</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleSave}
            accessibilityRole="button"
          >
            <Ionicons name={saved ? 'checkmark' : 'download-outline'} size={18} color={COLORS.onPrimary} />
            <Text style={styles.primaryLabel}>{saved ? 'Сохранено' : 'Сохранить на устройство'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleAgain}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={18} color={COLORS.heading} />
            <Text style={styles.secondaryLabel}>Собрать заново</Text>
          </Pressable>

          {nextId ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.replace({ pathname: '/(tabs)/puzzles/[id]', params: { id: nextId } })}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryLabel}>Собрать следующую</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.heading} />
            </Pressable>
          ) : null}

          <Pressable onPress={toList} hitSlop={8} accessibilityRole="button">
            <Text style={styles.quietLabel}>Выйти к списку</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <>
          <Text style={styles.hint}>Перетащи кусочек на своё место</Text>
          <View style={[styles.tray, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + tabBarOverhang(width) + SPACING.sm }]}>
            {loose.map((index) => (
              <LoosePiece key={index} def={def} index={index} w={looseW} h={looseH} onDrop={handleDrop} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.heading,
    marginLeft: -2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  title: {
    flex: 1,
    textAlign: 'right',
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: COLORS.heading,
  },
  counter: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  board: {
    backgroundColor: COLORS.cardMuted,
    overflow: 'hidden',
    ...SHADOW.soft,
  },
  slot: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotFilled: {
    position: 'absolute',
  },
  pieceFace: {
    overflow: 'hidden',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  finished: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  reward: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.heading,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    ...SHADOW.soft,
  },
  primaryLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.onPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    ...SHADOW.soft,
  },
  secondaryLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.heading,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  allDone: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  quietLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textMuted,
    paddingVertical: SPACING.sm,
  },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  loose: {
    ...SHADOW.soft,
  },
});
