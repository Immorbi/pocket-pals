import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, RADIUS, SHADOW, SPACING, TAB_BAR_HEIGHT } from '@/constants/theme';
import { BOND_LEVEL_NAMES } from '@/domain/bond';
import { tierFor } from '@/domain/decay';
import { PET_DEFINITIONS, PET_ORDER } from '@/domain/petDefinitions';
import type { PetId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

const TIER_LABEL: Record<string, string> = {
  happy: 'Всё отлично',
  neutral: 'Всё в порядке',
  needsAttention: 'Нужна забота',
  strongNeed: 'Очень нужна забота',
  critical: 'Срочно нужна забота',
};

export default function PetsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pets = useGameStore((s) => s.pets);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.header}>Ваши питомцы</Text>
      <FlatList
        data={PET_ORDER}
        keyExtractor={(id) => id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + SPACING.md }]}
        renderItem={({ item: id }: { item: PetId }) => {
          const def = PET_DEFINITIONS[id];
          const pet = pets[id];
          const worstTier = tierFor(Math.min(pet.hunger, pet.fun, pet.attention));
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/pets/${id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Открыть профиль: ${def.name}`}
            >
              <View style={styles.avatarWrap}>
                {def.portrait ? (
                  <Image source={def.portrait} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatar}>{def.emoji.base}</Text>
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{def.name}</Text>
                <Text style={styles.meta}>
                  {BOND_LEVEL_NAMES[pet.bondLevel]} · {TIER_LABEL[worstTier]}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </Pressable>
          );
        }}
      />
    </View>
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
    letterSpacing: -0.4,
    color: COLORS.heading,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.soft,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    fontSize: 32,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    color: COLORS.text,
  },
  meta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
