import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetBase } from '@/components/ui/BottomSheetBase';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { TOY_ORDER, TOYS, suitsHint } from '@/domain/toys';
import type { PetId, ToyId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

interface PlaySheetProps {
  visible: boolean;
  onClose: () => void;
  /** Whoever is on screen right now — the toy gets thrown for them. */
  petId: PetId;
  onStartMiniGame: (toyId: ToyId) => void;
}

export function PlaySheet({ visible, onClose, petId, onStartMiniGame }: PlaySheetProps) {
  const unlockedToys = useGameStore((s) => s.unlockedToys);
  const target = PET_DEFINITIONS[petId];

  return (
    <BottomSheetBase visible={visible} title="Играть" onClose={onClose}>
      <View style={styles.grid}>
        {TOY_ORDER.filter((id) => unlockedToys.includes(id)).map((id) => {
          const toy = TOYS[id];
          const favorite = toy.id === target.favoriteToy;
          return (
            <Pressable
              key={id}
              style={styles.card}
              onPress={() => {
                onClose();
                onStartMiniGame(id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Играть в ${toy.label} с ${target.nameInstrumental}`}
            >
              {toy.image ? (
                <Image source={toy.image} style={styles.image} resizeMode="contain" />
              ) : (
                <Text style={styles.emoji}>{toy.emoji}</Text>
              )}
              {/* Both kept to one line: a long toy name or hint used to wrap and leave that
                  one card taller than the rest of the row. */}
              <Text style={styles.label} numberOfLines={1}>{toy.label}</Text>
              <Text style={styles.hint} numberOfLines={1}>{favorite ? 'любимая' : suitsHint(id)}</Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  card: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardMuted,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 88,
    justifyContent: 'center',
  },
  image: {
    width: 56,
    height: 56,
  },
  emoji: {
    fontSize: 30,
  },
  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.text,
    marginTop: SPACING.xs,
    paddingHorizontal: 2,
  },
  hint: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
