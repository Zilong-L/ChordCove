import React, { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import { setEditingBeat, setLyricsEditing, setLyricsInputValue } from "@stores/editingSlice";
import { setSlot, type Slot, slotHelpers } from "@stores/scoreSlice";

interface InlineLyricsInputProps {
  slotBeat: number; // base/original beat of the slot
  isActive: boolean;
  trackId: string;
}

export const InlineLyricsInput: React.FC<InlineLyricsInputProps> = ({
  slotBeat,
  isActive,
  trackId,
}) => {
  const dispatch = useDispatch();
  const { lyricsInputValue } = useSelector((state: RootState) => state.editing);
  const score = useSelector((state: RootState) => state.score);
  const currentTrack = useMemo(
    () => score.tracks.find((t) => t.id === trackId),
    [score.tracks, trackId]
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const enterHandledRef = useRef(false);

  // Preload lyrics of current slot when becoming active or when beat changes to this slot
  useEffect(() => {
    if (!isActive || !currentTrack) return;
    const currentSlot = currentTrack.slots.find((s) => s.beat === slotBeat) as Slot | undefined;
    // Only preload when slot is filled content
    const canEdit = !!currentSlot && !slotHelpers.isEmpty(currentTrack.type, currentSlot);
    const existing = canEdit ? currentSlot.lyrics || "" : "";
    dispatch(setLyricsInputValue(existing));
  }, [isActive, currentTrack, slotBeat, dispatch]);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive, slotBeat]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!currentTrack) return;
    if (e.key === "Enter") {
      e.preventDefault();
      enterHandledRef.current = true;
      const slot = currentTrack.slots.find((s) => s.beat === slotBeat) as Slot | undefined;
      if (slot && !slotHelpers.isEmpty(currentTrack.type, slot)) {
        dispatch(
          setSlot({
            trackId: currentTrack.id,
            slot: { ...slot, lyrics: lyricsInputValue },
            modifyOnly: true,
          })
        );
      }
      // Find next filled slot; if none, do not move further
      const sorted = [...currentTrack.slots].sort((a, b) => a.beat - b.beat);
      const next = sorted.find(
        (s) => s.beat > slotBeat && !slotHelpers.isEmpty(currentTrack.type, s)
      );
      if (next) {
        dispatch(setEditingBeat(next.beat));
        const nextExisting = next.lyrics || "";
        dispatch(setLyricsInputValue(nextExisting));
      } else {
        // No further filled slots: exit lyrics editing so user sees saved text
        dispatch(setLyricsEditing(false));
        dispatch(setLyricsInputValue(""));
      }
      setTimeout(() => {
        enterHandledRef.current = false;
      }, 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      dispatch(setLyricsEditing(false));
      dispatch(setLyricsInputValue(""));
    }
  };

  const onBlur = () => {
    if (!currentTrack) return;
    if (enterHandledRef.current) {
      // Already saved via Enter path; avoid duplicate save
      enterHandledRef.current = false;
      return;
    }
    const slot = currentTrack.slots.find((s) => s.beat === slotBeat) as Slot | undefined;
    if (slot && !slotHelpers.isEmpty(currentTrack.type, slot)) {
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: { ...slot, lyrics: lyricsInputValue },
          modifyOnly: true,
        })
      );
    }
    dispatch(setLyricsEditing(false));
    dispatch(setLyricsInputValue(""));
  };

  if (!isActive || !currentTrack) {
    return null;
  }

  // Guard: only allow input on filled slot
  const slot = currentTrack.slots.find((s) => s.beat === slotBeat) as Slot | undefined;
  if (!slot || slotHelpers.isEmpty(currentTrack.type, slot)) return null;

  return (
    <input
      ref={inputRef}
      type="text"
      value={lyricsInputValue}
      onChange={(e) => dispatch(setLyricsInputValue(e.target.value))}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-sm outline-none focus:border-[var(--border-focus)]"
      placeholder="输入歌词..."
    />
  );
};
