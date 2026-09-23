import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaggerIn } from '@/components/ui/StaggerIn';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT, tabBarOverhang } from '@/constants/theme';
import { BOND_LEVEL_NAMES } from '@/domain/bond';
import { render } from '@/domain/chatter';
import {
  applyCheckerMove,
  BOARD_SIZE,
  createCheckerBoard,
  legalMoves,
  pickPetMove,
  PLAY_STYLE,
  type CheckerBoard,
  type CheckerPlayer,
} from '@/domain/checkers';
import { PET_DEFINITIONS, PET_ORDER } from '@/domain/petDefinitions';
import { checkersLine } from '@/domain/reactionPhrases';
import type { PetId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

const LIGHT_CHECKER = require('../../../../assets/images/games/checker-light.png');
const DARK_CHECKER = require('../../../../assets/images/games/checker-dark.png');

/**
 * The squares are drawn here rather than taken from the painted board art: that picture is a
 * hand-drawn 7×6 grid, so no overlay of the real 8×8 board could ever line its pieces up with
 * the paint. These are its own two colours, sampled out of it and taken down a step so the
 * board still belongs to the same set but sits deeper against the cream page behind it.
 */
const SQUARE_DARK = '#5982B9';
const SQUARE_LIGHT = '#E8DAC5';

/** You play the blue pieces at the bottom; the animal plays the cream ones across the board. */
const YOU: CheckerPlayer = 'dark';
const PET: CheckerPlayer = 'light';

/** Long enough to read as the animal thinking, short enough not to feel like waiting. */
const PET_THINK_MS = 850;

type Cell = { row: number; col: number };
/** Pick who you are playing, read up on them, then play — one screen, three steps. */
type Stage = 'pick' | 'brief' | 'game';

function sameCell(a: Cell | null, b: Cell) {
  return a?.row === b.row && a.col === b.col;
}

function TrickyDots({ level }: { level: number }) {
  return (
    <View style={styles.dots}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={[styles.dot, step <= level && styles.dotOn]} />
      ))}
    </View>
  );
}

export default function CheckersScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pets = useGameStore((s) => s.pets);

  const [stage, setStage] = useState<Stage>('pick');
  const [opponentId, setOpponentId] = useState<PetId>(PET_ORDER[0]);
  const [board, setBoard] = useState<CheckerBoard>(createCheckerBoard);
  const [turn, setTurn] = useState<CheckerPlayer>(YOU);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [mustContinue, setMustContinue] = useState<Cell | null>(null);
  const [winner, setWinner] = useState<CheckerPlayer | null>(null);
  const [petLine, setPetLine] = useState<string | null>(null);

  const opponent = PET_DEFINITIONS[opponentId];
  const style = PLAY_STYLE[opponent.checkersStyle];

  // Square board, so every cell is the same square and a piece always lands dead centre.
  const boardSize = Math.floor(Math.min(width - SPACING.lg * 2, 400) / BOARD_SIZE) * BOARD_SIZE;
  const cellSize = boardSize / BOARD_SIZE;

  const yourMoves = useMemo(
    () => (stage === 'game' && turn === YOU && !winner ? legalMoves(board, YOU, mustContinue) : []),
    [board, mustContinue, stage, turn, winner]
  );
  const activeMoves = selected
    ? yourMoves.filter((move) => move.from.row === selected.row && move.from.col === selected.col)
    : [];

  const newGame = useCallback(() => {
    setBoard(createCheckerBoard());
    setTurn(YOU);
    setSelected(null);
    setMustContinue(null);
    setWinner(null);
    setPetLine(null);
  }, []);

  const finishTurn = useCallback((nextBoard: CheckerBoard, mover: CheckerPlayer) => {
    const next = mover === YOU ? PET : YOU;
    setBoard(nextBoard);
    setSelected(null);
    setMustContinue(null);
    if (!legalMoves(nextBoard, next).length) {
      setWinner(mover);
      setPetLine(checkersLine(PET_DEFINITIONS[opponentId].gender, mover === YOU ? 'lost' : 'won'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setTurn(next);
  }, [opponentId]);

  // The animal's turn: think for a beat, then play its own way — see pickPetMove.
  useEffect(() => {
    if (stage !== 'game' || turn !== PET || winner) return;
    const timer = setTimeout(() => {
      let working = board;
      let from: Cell | null = null;
      let tookOne = false;

      // Play out a whole chain of jumps in one go, the way a person would.
      for (let step = 0; step < BOARD_SIZE; step++) {
        const move = pickPetMove(working, PET, opponent.checkersStyle, from);
        if (!move) break;
        working = applyCheckerMove(working, move);
        if (!move.capture) break;
        tookOne = true;
        const more = legalMoves(working, PET, move.to).filter((candidate) => candidate.capture);
        if (!more.length) break;
        from = move.to;
      }

      if (working === board) {
        setWinner(YOU);
        setPetLine(checkersLine(opponent.gender, 'lost'));
        return;
      }
      if (tookOne) {
        setPetLine(checkersLine(opponent.gender, 'takes'));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      finishTurn(working, PET);
    }, PET_THINK_MS);
    return () => clearTimeout(timer);
  }, [board, finishTurn, opponent, stage, turn, winner]);

  const tapCell = (cell: Cell) => {
    if (winner || turn !== YOU) return;

    const move = activeMoves.find((candidate) => candidate.to.row === cell.row && candidate.to.col === cell.col);
    if (move) {
      const nextBoard = applyCheckerMove(board, move);
      if (move.capture) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPetLine(checkersLine(opponent.gender, 'lostPiece'));
        const followUps = legalMoves(nextBoard, YOU, move.to).filter((candidate) => candidate.capture);
        if (followUps.length) {
          setBoard(nextBoard);
          setSelected(move.to);
          setMustContinue(move.to);
          return;
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPetLine(null);
      }
      finishTurn(nextBoard, YOU);
      return;
    }

    if (yourMoves.some((candidate) => candidate.from.row === cell.row && candidate.from.col === cell.col)) {
      setSelected(cell);
      Haptics.selectionAsync();
    } else if (!mustContinue) {
      setSelected(null);
    }
  };

  const bottomInset = insets.bottom + TAB_BAR_HEIGHT + tabBarOverhang(width) + SPACING.lg;

  // ── Step one: who are we playing? ────────────────────────────────────────────────────
  if (stage === 'pick') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.md, paddingBottom: bottomInset }}
      >
        <Pressable onPress={() => router.replace('/(tabs)/games')} accessibilityRole="button" accessibilityLabel="Все игры" hitSlop={12} style={styles.backSlot}>
          <Text style={styles.back}>‹ Игры</Text>
        </Pressable>
        <Text style={styles.header}>Шашки</Text>
        <Text style={styles.subheader}>Выбери, с кем сыграть — у каждого своя манера.</Text>

        {PET_ORDER.map((id, i) => {
          const def = PET_DEFINITIONS[id];
          const petStyle = PLAY_STYLE[def.checkersStyle];
          return (
            <StaggerIn key={id} delay={i * 70} style={styles.rowSlot}>
              <Pressable
                onPress={() => {
                  setOpponentId(id);
                  setStage('brief');
                  Haptics.selectionAsync();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Выбрать соперника: ${def.name}`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                {def.portrait ? (
                  <Image source={def.portrait} style={styles.rowAvatar} resizeMode="contain" />
                ) : (
                  <Text style={styles.rowEmoji}>{def.emoji.base}</Text>
                )}
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>{def.name}</Text>
                  <Text style={styles.rowStyle}>{render(petStyle.label, def.gender)}</Text>
                </View>
                <TrickyDots level={petStyle.tricky} />
              </Pressable>
            </StaggerIn>
          );
        })}
      </ScrollView>
    );
  }

  // ── Step two: what are they like across the board? ───────────────────────────────────
  if (stage === 'brief') {
    const pet = pets[opponentId];
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.md, paddingBottom: bottomInset }}
      >
        <Pressable onPress={() => setStage('pick')} accessibilityRole="button" accessibilityLabel="Выбрать другого соперника" hitSlop={12} style={styles.backSlot}>
          <Text style={styles.back}>‹ Соперник</Text>
        </Pressable>

        <View style={styles.briefCard}>
          {opponent.portrait ? (
            <Image source={opponent.portrait} style={styles.briefPortrait} resizeMode="contain" />
          ) : (
            <Text style={styles.briefEmoji}>{opponent.emoji.base}</Text>
          )}
          <Text style={styles.briefName}>{opponent.name}</Text>
          <Text style={styles.briefStyle}>{render(style.label, opponent.gender)}</Text>
          <Text style={styles.briefBlurb}>{style.blurb}</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Хитрость в игре</Text>
            <TrickyDots level={style.tricky} />
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Вы с {opponent.gender === 'f' ? 'ней' : 'ним'}</Text>
            <Text style={styles.statValue}>{BOND_LEVEL_NAMES[pet.bondLevel]}</Text>
          </View>

          <Text style={styles.traitsLabel}>Характер</Text>
          <View style={styles.traits}>
            {opponent.personality.map((trait) => (
              <View key={trait} style={styles.trait}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => {
            newGame();
            setStage('game');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Начать партию с ${opponent.nameInstrumental}`}
          style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        >
          <Text style={styles.playButtonText}>Играть</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Step three: the game itself. ─────────────────────────────────────────────────────
  const status = winner
    ? winner === YOU
      ? 'Ты выиграла!'
      : `${opponent.name} ${opponent.gender === 'f' ? 'выиграла' : 'выиграл'}!`
    : turn === PET
      ? `${opponent.name} думает…`
      : mustContinue
        ? 'Бей дальше этой же шашкой'
        : yourMoves.some((move) => move.capture)
          ? 'Можно бить — взятие обязательно'
          : 'Твой ход';

  return (
    <View style={[styles.container, styles.gameContainer, { paddingTop: insets.top + SPACING.sm, paddingBottom: bottomInset }]}>
      <View style={styles.gameTopRow}>
        <Pressable onPress={() => setStage('brief')} accessibilityRole="button" accessibilityLabel="Назад к сопернику" hitSlop={12}>
          <Text style={styles.back}>‹ {opponent.name}</Text>
        </Pressable>
        <Pressable onPress={newGame} accessibilityRole="button" accessibilityLabel="Начать партию заново" hitSlop={12}>
          <Text style={styles.reset}>Заново</Text>
        </Pressable>
      </View>

      {/* Who you are up against stays in view, with whatever they have to say about it. */}
      <View style={styles.opponentBar}>
        {opponent.portrait ? (
          <Image source={opponent.portrait} style={styles.opponentAvatar} resizeMode="contain" />
        ) : (
          <Text style={styles.rowEmoji}>{opponent.emoji.base}</Text>
        )}
        <View style={styles.opponentText}>
          <Text style={styles.opponentName}>{opponent.name}</Text>
          <Text style={styles.opponentLine} numberOfLines={1}>
            {petLine ?? render(style.label, opponent.gender)}
          </Text>
        </View>
      </View>

      <View style={[styles.boardShell, { width: boardSize, height: boardSize }]}>
        <View style={styles.grid}>
          {board.map((row, rowIndex) => row.map((piece, colIndex) => {
            const cell = { row: rowIndex, col: colIndex };
            const destination = activeMoves.some((move) => move.to.row === rowIndex && move.to.col === colIndex);
            // Pieces live on the dark squares, so those are the ones painted blue.
            const dark = (rowIndex + colIndex) % 2 === 1;
            return (
              <Pressable
                key={`${rowIndex}-${colIndex}`}
                onPress={() => tapCell(cell)}
                accessibilityRole="button"
                accessibilityLabel={piece ? `${piece.player === YOU ? 'Твоя' : `Шашка ${opponent.nameGenitive}`}${piece.king ? ', дамка' : ''}, ряд ${rowIndex + 1}, клетка ${colIndex + 1}` : `Пустая клетка, ряд ${rowIndex + 1}, клетка ${colIndex + 1}`}
                style={[
                  styles.cell,
                  { left: colIndex * cellSize, top: rowIndex * cellSize, width: cellSize, height: cellSize, backgroundColor: dark ? SQUARE_DARK : SQUARE_LIGHT },
                ]}
              >
                {sameCell(selected, cell) ? <View style={styles.selectedRing} /> : null}
                {piece ? (
                  <>
                    {/* A king is the usual two checkers stacked, drawn with the same art. */}
                    {piece.king ? (
                      <Image source={piece.player === PET ? LIGHT_CHECKER : DARK_CHECKER} style={[styles.piece, styles.kingUnder]} resizeMode="contain" />
                    ) : null}
                    <Image source={piece.player === PET ? LIGHT_CHECKER : DARK_CHECKER} style={[styles.piece, piece.king && styles.kingTop]} resizeMode="contain" />
                  </>
                ) : null}
                {/* Where this piece may go: a quiet dot, so the board stays the loud thing. */}
                {destination ? <View style={styles.destinationDot} /> : null}
              </Pressable>
            );
          }))}
        </View>
      </View>

      <View style={styles.statusBar}>
        <Image source={turn === PET && !winner ? LIGHT_CHECKER : DARK_CHECKER} style={styles.statusPiece} resizeMode="contain" />
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gameContainer: { alignItems: 'center' },

  backSlot: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xs },
  back: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.heading },
  reset: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.accent },

  header: { paddingHorizontal: SPACING.lg, fontFamily: FONTS.headingExtra, fontSize: 30, color: COLORS.heading },
  subheader: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textMuted,
  },

  // Step one — a row per animal.
  rowSlot: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  rowPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  rowAvatar: { width: 56, height: 56 },
  rowEmoji: { fontSize: 34 },
  rowText: { flex: 1 },
  rowName: { fontFamily: FONTS.heading, fontSize: 19, color: COLORS.heading },
  rowStyle: { marginTop: 2, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted },

  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.cardMuted },
  dotOn: { backgroundColor: COLORS.primary },

  // Step two — the animal's card.
  briefCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  briefPortrait: { width: 120, height: 120 },
  briefEmoji: { fontSize: 64 },
  briefName: { marginTop: SPACING.sm, fontFamily: FONTS.headingExtra, fontSize: 26, color: COLORS.heading },
  briefStyle: { marginTop: 2, fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.primary },
  briefBlurb: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardMuted,
  },
  statLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted },
  statValue: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.heading },
  traitsLabel: {
    alignSelf: 'stretch',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  traits: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  trait: { borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 4, backgroundColor: COLORS.cardMuted },
  traitText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.text },

  playButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  playButtonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  playButtonText: { fontFamily: FONTS.bodyBold, fontSize: 17, color: COLORS.onPrimary },

  // Step three — the board.
  gameTopRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  opponentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    ...SHADOW.soft,
  },
  opponentAvatar: { width: 40, height: 40 },
  opponentText: { flex: 1 },
  opponentName: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.heading },
  opponentLine: { marginTop: 1, fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted },

  boardShell: { borderRadius: RADIUS.sm, overflow: 'hidden', ...SHADOW.soft },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  // Quiet marks rather than filled boxes — the pieces should stay the loudest thing on the board.
  selectedRing: { position: 'absolute', width: '92%', height: '92%', borderRadius: RADIUS.pill, borderWidth: 3, borderColor: COLORS.primary },
  destinationDot: { position: 'absolute', width: '26%', height: '26%', borderRadius: RADIUS.pill, backgroundColor: 'rgba(255, 255, 255, 0.72)' },
  piece: { position: 'absolute', width: '84%', height: '84%' },
  kingUnder: { transform: [{ translateY: 4 }] },
  kingTop: { transform: [{ translateY: -4 }] },

  statusBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  statusPiece: { width: 26, height: 26 },
  statusText: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.heading },
});
