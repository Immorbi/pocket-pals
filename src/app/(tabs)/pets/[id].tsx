import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, NEED_COLORS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT } from '@/constants/theme';
import { BOND_UNLOCKS } from '@/domain/bond';
import { FOODS } from '@/domain/food';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { statusLabel } from '@/domain/statusLabels';
import { TOYS } from '@/domain/toys';
import type { PetId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

type IoniconName = keyof typeof Ionicons.glyphMap;

function StatRow({ icon, label, value, tint }: { icon: IoniconName; label: string; value: string; tint?: string }) {
  const color = tint ?? COLORS.textMuted;
  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelGroup}>
        <View style={[styles.statBadge, tint ? { backgroundColor: `${tint}1F` } : null]}>
          <Ionicons name={icon} size={15} color={color} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FavouriteRow({ label, item }: { label: string; item: { label: string; emoji: string; image?: ImageSourcePropType } }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.favouriteValue}>
        {item.image ? (
          <Image source={item.image} style={styles.favouriteIcon} resizeMode="contain" />
        ) : (
          <Text style={styles.favouriteEmoji}>{item.emoji}</Text>
        )}
        <Text style={styles.statValue}>{item.label}</Text>
      </View>
    </View>
  );
}

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: PetId }>();
  const insets = useSafeAreaInsets();
  const pet = useGameStore((s) => s.pets[id]);
  const def = PET_DEFINITIONS[id];

  if (!pet) return null;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.sm, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + SPACING.lg }}
      >
        {/* Pushed straight from the Home screen, so the stack has nothing to go back to on its
            own — the way out has to be here, and the name is already in the hero below. */}
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Назад к питомцам"
          hitSlop={12}
          style={styles.backSlot}
        >
          <Text style={styles.back}>‹ Питомцы</Text>
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.portraitWrap}>
            {def.portrait ? (
              <Image source={def.portrait} style={styles.portraitImage} resizeMode="cover" />
            ) : (
              <Text style={styles.portrait}>{def.emoji.base}</Text>
            )}
          </View>
          <Text style={styles.name}>{def.name}</Text>
        </View>

        <View style={styles.tagRow}>
          {def.personality.map((trait) => (
            <View key={trait} style={styles.tag}>
              <Text style={styles.tagText}>{trait}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <StatRow icon="restaurant" label="Голод" value={statusLabel('hunger', pet.hunger, def.gender)} tint={NEED_COLORS.hunger} />
          <StatRow icon="tennisball" label="Веселье" value={statusLabel('fun', pet.fun, def.gender)} tint={NEED_COLORS.fun} />
          <StatRow icon="heart" label="Внимание" value={statusLabel('attention', pet.attention, def.gender)} tint={NEED_COLORS.attention} />
          <StatRow icon="flash" label="Энергия" value={statusLabel('energy', pet.energy, def.gender)} tint={NEED_COLORS.energy} />
        </View>

        <View style={styles.card}>
          <FavouriteRow label="Любимая еда" item={FOODS[def.favoriteFood]} />
          <FavouriteRow label="Любимая игрушка" item={TOYS[def.favoriteToy]} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Привязанность</Text>
          <Text style={styles.bondUnlock}>{BOND_UNLOCKS[pet.bondLevel]}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backSlot: {
    paddingHorizontal: SPACING.lg,
  },
  back: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.heading,
  },
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  portraitWrap: {
    width: 112,
    height: 112,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOW.soft,
  },
  portrait: {
    fontSize: 60,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.heading,
    marginTop: SPACING.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  tagText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOW.soft,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  statLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  favouriteValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  favouriteIcon: {
    width: 30,
    height: 30,
  },
  favouriteEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bondUnlock: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
