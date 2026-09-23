import type { ImageSourcePropType } from 'react-native';

export type PuzzleId = 'night' | 'sunrise' | 'blanket' | 'sunbeam' | 'nap' | 'cuddle' | 'playtime';

export interface PuzzleDefinition {
  id: PuzzleId;
  title: string;
  /** How the picture is cut up. The whole illustration is used, so these follow its shape. */
  cols: number;
  rows: number;
  /**
   * Height divided by width of the picture. It always equals rows/cols, so every piece comes
   * out an equal square — pictures are trimmed to a matching frame rather than cut unevenly.
   */
  aspect: number;
  image: ImageSourcePropType;
  /** Desaturated copy of the same picture, shown on the card until the last piece lands. */
  preview: ImageSourcePropType;
  /** Shown once the puzzle is finished. */
  reward: string;
}

export const PUZZLES: Record<PuzzleId, PuzzleDefinition> = {
  night: {
    id: 'night',
    title: 'Втроём до ночи',
    cols: 4,
    rows: 5,
    aspect: 1.25,
    image: require('../../assets/images/puzzles/night.png'),
    preview: require('../../assets/images/puzzles/night-grey.png'),
    reward: 'Все трое на одной кровати — и никто не спорит.',
  },
  sunrise: {
    id: 'sunrise',
    title: 'Джорджия и мячик',
    cols: 3,
    rows: 4,
    aspect: 4 / 3,
    image: require('../../assets/images/puzzles/sunrise.png'),
    preview: require('../../assets/images/puzzles/sunrise-grey.png'),
    reward: 'Солнце встало, мячик рядом — Джорджия довольна.',
  },
  blanket: {
    id: 'blanket',
    title: 'Лея на пледе',
    cols: 3,
    rows: 4,
    aspect: 4 / 3,
    image: require('../../assets/images/puzzles/blanket.png'),
    preview: require('../../assets/images/puzzles/blanket-grey.png'),
    reward: 'Клетчатый плед, солнце в окне — Лея как дома.',
  },
  sunbeam: {
    id: 'sunbeam',
    title: 'Варяг у окна',
    cols: 3,
    rows: 4,
    aspect: 4 / 3,
    image: require('../../assets/images/puzzles/sunbeam.png'),
    preview: require('../../assets/images/puzzles/sunbeam-grey.png'),
    reward: 'Тёплая полоска света — и спится крепче обычного.',
  },
  nap: {
    id: 'nap',
    title: 'Джорджия в лежанке',
    cols: 3,
    rows: 4,
    aspect: 4 / 3,
    image: require('../../assets/images/puzzles/nap.png'),
    preview: require('../../assets/images/puzzles/nap-grey.png'),
    reward: 'Свернулась колечком — самый крепкий сон в доме.',
  },
  cuddle: {
    id: 'cuddle',
    title: 'Варяг и Лея',
    cols: 3,
    rows: 4,
    aspect: 4 / 3,
    image: require('../../assets/images/puzzles/cuddle.png'),
    preview: require('../../assets/images/puzzles/cuddle-grey.png'),
    reward: 'Вдвоём теплее — и мириться не пришлось.',
  },
  playtime: {
    id: 'playtime',
    title: 'Варяг и Джорджия играют',
    cols: 4,
    rows: 4,
    aspect: 1,
    image: require('../../assets/images/puzzles/playtime.png'),
    preview: require('../../assets/images/puzzles/playtime-grey.png'),
    reward: 'Один поклон, один взмах хвоста — игра начинается!',
  },
};

export const PUZZLE_ORDER: PuzzleId[] = ['night', 'sunrise', 'blanket', 'sunbeam', 'nap', 'cuddle', 'playtime'];

export type PuzzleProgress = Record<PuzzleId, number[]>;

export function pieceCount(id: PuzzleId): number {
  const def = PUZZLES[id];
  return def.cols * def.rows;
}

export function isComplete(id: PuzzleId, placed: number[] | undefined): boolean {
  return (placed?.length ?? 0) >= pieceCount(id);
}

/**
 * The first picture is always open; each next one waits for the previous to have been
 * finished at least once, so taking a picture apart to build it again never re-locks anything.
 */
export function isUnlocked(id: PuzzleId, everDone: PuzzleId[]): boolean {
  const index = PUZZLE_ORDER.indexOf(id);
  if (index <= 0) return true;
  return everDone.includes(PUZZLE_ORDER[index - 1]);
}

/**
 * Deterministic shuffle, so the loose pieces keep their order across re-renders. `round`
 * changes the arrangement when the same picture is taken apart and built again.
 */
export function shuffledOrder(id: PuzzleId, round = 0): number[] {
  const order = Array.from({ length: pieceCount(id) }, (_, i) => i);
  let seed = 7 + round * 977;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 100003;
  for (let i = order.length - 1; i > 0; i--) {
    // Math.imul keeps the multiply exact at 32 bits — plain `*` overflows JS integer
    // precision here and the "shuffle" comes back barely moved.
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
