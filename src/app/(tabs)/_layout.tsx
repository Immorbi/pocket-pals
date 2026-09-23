import { Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, SPACING, TAB_BAR_HEIGHT, TAB_BAR_PAPER_COLOR, tabBarOverhang, tabBarPaperHeight } from '@/constants/theme';
import { useUiStore, type SheetName } from '@/store/uiStore';

const PAPER = require('../../../assets/images/tabbar-paper.png');

// Own icons, distinct from the actual food/toy artwork shown inside the sheets — a dog-treat
// biscuit or a single ball would misrepresent what tapping the tab actually opens.
const ICONS = {
  pets: require('../../../assets/images/icons/pets.png'),
  food: require('../../../assets/images/icons/food.png'),
  play: require('../../../assets/images/icons/play.png'),
  games: require('../../../assets/images/icons/checkers.png'),
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
 * Two of the four are actions rather than places — feeding and playing open a sheet over the
 * animals — so the bar is written by hand instead of being generated from the navigator's
 * routes. Only the two that really are destinations light up.
 */
interface TabBarProps {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
}

function PaperTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const openSheet = useUiStore((s) => s.openSheet);
  const route = state.routes[state.index]?.name;
  const onHome = route === 'index';

  const actOnHome = (sheet: SheetName) => {
    // The sheets are rendered by the Home screen, so wherever we are, go back to the animals
    // first — otherwise the sheet opens on a screen that never draws it.
    if (!onHome) navigation.navigate('index');
    openSheet(sheet);
  };

  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      <PaperBackground />
      <BarItem icon={ICONS.pets} label="Питомцы" active={onHome} onPress={() => navigation.navigate('index')} />
      <BarItem icon={ICONS.food} label="Еда" onPress={() => actOnHome('food')} />
      <BarItem icon={ICONS.play} label="Играть" onPress={() => actOnHome('play')} />
      <BarItem icon={ICONS.games} label="Игры" active={route === 'games'} onPress={() => navigation.navigate('games')} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PaperTabBar {...(props as unknown as TabBarProps)} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="puzzles" options={{ href: null }} />
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
    // Приподнято над рваным краем бумаги: нижний отступ больше верхнего, и центрированное
    // содержимое уезжает вверх на половину разницы.
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  icon: {
    width: 38,
    height: 38,
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
