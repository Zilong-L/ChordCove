import React, { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type {
  MelodySlot,
  ChordSlot,
  LyricsSlot,
  AccompanimentSlot,
  NotesSlot,
} from "@stores/scoreSlice";
import type { SlotView } from "@utils/theory/barView";
import type { RootState } from "@stores/store";
import { setPlaybackStartBeat, setPlaybackEndBeat } from "@stores/editingSlice";

export interface SlotProps {
  slot: MelodySlot | ChordSlot | LyricsSlot | AccompanimentSlot | NotesSlot | SlotView;
  className?: string;
  isFirstTrack?: boolean;
}

export const BaseSlotComponent = React.memo(
  ({
    slot,
    children,
    isFirstTrack = false,
  }: {
    slot: SlotProps["slot"];
    children: React.ReactNode;
    isFirstTrack?: boolean;
  }) => {
    const dispatch = useDispatch();
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const playingBeat = useSelector((state: RootState) => state.editing.playingBeat);
    const { playbackStartBeat, playbackEndBeat } = useSelector((state: RootState) => state.editing);
    const isPlaying = playingBeat === slot.beat;
    const isStart = playbackStartBeat === slot.beat;
    const isEnd = playbackEndBeat === slot.beat;
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Global event listener for closing menu
    useEffect(() => {
      const handleGlobalClick = (e: MouseEvent) => {
        const menuElement = document.querySelector(".context-menu");
        if (!menuElement?.contains(e.target as Node)) {
          setMenuPosition(null);
        }
      };

      window.addEventListener("click", handleGlobalClick);
      window.addEventListener("scroll", () => setMenuPosition(null));

      return () => {
        window.removeEventListener("click", handleGlobalClick);
        window.removeEventListener("scroll", () => setMenuPosition(null));
      };
    }, []);

    // Listen for global close menu event
    useEffect(() => {
      const handleCloseAllMenus = () => {
        setMenuPosition(null);
      };

      window.addEventListener("closealltracksmenus", handleCloseAllMenus);
      return () => {
        window.removeEventListener("closealltracksmenus", handleCloseAllMenus);
      };
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Close all other menus first
      const event = new CustomEvent("closealltracksmenus");
      window.dispatchEvent(event);

      // Get the container element's rect
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMenuPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
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
      <div
        ref={containerRef}
        className="relative w-full"
        onContextMenu={handleContextMenu}
        data-slot-id={slot.beat}
      >
        {isFirstTrack && (
          <>
            {isStart && (
              <div className="absolute top-[50%] h-3 w-3 -translate-x-[150%] -translate-y-1/2 rounded-full bg-[var(--success)]" />
            )}
            {isEnd && (
              <div className="absolute left-[50%] top-[50%] h-3 w-3 -translate-y-[40%] rounded-full bg-[var(--error)]" />
            )}
          </>
        )}
        <div className={`h-full w-full text-nowrap ${isPlaying ? "text-[var(--accent)]" : ""}`}>
          {children}
        </div>
        {menuPosition && (
          <div
            className="context-menu absolute z-50 min-w-[120px] rounded bg-[var(--bg-secondary)] p-2 shadow-lg"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
          >
            <button
              className="block w-full rounded px-2 py-1 text-left text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              onClick={handleSetStart}
            >
              Set as Start
            </button>
            <button
              className="block w-full rounded px-2 py-1 text-left text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              onClick={handleSetEnd}
            >
              Set as End
            </button>
          </div>
        )}
      </div>
    );
  }
);
