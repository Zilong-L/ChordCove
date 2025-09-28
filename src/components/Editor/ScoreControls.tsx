import { useDispatch, useSelector } from "react-redux";

import { RootState } from "@stores/store";
import { setShowLyricsForTrack } from "@stores/editingSlice";

import KeySelector from "./KeySelector";
import TempoControl from "./TempoControl";
import ScorePlayer from "./ScorePlayer";

interface ScoreControlsProps {
  className?: string;
}

export default function ScoreControls({ className = "" }: ScoreControlsProps) {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const { showLyricsByTrack } = useSelector((state: RootState) => state.editing);

  const allLyricsVisible =
    score.tracks.length > 0 && score.tracks.every((track) => showLyricsByTrack[track.id]);

  const handleToggleAllLyrics = () => {
    const nextValue = !allLyricsVisible;
    score.tracks.forEach((track) => {
      dispatch(setShowLyricsForTrack({ trackId: track.id, value: nextValue }));
    });
  };

  const handleToggleTrackLyrics = (trackId: string) => {
    const current = showLyricsByTrack[trackId] ?? false;
    dispatch(setShowLyricsForTrack({ trackId, value: !current }));
  };

  return (
    <aside
      className={`flex w-full max-w-xs flex-shrink-0 flex-col gap-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 text-[var(--text-primary)] backdrop-blur ${className}`.trim()}
    >
      <section className="flex flex-col gap-3">
        <h3 className="text-xs tracking-wide text-[var(--text-tertiary)] uppercase">基础设置</h3>
        <KeySelector />
        <TempoControl />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs tracking-wide text-[var(--text-tertiary)] uppercase">歌词显示</h3>
        <button
          className="rounded border border-[var(--border-primary)] px-3 py-2 text-sm transition hover:bg-[var(--bg-hover)]"
          onClick={handleToggleAllLyrics}
        >
          {allLyricsVisible ? "隐藏全部歌词" : "显示全部歌词"}
        </button>
        <div className="flex flex-col gap-2">
          {score.tracks.map((track, index) => {
            const isVisible = showLyricsByTrack[track.id];
            const label = `轨道 ${index + 1}（${track.type === "melody" ? "主旋律" : "伴奏"}）`;
            return (
              <button
                key={track.id}
                onClick={() => handleToggleTrackLyrics(track.id)}
                className={`rounded border px-3 py-2 text-sm transition ${
                  isVisible
                    ? "border-[var(--border-primary)] bg-[var(--bg-selected)] text-[var(--text-selected)]"
                    : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs tracking-wide text-[var(--text-tertiary)] uppercase">播放控制</h3>
        <ScorePlayer className="justify-start" showStepControls={false} showStopButton={false} />
      </section>
    </aside>
  );
}
