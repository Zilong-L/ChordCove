import React, { createContext, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import { slotHelpers } from "@stores/scoreSlice";
import { InlineLyricsInput } from "@components/Editor/InlineLyricsInput";
import {
  setEditingBeat,
  setEditingTrack,
  setLyricsEditing,
  setLyricsInputValue,
} from "@stores/editingSlice";

interface LyricsContextValue {
  trackId: string;
  trackIndex: number;
  allowEditing: boolean;
}

const LyricsSlotContext = createContext<LyricsContextValue | null>(null);

export function LyricsSlotProvider({
  trackId,
  trackIndex,
  allowEditing = true,
  children,
}: {
  trackId: string;
  trackIndex: number;
  allowEditing?: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ trackId, trackIndex, allowEditing }),
    [trackId, trackIndex, allowEditing]
  );
  return <LyricsSlotContext.Provider value={value}>{children}</LyricsSlotContext.Provider>;
}

function useLyricsSlotContext(): LyricsContextValue {
  const ctx = useContext(LyricsSlotContext);
  if (!ctx) {
    throw new Error("LyricsSlotComponent must be used within a LyricsSlotProvider");
  }
  return ctx;
}

interface LyricsSlotProps {
  slot: {
    beat: number;
    originalBeat?: number;
    originalDuration?: number;
    duration?: number;
    sustain?: boolean;
    lyrics?: string;
    spanUnits?: number;
    lyricSpanUnits?: number;
  };
}

export function LyricsSlotComponent({ slot }: LyricsSlotProps) {
  const { trackId, trackIndex, allowEditing } = useLyricsSlotContext();
  const dispatch = useDispatch();
  const editing = useSelector((state: RootState) => state.editing);
  const score = useSelector((state: RootState) => state.score);

  if (slot.sustain) return null;

  const targetBeat = slot.originalBeat ?? slot.beat;
  const baseTrack = score.tracks[trackIndex];
  const track =
    baseTrack && baseTrack.id === trackId ? baseTrack : score.tracks.find((t) => t.id === trackId);

  if (!track) return null;

  const effectiveTrackIndex = track === baseTrack ? trackIndex : score.tracks.indexOf(track);
  const storeSlot = track.slots.find((s) => s.beat === targetBeat);
  const lyricsText = storeSlot?.lyrics ?? slot.lyrics ?? "";
  const canEditLyrics =
    allowEditing && storeSlot ? !slotHelpers.isEmpty(track.type, storeSlot) : false;

  const widthPercent = 100;

  const isActive =
    canEditLyrics &&
    editing.isLyricsEditing &&
    editing.editingBeat === targetBeat &&
    editing.editingTrack === effectiveTrackIndex;

  const showLyrics = !!editing.showLyricsByTrack[trackId];
  if (!showLyrics && !isActive) return null;

  const handleEnterEdit = () => {
    if (!canEditLyrics || isActive) return;
    dispatch(setEditingTrack(effectiveTrackIndex));
    dispatch(setEditingBeat(targetBeat));
    dispatch(setLyricsInputValue(lyricsText));
    dispatch(setLyricsEditing(true));
  };

  return (
    <div
      className={`mt-2 w-full text-sm ${canEditLyrics ? "cursor-text" : ""}`}
      onClick={canEditLyrics ? handleEnterEdit : undefined}
    >
      {isActive ? (
        <div
          style={{ width: `${widthPercent}%`, minWidth: `${widthPercent}%` }}
          className="self-start"
        >
          <InlineLyricsInput slotBeat={targetBeat} isActive={true} trackId={trackId} />
        </div>
      ) : (
        <span
          className={`block min-h-[1.75rem] flex-shrink-0 self-start rounded border px-2 py-1 transition-colors ${
            canEditLyrics
              ? "border-transparent hover:border-[var(--border-primary)]"
              : "border-transparent"
          }`}
          style={{ width: `${widthPercent}%`, minWidth: `${widthPercent}%` }}
        >
          {lyricsText || "\u00A0"}
        </span>
      )}
    </div>
  );
}
