import KeySelector from "./KeySelector";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import type { Score } from "@stores/scoreSlice";
import type { EditingSlotState } from "@stores/editingSlice";
import BarView from "./BarView";
import ScorePlayer from "./ScorePlayer";
import { useKeyInputs } from "./useInputs/useKeyInputs";
import useMidiInputs from "./useInputs/useMidiInputs";
import { LyricsInputModal } from "./LyricsInputModal";
// import RealTimeInput from "./RealTimeInputs/RealTimeKeyInputs";
// import RealTimeMidiInput from "./RealTimeInputs/RealTimeMidiInputs";

export default function SimpleEditor() {
  // Get states from Redux
  const { editingBeat } = useSelector((state: RootState) => state.editing as EditingSlotState);

  const score = useSelector((state: RootState) => state.score as Score);
  // Use keyboard input hook
  useKeyInputs();
  useMidiInputs();
  console.log(score);
  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full flex-col gap-6 overflow-y-scroll rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-8 text-[var(--text-primary)]">
      <div className="mb-6 flex items-center gap-4">
        <KeySelector />
        <div className="flex items-center gap-2">
          <span>Tempo:</span>
          <span>{score.tempo}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Current Position:</span>
          <span>Beat {editingBeat}</span>
        </div>
        {/* <RealTimeInput /> */}
        {/* <RealTimeMidiInput /> */}
        <ScorePlayer />
      </div>

      {/* Bar View */}
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Bar View</h3>
        <BarView />
      </div>
      <LyricsInputModal />
    </div>
  );
}
