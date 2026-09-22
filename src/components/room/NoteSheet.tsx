import { useWindowDimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { WISHES, dayNumber, wishForDay } from '@/domain/wishes';
import { useGameStore } from '@/store/gameStore';

interface NoteSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function NoteSheet({ visible, onClose }: NoteSheetProps) {
  const { width } = useWindowDimensions();
  const startedAt = useGameStore((s) => s.startedAt);

  if (!visible) return null;

  const day = dayNumber(startedAt);

  const noteWidth = Math.min(width - SPACING.md * 2, 400);

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Закрыть записку" />
      <Animated.View entering={ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(150)} pointerEvents="box-none">
        <View style={{ width: noteWidth, height: noteWidth * 1.04 }}>
          <Image source={require('../../../assets/images/note.png')} style={styles.paper} resizeMode="contain" />
          <View style={styles.textArea}>
            <Text style={styles.heading}>Насте</Text>
            <Text style={styles.body}>{wishForDay(day)}</Text>
            <Text style={styles.day}>{`${day} / ${WISHES.length}`}</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,18,10,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  paper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  // The sheet has a torn, uneven edge, so the text sits well inside it — and is tilted to
  // match: the paper is drawn at roughly -7.7° (measured off its top and bottom edges).
  textArea: {
    position: 'absolute',
    top: '22%',
    left: '18%',
    right: '18%',
    bottom: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-13deg' }],
  },
  heading: {
    fontFamily: FONTS.handBold,
    fontSize: 32,
    color: COLORS.heading,
    marginBottom: SPACING.sm,
  },
  day: {
    fontFamily: FONTS.hand,
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  body: {
    // Handwriting needs more size and air than the interface face to stay readable.
    fontFamily: FONTS.hand,
    fontSize: 23,
    lineHeight: 30,
    color: COLORS.text,
    textAlign: 'center',
  },
});
