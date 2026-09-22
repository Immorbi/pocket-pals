import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatterBubble } from '@/components/room/ChatterBubble';
import { ToyPlay, type PetHitBox } from '@/components/room/ToyPlay';
import { LetterBadge } from '@/components/room/LetterBadge';
import { NoteSheet } from '@/components/room/NoteSheet';
import { PetSprite } from '@/components/room/PetSprite';
import { RoomBackground } from '@/components/room/RoomBackground';
import { TopStatusBar } from '@/components/room/TopStatusBar';
import { FoodSheet } from '@/components/sheets/FoodSheet';
import { PlaySheet } from '@/components/sheets/PlaySheet';
import { FONTS, GUTTER, SPACING, TAB_BAR_HEIGHT, TEXT_ON_ART, tabBarOverhang } from '@/constants/theme';
import { PET_DEFINITIONS, PET_ORDER } from '@/domain/petDefinitions';
import { dayNumber } from '@/domain/wishes';
import { useGameStore } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { getTimeOfDay } from '@/domain/time';
import type { PetDefinition } from '@/domain/petDefinitions';
import type { PetId, TimeOfDay, ToyId } from '@/domain/types';
import { useGameLoop } from '@/hooks/useGameLoop';

// Dead-center within its own fixed-size stage below — not a percentage of the room, so it
// can never drift into the buttons no matter how much vertical space they take.
const STAGE_CENTER = { x: 0.5, y: 0.5 };

// Base size of the featured pet; each definition's own spriteScale corrects for how much
// of its source illustration the animal actually fills.
const FEATURED_SCALE = 2.1;

const STAGE_SIZE = 220;

function SideAvatarButton({ def, onPress }: { def: PetDefinition; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={styles.avatarButton}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Показать ${def.name}`}
    >
      {def.portrait ? (
        <Image source={def.portrait} style={styles.avatarButtonImage} resizeMode="contain" />
      ) : (
        <Text style={styles.avatarButtonEmoji}>{def.emoji.base}</Text>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  useGameLoop();

  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const startedAt = useGameStore((s) => s.startedAt);
  const noteReadDay = useGameStore((s) => s.noteReadDay);
  const markNoteRead = useGameStore((s) => s.markNoteRead);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay());
  // Held in state, not recomputed on render: with the screen left open the note has to turn
  // over on its own at midnight, and nothing else here would re-render at that moment.
  const [today, setToday] = useState(() => dayNumber(startedAt));
  const [activePetId, setActivePetId] = useState<PetId>(PET_ORDER[0]);
  // Food and play are opened from the tab bar now, which lives outside this screen.
  const sheet = useUiStore((s) => s.sheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const [noteVisible, setNoteVisible] = useState(false);
  const [activeToy, setActiveToy] = useState<{ toyId: ToyId; petId: PetId } | null>(null);
  const endPlay = useCallback(() => setActiveToy(null), []);
  // Window coordinates of the drawn pet, so the toy knows when it is being waved over them.
  const stageRef = useRef<View>(null);
  const [petHitBox, setPetHitBox] = useState<PetHitBox | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
      setToday(dayNumber(startedAt));
    }, 60_000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const activeDef = PET_DEFINITIONS[activePetId];
  const spriteBox = 72 * FEATURED_SCALE * (activeDef.spriteScale ?? 1);
  const offsetX = activeDef.spriteOffsetX ?? 0;
  const offsetY = activeDef.spriteOffsetY ?? 0;

  const measurePet = useCallback(() => {
    stageRef.current?.measureInWindow((wx, wy, ww, wh) => {
      const cx = wx + ww / 2 + offsetX * STAGE_SIZE;
      const cy = wy + wh / 2 + offsetY * STAGE_SIZE;
      // The drawn animal fills roughly the middle of its square sprite box.
      const w = spriteBox * 0.55;
      const h = spriteBox * 0.8;
      setPetHitBox({ x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    });
  }, [offsetX, offsetY, spriteBox]);

  // Switching pets changes the sprite size without moving the stage, so re-measure by hand.
  useEffect(() => {
    measurePet();
  }, [measurePet]);
  // Sits just above the drawn sprite, which overflows the fixed stage box by design.
  // Capped so a very large sprite cannot push the bubble up into the name tag.
  const bubbleBottom = Math.min(STAGE_SIZE / 2 - (activeDef.spriteOffsetY ?? 0) * STAGE_SIZE + spriteBox / 2 + 8, 360);
  const activeIndex = PET_ORDER.indexOf(activePetId);
  const prevId = PET_ORDER[(activeIndex - 1 + PET_ORDER.length) % PET_ORDER.length];
  const nextId = PET_ORDER[(activeIndex + 1) % PET_ORDER.length];

  return (
    <View style={styles.container}>
      <RoomBackground />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <View style={styles.topRowText}>
            <TopStatusBar timeOfDay={timeOfDay} />
          </View>
          <LetterBadge
            shake={noteReadDay !== today}
            onPress={() => {
              markNoteRead(today);
              setNoteVisible(true);
            }}
          />
        </View>

        <Pressable
          onPress={() => router.push(`/pets/${activePetId}`)}
          accessibilityRole="button"
          accessibilityLabel={`Открыть профиль: ${activeDef.name}`}
        >
          <Text style={styles.nameTag}>{activeDef.name}</Text>
        </Pressable>

        {/* Sits above the ragged paper edge, which rises well clear of the bar itself. */}
        <View
          style={[styles.room, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + tabBarOverhang(screenWidth) + SPACING.lg }]}
          pointerEvents="box-none"
        >
          <SideAvatarButton def={PET_DEFINITIONS[prevId]} onPress={() => setActivePetId(prevId)} />
          <View
            ref={stageRef}
            style={styles.stage}
            pointerEvents="box-none"
            onLayout={measurePet}
          >
            <View style={[styles.bubbleAnchor, { bottom: bubbleBottom }]} pointerEvents="none">
              <ChatterBubble key={activePetId} gender={activeDef.gender} />
            </View>
            <PetSprite
              // Switching animal stays instant — a fresh sprite has no running loop to wait for.
              key={activePetId}
              petId={activePetId}
              position={{ x: STAGE_CENTER.x + offsetX, y: STAGE_CENTER.y + offsetY }}
              scale={FEATURED_SCALE * (activeDef.spriteScale ?? 1)}
              animateIdle={false}
            />
          </View>
          <SideAvatarButton def={PET_DEFINITIONS[nextId]} onPress={() => setActivePetId(nextId)} />
        </View>

      </View>

      <FoodSheet key={activePetId} visible={sheet === 'food'} onClose={closeSheet} initialPetId={activePetId} />
      <PlaySheet
        visible={sheet === 'play'}
        onClose={closeSheet}
        onStartMiniGame={(toyId, petId) => {
          // The toy is waved over whoever is on screen, so bring that pet into view first.
          setActivePetId(petId);
          setActiveToy({ toyId, petId });
        }}
      />
      <NoteSheet visible={noteVisible} onClose={() => setNoteVisible(false)} />
      {activeToy ? (
        <ToyPlay toyId={activeToy.toyId} petId={activeToy.petId} hitBox={petHitBox} onDone={endPlay} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: GUTTER,
  },
  topRowText: {
    flex: 1,
  },
  nameTag: {
    fontFamily: FONTS.headingExtra,
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: SPACING.lg,
    ...TEXT_ON_ART,
  },
  room: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  avatarButton: {
    // No plate behind them: the cut-out still frame stands straight on the background.
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl + SPACING.lg,
  },
  avatarButtonImage: {
    width: '100%',
    height: '100%',
  },
  avatarButtonEmoji: {
    fontSize: 28,
  },
  stage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    // The featured pet stands in front of the two switcher stickers.
    zIndex: 1,
  },
  bubbleAnchor: {
    position: 'absolute',
    left: -70,
    right: -70,
    alignItems: 'center',
  },
});
