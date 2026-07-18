/**
 * H.O.P.E. — chronicle persistence.
 *
 * The Chronicle is the legacy box: stickers, the signed ledger, opened
 * envelopes, retired cards, hero history. Every client saves it to
 * localStorage on every state broadcast, keyed by room id, so any member of
 * the group can host the next voyage from the same browser and the campaign
 * carries on.
 */

import type { Chronicle } from "./types";
import { newChronicle } from "./engine";

const KEY_PREFIX = "hope-chronicle:";

export function chronicleKey(roomId: string): string {
  return `${KEY_PREFIX}${roomId}`;
}

export function loadChronicle(roomId: string): Chronicle {
  try {
    const raw = localStorage.getItem(chronicleKey(roomId));
    if (raw) {
      const parsed = JSON.parse(raw) as Chronicle;
      if (parsed && typeof parsed.voyage === "number") return parsed;
    }
  } catch {
    // Corrupt or inaccessible storage: start a fresh campaign.
  }
  return newChronicle(roomId);
}

export function saveChronicle(roomId: string, chronicle: Chronicle): void {
  try {
    localStorage.setItem(chronicleKey(roomId), JSON.stringify(chronicle));
  } catch {
    // Storage full or blocked — the campaign just won't persist here.
  }
}
