import { Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaggerIn } from '@/components/ui/StaggerIn';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT } from '@/constants/theme';
import { PUZZLE_ORDER } from '@/domain/puzzles';
import { useGameStore } from '@/store/gameStore';

const PUZZLE_ART = require('../../../../assets/images/puzzles/playtime.png');
const CHECKERS_ART = require('../../../../assets/images/games/checkers-board.png');

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const everDone = useGameStore((s) => s.puzzlesDone);
  const thumb = Math.min(width - SPACING.lg * 2, 420);

  const games = [
    {
      key: 'puzzles',
      href: '/(tabs)/puzzles' as const,
      title: 'Пазлы',
      meta: everDone.length
        ? `Собрано картинок: ${everDone.length} из ${PUZZLE_ORDER.length}`
        : 'Собирай картинки по кусочкам',
      art: PUZZLE_ART,
      // The picture already fills its frame, so it sits flush like a puzzle card.
      cover: true,
    },
    {
      key: 'checkers',
      href: '/(tabs)/games/checkers' as const,
      title: 'Шашки',
      meta: 'Сыграй партию с Леей, Варягом или Джорджией',
      art: CHECKERS_ART,
      // Hand-drawn board with ragged edges: shown whole, on the card's own paper.
      cover: false,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + SPACING.xl }}
    >
      <Text style={styles.header}>Игры</Text>
      <Text style={styles.subheader}>Выбирай, во что поиграть вместе с хвостиками.</Text>

      {games.map((game, i) => (
        <StaggerIn key={game.key} delay={i * 70} style={styles.cardSlot}>
          <Link href={game.href} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Открыть игру «${game.title}»`}>
              <View style={styles.card}>
                <View style={[styles.thumbWrap, { width: thumb, height: thumb * 0.62 }]}>
                  <Image source={game.art} style={styles.thumb} resizeMode={game.cover ? 'cover' : 'contain'} />
                </View>
                <View style={styles.cardFoot}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardMeta}>{game.meta}</Text>
                </View>
              </View>
            </Pressable>
          </Link>
        </StaggerIn>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  cardFoot: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
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
