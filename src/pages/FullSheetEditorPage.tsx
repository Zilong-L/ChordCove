import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";

import MetadataForm from "../components/basic/sheet/MetadataForm";

interface PendingImage {
  file: File;
  hash: string;
}
import Editor from "@components/Editor/Editor";

// redux states
import { useDispatch, useSelector } from "react-redux";
import { setScore } from "@stores/scoreSlice";

import { RootState } from "@stores/store";

import EditorControlPanel from "@components/Editor/EditorControlPanel";

// Import IndexedDB functions
import { getLocalSheetData, updateLocalSheetContent } from "../utils/idb/localsheet";
import { Score } from "@stores/scoreSlice";
export default function FullSheetEditorPage() {
  const { id: localKey } = useParams<{ id: string }>();
  const [uploading, _setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [_, setPendingImage] = useState<PendingImage | null>(null);
  // const navigate = useNavigate();

  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);

  // Initialize DB and load score data on mount
  useEffect(() => {
    const loadScore = async () => {
      if (!localKey || isInitialized) return;

      setIsLoading(true);
      try {
        const data = await getLocalSheetData(localKey);
        if (data?.content?.score) {
          dispatch(setScore({
            key: data.content.score.key,
            tempo: data.content.score.tempo,
            tracks: data.content.score.tracks
          }));
          setIsInitialized(true);
        } else {
          setMessage(`未找到本地乐谱: ${localKey}`);
        }
      } catch (err) {
        console.error("Failed to load local sheet:", err);
        setMessage("无法加载乐谱数据");
      } finally {
        setIsLoading(false);
      }
    };

    loadScore();
  }, [localKey, isInitialized, dispatch]);

  // Debounced function for local score saving
  const debouncedSaveScore = useCallback(
    debounce(async (key: string, scoreData: Score) => {
      if (!key || isLoading) return;
      setIsSavingLocally(true);
      try {
        await updateLocalSheetContent(key, { score: scoreData });
        console.log("Score saved locally");
      } catch (err) {
        console.error("Failed to save score locally:", err);
      } finally {
        setIsSavingLocally(false);
      }
    }, 1000),
    [isLoading, localKey]
  );

  // Watch for score changes and save locally
  useEffect(() => {
    if (!isLoading && localKey) {
      console.log('saving')
      debouncedSaveScore(localKey, score);
    }
  }, [localKey, score, debouncedSaveScore, isLoading]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">加载编辑器中...</div>;
  }


  return (
    <div className="mx-auto px-2 md:px-8 xl:max-w-[90vw]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="order-2 flex flex-col xl:order-[-1] xl:w-1/5">
          <MetadataForm
            uploading={uploading}
            setPendingImage={setPendingImage}
          />
          <button
            disabled={uploading || isSavingLocally}
            className={`mx-auto w-[90%] justify-self-center rounded py-2 transition ${uploading || isSavingLocally
              ? "bg-[var(--bg-button-disabled)] text-[var(--text-button-disabled)]"
              : "bg-[var(--bg-button)] text-[var(--text-button)] shadow-inner shadow-[var(--bg-button)] hover:bg-[var(--bg-button-hover)]"
              }`}
          >
            {uploading || isSavingLocally ? "处理中..." : "上传乐谱"}
          </button>
        </div>

        <div className="flex gap-4 xl:w-4/5">
          <Editor />
          {/* Control Panel */}
          <div className="sticky top-0 w-64 shrink-0 overflow-auto">
            <EditorControlPanel />
          </div>
          {message && <p className="mt-2 text-center text-[var(--text-tertiary)]">{message}</p>}
        </div>
      </div>
    </div>
  );
}
