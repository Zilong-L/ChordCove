import type { ReactNode } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setEditingTrack } from "@stores/editingSlice";
import { RootState } from "@stores/store";

import BarView from "./BarView";

interface ScoreViewerProps {
  className?: string;
  headerActions?: ReactNode;
}

export default function ScoreViewer({ className = "", headerActions }: ScoreViewerProps) {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);

  useEffect(() => {
    if (score.tracks.length > 0) {
      dispatch(setEditingTrack(0));
    }
  }, [dispatch, score.tracks.length]);

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-6 text-[var(--text-primary)] ${className}`.trim()}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <h2 className="pl-4 text-3xl font-bold text-[var(--text-primary)]">
          {sheetMetadata.title || "未命名完整谱"}
        </h2>
        {headerActions ? (
          <div className="flex flex-wrap items-center justify-end gap-3 text-[var(--text-tertiary)]">
            {headerActions}
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-x-visible overflow-y-auto">
        <BarView allowEditing={false} />
      </div>
    </div>
  );
}
