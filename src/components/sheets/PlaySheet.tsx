import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheetBase } from '@/components/ui/BottomSheetBase';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { PET_DEFINITIONS } from '@/domain/petDefinitions';
import { TOY_ORDER, TOYS, pickPlayTarget } from '@/domain/toys';
import type { PetId, ToyId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

interface PlaySheetProps {
  visible: boolean;
  onClose: () => void;
  onStartMiniGame: (toyId: ToyId, petId: PetId) => void;
}

export function PlaySheet({ visible, onClose, onStartMiniGame }: PlaySheetProps) {
  const unlockedToys = useGameStore((s) => s.unlockedToys);
  const pets = useGameStore((s) => s.pets);

  return (
    <BottomSheetBase visible={visible} title="Играть" onClose={onClose}>
      <View style={styles.grid}>
        {TOY_ORDER.filter((id) => unlockedToys.includes(id)).map((id) => {
          const toy = TOYS[id];
          const targetId = pickPlayTarget(id, pets);
          const target = PET_DEFINITIONS[targetId];
          return (
            <Pressable
              key={id}
              style={styles.card}
              onPress={() => {
                onClose();
                onStartMiniGame(id, targetId);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Играть в ${toy.label} с ${target.nameInstrumental}`}
            >
              {toy.image ? (
                <Image source={toy.image} style={styles.image} resizeMode="contain" />
              ) : (
                <Text style={styles.emoji}>{toy.emoji}</Text>
              )}
              <Text style={styles.label}>{toy.label}</Text>
              <Text style={styles.hint}>
                для {target.emoji.base} {target.nameGenitive}
              </Text>
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
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
