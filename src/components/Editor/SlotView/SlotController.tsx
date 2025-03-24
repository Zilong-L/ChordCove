import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import type {
  SlotView,
  MelodySlotView,
  ChordSlotView,
  LyricsSlotView,
  AccompanimentSlotView,
} from "@utils/theory/barView";
import { MelodySlotComponent } from "./MelodySlotComponent";
import { ChordSlotComponent } from "./ChordSlotComponent";
import { LyricsSlotComponent } from "./LyricsSlotComponent";
import { AccompanimentSlotComponent } from "./AccompanimentSlotComponent";

type TrackType = "melody" | "chord" | "lyrics" | "accompaniment";

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
      case "chord":
        return <ChordSlotComponent slot={slot as ChordSlotView} isFirstTrack={isFirstTrack} />;
      case "lyrics":
        return <LyricsSlotComponent slot={slot as LyricsSlotView} isFirstTrack={isFirstTrack} />;
      case "accompaniment":
        return (
          <AccompanimentSlotComponent
            slot={slot as AccompanimentSlotView}
            isFirstTrack={isFirstTrack}
          />
        );
      default:
        return null;
    }
  }
);
