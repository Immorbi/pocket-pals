import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, TAB_BAR_HEIGHT, TAB_BAR_PAPER_COLOR, tabBarOverhang, tabBarPaperHeight } from '@/constants/theme';

const PAPER = require('../../../assets/images/tabbar-paper.png');

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

const ICONS = {
  home: require('../../../assets/images/icons/home.png'),
  paw: require('../../../assets/images/icons/paw.png'),
  puzzle: require('../../../assets/images/icons/puzzle.png'),
} satisfies Record<string, ImageSourcePropType>;

function TabIcon({ focused, source }: { focused: boolean; source: ImageSourcePropType }) {
  return (
    <Image
      source={source}
      style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarBackground: () => <PaperBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontFamily: FONTS.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={ICONS.home} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Питомцы',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={ICONS.paw} />,
        }}
      />
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Пазлы',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={ICONS.puzzle} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  paperWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  // Sits behind the strip, starting below the tears, so no background shows through under it.
  paperFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TAB_BAR_PAPER_COLOR,
  },
});
