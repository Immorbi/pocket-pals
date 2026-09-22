import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheetBase } from '@/components/ui/BottomSheetBase';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { FOOD_ORDER, FOODS } from '@/domain/food';
import { PET_DEFINITIONS, PET_ORDER } from '@/domain/petDefinitions';
import type { FoodId, PetId } from '@/domain/types';

interface FoodSheetProps {
  visible: boolean;
  onClose: () => void;
  initialPetId: PetId;
  onStartFeeding: (foodId: FoodId, petId: PetId) => void;
}

// Caller passes `key={initialPetId}` (see Home screen) so this remounts — and re-defaults
// its selection — whenever the active pet changes, instead of going stale after first open.
export function FoodSheet({ visible, onClose, initialPetId, onStartFeeding }: FoodSheetProps) {
  const [selectedPet, setSelectedPet] = useState<PetId>(initialPetId);

  return (
    <BottomSheetBase visible={visible} title="Еда" onClose={onClose}>
      <Text style={styles.label}>Кормить</Text>
      <View style={styles.petRow}>
        {PET_ORDER.map((id) => {
          const def = PET_DEFINITIONS[id];
          const active = id === selectedPet;
          return (
            <Pressable
              key={id}
              onPress={() => setSelectedPet(id)}
              style={[styles.petChip, active && styles.petChipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Выбрать ${def.name}`}
              accessibilityState={{ selected: active }}
            >
              {def.portrait ? (
                <Image source={def.portrait} style={styles.petAvatar} resizeMode="cover" />
              ) : (
                <Text style={styles.petEmoji}>{def.emoji.base}</Text>
              )}
              <Text style={[styles.petName, active && styles.petNameActive]}>{def.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Выберите еду</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodRow}>
        {FOOD_ORDER.map((id) => {
          const food = FOODS[id];
          const isFavorite = food.favoriteOf.includes(selectedPet);
          return (
            <Pressable
              key={id}
              style={[styles.foodCard, isFavorite && styles.foodCardFavorite]}
              onPress={() => {
                onClose();
                onStartFeeding(id, selectedPet);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Покормить: ${food.label}${isFavorite ? ', любимое' : ''}`}
            >
              {food.image ? (
                <Image source={food.image} style={styles.foodImage} resizeMode="contain" />
              ) : (
                <Text style={styles.foodEmoji}>{food.emoji}</Text>
              )}
              <Text style={styles.foodLabel}>{food.label}</Text>
              {isFavorite ? <Text style={styles.favoriteTag}>любимое</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  petRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  petChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardMuted,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  petEmoji: {
    fontSize: 24,
  },
  petAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
  },
  petName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  petNameActive: {
    color: COLORS.onPrimary,
    fontFamily: FONTS.bodyBold,
  },
  foodRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  foodCard: {
    width: 88,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardMuted,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  foodCardFavorite: {
    borderColor: COLORS.primary,
  },
  foodImage: {
    width: 52,
    height: 52,
  },
  foodEmoji: {
    fontSize: 30,
  },
  foodLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.text,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  favoriteTag: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.heading,
    marginTop: 2,
  },
});
