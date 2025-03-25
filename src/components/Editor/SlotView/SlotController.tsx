import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import type {
  SlotView,
  MelodySlotView,
  LyricsSlotView,
  AccompanimentSlotView,
  NotesSlotView,
} from "@utils/theory/barView";
import { MelodySlotComponent } from "./MelodySlotComponent";
import { LyricsSlotComponent } from "./LyricsSlotComponent";
import { AccompanimentSlotComponent } from "./AccompanimentSlotComponent";
import { NotesSlotComponent } from "./NotesSlotComponent";
type TrackType = "melody" | "lyrics" | "accompaniment" | "notes";

export const SlotController = React.memo(
  ({
    slot,
    isFirstTrack,
    trackType,
  }: {
    slot: SlotView;
    isFirstTrack: boolean;
    trackType: TrackType;
  }) => {
    const keyNote = useSelector((state: RootState) => state.score.key);

    switch (trackType) {
      case "melody":
        return (
          <MelodySlotComponent
            keyNote={keyNote}
            slot={slot as MelodySlotView}
            isFirstTrack={isFirstTrack}
          />
        );
      case "lyrics":
        return <LyricsSlotComponent slot={slot as LyricsSlotView} isFirstTrack={isFirstTrack} />;
      case "accompaniment":
        return (
          <AccompanimentSlotComponent
            slot={slot as AccompanimentSlotView}
            isFirstTrack={isFirstTrack}
          />
        );
      case "notes":
        return <NotesSlotComponent slot={slot as NotesSlotView} isFirstTrack={isFirstTrack} />;
      default:
        return null;
    }
  }
);
