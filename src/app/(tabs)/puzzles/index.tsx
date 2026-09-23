import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaggerIn } from '@/components/ui/StaggerIn';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT } from '@/constants/theme';
import { PUZZLES, PUZZLE_ORDER, isComplete, isUnlocked, pieceCount } from '@/domain/puzzles';
import { useGameStore } from '@/store/gameStore';

export default function PuzzlesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useGameStore((s) => s.puzzles);
  const everDone = useGameStore((s) => s.puzzlesDone);
  const thumb = Math.min(width - SPACING.lg * 2, 420);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + SPACING.xl }}
    >
      {/* Reached from the Games card, which is not a tab of its own — so the way back has to
          live on the screen itself. */}
      <Pressable
        onPress={() => router.replace('/(tabs)/games')}
        accessibilityRole="button"
        accessibilityLabel="Все игры"
        hitSlop={12}
        style={styles.backSlot}
      >
        <Text style={styles.back}>‹ Игры</Text>
      </Pressable>
      <Text style={styles.header}>Пазлы</Text>
      <Text style={styles.subheader}>
        {PUZZLE_ORDER.length > 1
          ? 'Собирай картинки по кусочкам — каждая следующая открывается за собранную.'
          : 'Собирай картинку по кусочкам.'}
      </Text>

      {PUZZLE_ORDER.map((id, i) => {
        const def = PUZZLES[id];
        const placed = progress[id] ?? [];
        const total = pieceCount(id);
        const done = isComplete(id, placed);
        const collected = everDone.includes(id);
        const open = isUnlocked(id, everDone);

        const card = (
          <View style={styles.card}>
            <View style={[styles.thumbWrap, { width: thumb, height: thumb }]}>
              {/* Grey until the last piece lands — the colour is the reward. */}
              <Image source={collected ? def.image : def.preview} style={styles.thumb} resizeMode="cover" />
              {open ? null : (
                <View style={styles.lockVeil}>
                  <Ionicons name="lock-closed" size={26} color={COLORS.card} />
                  <Text style={styles.lockText}>Сначала собери предыдущую</Text>
                </View>
              )}
            </View>
            <View style={styles.cardFoot}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{def.title}</Text>
                <Text style={styles.cardMeta}>
                  {done
                    ? def.reward
                    : collected && placed.length === 0
                      ? 'Собрана — можно собрать заново'
                      : `${placed.length} из ${total} кусочков`}
                </Text>
              </View>
              {collected ? <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} /> : null}
            </View>
          </View>
        );

        return (
          <StaggerIn key={id} delay={i * 70} style={styles.cardSlot}>
            {open ? (
              <Link href={{ pathname: '/(tabs)/puzzles/[id]', params: { id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={`Открыть пазл «${def.title}»`}>
                  {card}
                </Pressable>
              </Link>
            ) : (
              card
            )}
          </StaggerIn>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backSlot: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  back: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.heading,
  },
  header: {
    fontFamily: FONTS.headingExtra,
    fontSize: 30,
    color: COLORS.heading,
    paddingHorizontal: SPACING.lg,
  },
  subheader: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  cardSlot: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.soft,
  },
  thumbWrap: {
    backgroundColor: COLORS.cardMuted,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  lockVeil: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(61, 35, 23, 0.45)',
  },
  lockText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.card,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.heading,
  },
  cardMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
