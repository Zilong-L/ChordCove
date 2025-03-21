import React, { useCallback, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { MelodySlot, ChordSlot, LyricsSlot } from "@stores/scoreSlice";
import type { RootState } from "@stores/store";
import { setPlaybackStartBeat, setPlaybackEndBeat } from "@stores/editingSlice";
import { calculateDegree } from "@utils/theory/Note";
import { getUnderlineCount, isDotted } from "@utils/theory/duration";

interface SlotProps {
  slot: MelodySlot | ChordSlot | LyricsSlot;
  className?: string;
  isFirstTrack?: boolean;
}

const BaseSlotComponent = React.memo(
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
        className="relative h-full w-full"
        onContextMenu={handleContextMenu}
        data-slot-id={slot.beat}
      >
        {isFirstTrack && (
          <>
            {isStart && (
              <div className="absolute top-[50%] h-3 w-3 -translate-x-[150%] -translate-y-1/2 rounded-full bg-green-500" />
            )}
            {isEnd && (
              <div className="absolute left-[50%] top-[50%] h-3 w-3 -translate-y-[40%] rounded-full bg-red-500" />
            )}
          </>
        )}
        <div className={`h-full w-full ${isPlaying ? "text-blue-400" : ""}`}>{children}</div>
        {menuPosition && (
          <div
            className="context-menu absolute z-50 min-w-[120px] rounded bg-gray-800 p-2 shadow-lg"
            style={{
              left: menuPosition.x,
              top: menuPosition.y,
            }}
          >
            <button
              className="block w-full rounded px-2 py-1 text-left hover:bg-gray-700"
              onClick={handleSetStart}
            >
              Set as Start
            </button>
            <button
              className="block w-full rounded px-2 py-1 text-left hover:bg-gray-700"
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

export const MelodySlotComponent = React.memo(
  ({
    keyNote,
    slot,
    isFirstTrack = false,
  }: {
    keyNote: string;
    slot: MelodySlot;
    isFirstTrack?: boolean;
  }) => {
    const underlineCount = getUnderlineCount(slot.duration);
    const hasDot = isDotted(slot.duration);

    const content = (() => {
      if (slot.sustain) return "-";
      if (!slot.note) return "♪";
      return calculateDegree(keyNote, slot.note, "number");
    })();

    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        <div className="relative flex w-full items-center">
          {/* Note content and dot */}
          <div className="relative">
            <span className="inline-block">{content}</span>
            {hasDot && <span className="absolute -right-2 top-1/2 -translate-y-1/2">.</span>}
          </div>

          {/* Underlines container */}
          {underlineCount > 0 && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: "calc(100% - 2px)",
                height: `${underlineCount * 3}px`,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: underlineCount }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[1px] w-full bg-white"
                  style={{
                    top: `${i * 3}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </BaseSlotComponent>
    );
  }
);

export const ChordSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: ChordSlot; isFirstTrack?: boolean }) => {
    if (!slot.chord) {
      return (
        <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
          ♪
        </BaseSlotComponent>
      );
    }
    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        {slot.chord}
      </BaseSlotComponent>
    );
  }
);

export const LyricsSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: LyricsSlot; isFirstTrack?: boolean }) => {
    if (!slot.text) {
      return (
        <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
          ♪
        </BaseSlotComponent>
      );
    }
    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        {slot.text}
      </BaseSlotComponent>
    );
  }
);
