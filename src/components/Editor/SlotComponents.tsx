import React, { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { MelodySlot, ChordSlot, LyricsSlot } from "@stores/scoreSlice";
import type { RootState } from "@stores/store";
import { setPlaybackStartBeat, setPlaybackEndBeat } from "@stores/editingSlice";

interface SlotProps {
  slot: MelodySlot | ChordSlot | LyricsSlot;
  className?: string;
}

const BaseSlotComponent = React.memo(
  ({ slot, children }: { slot: SlotProps["slot"]; children: React.ReactNode }) => {
    const dispatch = useDispatch();
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const playingBeat = useSelector((state: RootState) => state.editing.playingBeat);
    const { playbackStartBeat, playbackEndBeat } = useSelector((state: RootState) => state.editing);
    const isPlaying = playingBeat === slot.beat;
    const isStart = playbackStartBeat === slot.beat;
    const isEnd = playbackEndBeat === slot.beat;

    useEffect(() => {
      const handleClickOutside = () => {
        setMenuPosition(null);
      };

      if (menuPosition) {
        document.addEventListener("click", handleClickOutside);
        return () => {
          document.removeEventListener("click", handleClickOutside);
        };
      }
    }, [menuPosition]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuPosition({ x: e.clientX, y: e.clientY });
    }, []);

    const handleSetStart = useCallback(() => {
      dispatch(setPlaybackStartBeat(slot.beat));
      setMenuPosition(null);
    }, [dispatch, slot.beat]);

    const handleSetEnd = useCallback(() => {
      dispatch(setPlaybackEndBeat(slot.beat));
      setMenuPosition(null);
    }, [dispatch, slot.beat]);

    return (
      <span className="relative">
        <span
          className={`font-bold transition-colors duration-100 ${isPlaying ? "text-green-400" : ""} ${isStart ? "border-b-2 border-blue-400" : ""} ${isEnd ? "border-b-2 border-red-400" : ""}`}
          onContextMenu={handleContextMenu}
        >
          {children}
        </span>

        {menuPosition && (
          <div
            className="fixed z-50"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-40 rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
              <button
                onClick={handleSetStart}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
              >
                设为起点
              </button>
              <button
                onClick={handleSetEnd}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
              >
                设为终点
              </button>
            </div>
          </div>
        )}
      </span>
    );
  }
);

export const MelodySlotComponent = React.memo(({ slot }: { slot: MelodySlot }) => {
  if (slot.sustain) {
    return <BaseSlotComponent slot={slot}>-</BaseSlotComponent>;
  }
  if (!slot.note) {
    return <BaseSlotComponent slot={slot}>♪</BaseSlotComponent>;
  }

  // Format the note for display
  const noteParts = slot.note.split(/(\d+)/); // Split between letter and number
  if (noteParts.length >= 2) {
    const [note, octave] = [noteParts[0], noteParts[1]];
    return <BaseSlotComponent slot={slot}>{`${note}${octave}`}</BaseSlotComponent>;
  }
  return <BaseSlotComponent slot={slot}>{slot.note}</BaseSlotComponent>;
});

export const ChordSlotComponent = React.memo(({ slot }: { slot: ChordSlot }) => {
  if (!slot.chord) {
    return <BaseSlotComponent slot={slot}>♪</BaseSlotComponent>;
  }
  return <BaseSlotComponent slot={slot}>{slot.chord}</BaseSlotComponent>;
});

export const LyricsSlotComponent = React.memo(({ slot }: { slot: LyricsSlot }) => {
  if (!slot.text) {
    return <BaseSlotComponent slot={slot}>♪</BaseSlotComponent>;
  }
  return <BaseSlotComponent slot={slot}>{slot.text}</BaseSlotComponent>;
});
