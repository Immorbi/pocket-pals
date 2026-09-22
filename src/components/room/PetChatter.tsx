import { useCallback, useState } from 'react';

import { ChatterBubble } from '@/components/room/ChatterBubble';
import { ReactionBubble } from '@/components/room/ReactionBubble';
import type { PetId } from '@/domain/types';
import { useGameStore } from '@/store/gameStore';

/**
 * Sits where ChatterBubble used to sit directly: shows a fresh feed/play reaction the moment
 * one lands on the pet, then falls back to the ambient small talk once it has had its say.
 * A reaction pre-empts whatever chatter was showing rather than queuing behind it — it is a
 * direct response to something the player just did, so it should never feel delayed.
 *
 * The store clears `thought` on its own after a few seconds (see PetSprite), on a timer meant
 * for the emoji badge, not this bubble's reading time — so the line is captured into local
 * state the instant a new one lands, then lives on that copy for ReactionBubble's own hold
 * time, however long the store keeps the original thought around for.
 */
export function PetChatter({ petId, gender }: { petId: PetId; gender: 'f' | 'm' }) {
  const thought = useGameStore((s) => s.pets[petId].thought);
  const [shown, setShown] = useState<{ key: number; text: string } | null>(null);
  // The last key already shown (and dismissed), so a `thought` that hasn't changed since —
  // the store may still be holding it — never re-triggers the same line a second time.
  const [dismissedKey, setDismissedKey] = useState<number | null>(null);

  // Adjusting state during render, not in an effect, so a fresh line is captured on the same
  // render the store update arrives in — see https://react.dev/learn/you-might-not-need-an-effect.
  if (thought?.text && thought.createdAt !== shown?.key && thought.createdAt !== dismissedKey) {
    setShown({ key: thought.createdAt, text: thought.text });
  }

  const clear = useCallback(() => {
    setDismissedKey(shown?.key ?? null);
    setShown(null);
  }, [shown]);

  if (shown) {
    return <ReactionBubble key={shown.key} text={shown.text} onDone={clear} />;
  }
  return <ChatterBubble gender={gender} />;
}
