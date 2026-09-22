import { Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, SPACING, TAB_BAR_HEIGHT, TAB_BAR_PAPER_COLOR, tabBarOverhang, tabBarPaperHeight } from '@/constants/theme';
import { useUiStore, type SheetName } from '@/store/uiStore';

const PAPER = require('../../../assets/images/tabbar-paper.png');

const ICONS = {
  food: require('../../../assets/images/items/food-bone-biscuit.png'),
  play: require('../../../assets/images/items/toy-ball.png'),
  puzzle: require('../../../assets/images/icons/puzzle.png'),
} satisfies Record<string, ImageSourcePropType>;

/**
 * Drawn at the art's own proportions so the tears keep their shape whatever the screen: the
 * strip hangs from the top of the bar by exactly the height of its ragged edge, and plain
 * paper colour fills the rest of the bar below it (a tall home-indicator area, say).
 */
function PaperBackground() {
  const { width } = useWindowDimensions();
  const overhang = tabBarOverhang(width);
  return (
    <View style={[styles.paperWrap, { top: -overhang }]} pointerEvents="none">
      <View style={[styles.paperFill, { top: overhang }]} />
      <Image source={PAPER} style={{ width, height: tabBarPaperHeight(width) }} />
    </View>
  );
}

function BarItem({ icon, label, active, onPress }: { icon: ImageSourcePropType; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={styles.item}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Image source={icon} style={styles.icon} resizeMode="contain" />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Two of the three are actions rather than places — feeding and playing open a sheet over
 * whatever is on screen — so the bar is written by hand instead of being generated from the
 * navigator's routes. Only the one that really is a destination lights up.
 */
interface TabBarProps {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
}

function PaperTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const onPuzzles = state.routes[state.index]?.name === 'puzzles';

  const actOnHome = (sheet: SheetName) => {
    // The sheets belong to the Home screen, so come back to it first.
    if (onPuzzles) navigation.navigate('index');
    openSheet(sheet);
  };

  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      <PaperBackground />
      <BarItem icon={ICONS.food} label="Еда" onPress={() => actOnHome('food')} />
      <BarItem icon={ICONS.play} label="Играть" onPress={() => actOnHome('play')} />
      <BarItem icon={ICONS.puzzle} label="Пазлы" active={onPuzzles} onPress={() => navigation.navigate('puzzles')} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PaperTabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="puzzles" />
      {/* Reached from the pet's name on the Home screen, not from the bar. */}
      <Tabs.Screen name="pets" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: SPACING.xs,
  },
  icon: {
    width: 28,
    height: 28,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.text,
  },
  labelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
  },
  paperWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  paperFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TAB_BAR_PAPER_COLOR,
  },
});
