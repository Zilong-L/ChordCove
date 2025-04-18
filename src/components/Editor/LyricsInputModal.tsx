import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@stores/store";
import { setLyricsEditing, setLyricsInputValue, setEditingBeat } from "@stores/editingSlice";
import { MelodySlot, setSlot } from "@stores/scoreSlice";
import { durationValues, type NoteDuration } from "#types/sheet";

export const LyricsInputModal = () => {
  const dispatch = useDispatch();
  const {
    isLyricsEditing,
    lyricsInputValue,
    editingBeat,
    editingTrack,
    selectedDuration,
    isDotted,
  } = useSelector((state: RootState) => state.editing);
  const score = useSelector((state: RootState) => state.score);
  const currentTrack = score.tracks[editingTrack];

  // Calculate actual duration
  const baseDuration = durationValues[selectedDuration as NoteDuration];
  const newSlotDuration = isDotted ? baseDuration * 1.5 : baseDuration;

  // Close modal when clicking outside


  // Add keyboard shortcut for opening lyrics input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "l" && !isLyricsEditing && currentTrack?.type === "melody") {
        e.preventDefault();
        dispatch(setLyricsEditing(true));
        const currentSlot = currentTrack.slots.find(
          (slot) => slot.beat === editingBeat
        ) as MelodySlot;
        dispatch(setLyricsInputValue(currentSlot?.lyrics || ""));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [dispatch, isLyricsEditing, currentTrack, editingBeat]);

  const handleClose = () => {
    if (lyricsInputValue && currentTrack?.type === "melody") {
      // Save the input before closing
      const currentSlot = currentTrack.slots.find((slot) => slot.beat === editingBeat);
      if (currentSlot) {
        dispatch(
          setSlot({
            trackId: currentTrack.id,
            slot: {
              ...currentSlot,
              lyrics: lyricsInputValue,
            },
          })
        );
      }
    }
    dispatch(setLyricsEditing(false));
    dispatch(setLyricsInputValue(""));
  };
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.getElementById("lyrics-input-modal");
      if (modal && !modal.contains(e.target as Node)) {
        handleClose();
      }
    };

    if (isLyricsEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLyricsEditing, handleClose]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Save current input
      if (currentTrack?.type === "melody") {
        const currentSlot = currentTrack.slots.find((slot) => slot.beat === editingBeat);
        if (currentSlot) {
          dispatch(
            setSlot({
              trackId: currentTrack.id,
              slot: {
                ...currentSlot,
                lyrics: lyricsInputValue,
              },
            })
          );
        }
      }
      // Move to next position
      dispatch(setEditingBeat(editingBeat + newSlotDuration));
      // Clear input
      dispatch(setLyricsInputValue(""));
    } else if (e.key === "Escape") {
      dispatch(setLyricsEditing(false));
      dispatch(setLyricsInputValue(""));
    }
  };

  if (!isLyricsEditing || currentTrack?.type !== "melody") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div id="lyrics-input-modal" className="w-64 rounded-lg bg-[var(--bg-primary)] p-4 shadow-xl">
        <div className="mb-4 text-center text-sm text-[var(--text-secondary)]">输入歌词</div>
        <input
          type="text"
          value={lyricsInputValue}
          onChange={(e) => dispatch(setLyricsInputValue(e.target.value))}
          onKeyDown={handleKeyDown}
          className="w-full rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 outline-none focus:border-[var(--border-focus)]"
          autoFocus
          placeholder="输入歌词..."
        />
        <div className="mt-2 text-center text-xs text-[var(--text-tertiary)]">
          按回车键确认并移动到下一个位置
          <br />
          按ESC键取消
        </div>
      </div>
    </div>
  );
};
