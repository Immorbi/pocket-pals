import type { TimeOfDay } from '@/domain/types';

export interface RoomTheme {
  /** [0] is used as the color wash tinted over the fixed backyard photo; [1] is unused today. */
  sky: [string, string];
  accent: string;
}

export const ROOM_THEMES: Record<TimeOfDay, RoomTheme> = {
  morning: {
    sky: ['#FFE8C7', '#FFF3E0'],
    accent: '#FB923C',
  },
  day: {
    sky: ['#BFE6FF', '#EAF7FF'],
    accent: '#5EC0E8',
  },
  evening: {
    sky: ['#FFB199', '#FFD6A5'],
    accent: '#F97316',
  },
  night: {
    sky: ['#1B2447', '#2E3B6B'],
    accent: '#8C9EFF',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

// One side margin for text and controls across every screen, so headings, the greeting and
// the action buttons all start on the same line however the screen behind them changes.
export const GUTTER = SPACING.lg;

// White copy on the Home screen sits straight on the illustration, where it crosses sky,
// house and grass. No single colour clears 4.5:1 against all three, so the text carries its
// own soft shadow — that is what makes it readable, not the opacity.
export const TEXT_ON_ART = {
  textShadowColor: 'rgba(26, 16, 10, 0.55)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

// The tab bar floats over the screens so its torn-paper edge sits on the artwork rather than
// on a flat strip — every screen must reserve this much room (plus the safe-area inset) below
// its content so nothing hides underneath it.
export const TAB_BAR_HEIGHT = 62;

// The torn-paper strip is one drawing: the ragged edge runs down its first 109 of 281 rows,
// everything below is plain paper. Scaling it to the bar's box squashed the tears — by a
// quarter on the web and the other way on a phone with a home indicator — so it is drawn at
// its own proportions instead, with the paper colour filling whatever is left below it.
const TAB_BAR_PAPER_RATIO = 281 / 1000;
const TAB_BAR_TEAR_RATIO = 109 / 1000;
export const TAB_BAR_PAPER_COLOR = '#F6EDE0';

/** Height of the whole strip when drawn across a screen this wide. */
export function tabBarPaperHeight(width: number): number {
  return width * TAB_BAR_PAPER_RATIO;
}

/** How far the ragged edge rises above the bar — the room a screen must leave above it. */
export function tabBarOverhang(width: number): number {
  return Math.round(width * TAB_BAR_TEAR_RATIO);
}

// Generous, claymorphism-leaning radii — chunky and toy-like rather than sharp.
export const RADIUS = { sm: 12, md: 20, lg: 28, pill: 999 };

// Semantic color tokens (design system: "Pet Tech App" palette — playful orange + trust blue).
// Never reference raw hex outside this file; every screen imports from here.
export const COLORS = {
  primary: '#F97316',
  onPrimary: '#0F172A',
  secondary: '#FB923C',
  onSecondary: '#0F172A',
  accent: '#2563EB',
  onAccent: '#FFFFFF',
  destructive: '#DC2626',

  background: '#FFF7ED',
  card: '#FFFFFF',
  cardMuted: '#FCEEE0',

  text: '#43291C',
  // Darkened from #93765F: that read 4.2:1 on a card and 4.0:1 on the app background, under
  // the 4.5:1 minimum for body text. Same hue and saturation, two steps down in lightness.
  textMuted: '#826854',
  // Deep ink brown rather than the brand orange: headings carry weight through size and
  // contrast, leaving orange free to mean "this is interactive".
  heading: '#3D2317',

  border: '#FED7AA',
  ring: '#F97316',
};

// Each need gets its own identity instead of one flat muted gray — small dose of color
// variety that still reads as one family (used on the pet profile stat icons/values).
export const NEED_COLORS = {
  hunger: '#F97316', // orange — matches the Food action
  fun: '#16A34A', // fresh green — playful, alive
  attention: '#EC4899', // warm pink — affection
  energy: '#2563EB', // electric blue — matches the flash icon
};

// Font family keys map to the loaded Google Font postscript names (see app/_layout.tsx).
// Both faces are drawn with Cyrillic as a first-class script, so Russian keeps its own
// proportions instead of being adapted from Latin. Onest carries the headings; Golos Text
// is built for interface copy and stays legible down to the small stat labels.
export const FONTS = {
  heading: 'Onest_700Bold',
  headingExtra: 'Onest_800ExtraBold',
  /** Pencil handwriting — for the pets' note, not for interface copy. */
  hand: 'Pangolin_400Regular',
  handBold: 'Pangolin_400Regular',
  body: 'GolosText_400Regular',
  bodyMedium: 'GolosText_500Medium',
  bodyBold: 'GolosText_700Bold',
};

export const TYPE = {
  hero: { fontFamily: FONTS.headingExtra, fontSize: 28, lineHeight: 34 },
  display: { fontFamily: FONTS.heading, fontSize: 26, lineHeight: 32 },
  title: { fontFamily: FONTS.heading, fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: FONTS.bodyMedium, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: FONTS.bodyBold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: FONTS.bodyMedium, fontSize: 12, lineHeight: 16 },
};

// Soft, single-layer shadow (RN can't do true inset shadows cheaply) — kept subtle so it
// reads as "resting on the table" rather than heavy skeuomorphism.
export const SHADOW = {
  soft: {
    shadowColor: '#7A4A21',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: {
    shadowColor: '#7A4A21',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};
