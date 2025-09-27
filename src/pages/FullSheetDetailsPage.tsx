import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import ReadOnlyMetadataForm from "@components/basic/sheet/ReadOnlyMetadataForm";
import ScoreViewer from "@components/Editor/ScoreViewer";
import LikeButton from "@components/basic/sheet/LikeButton";
import { fetchApi, API_BASE_URL, R2_BASE_URL } from "@utils/api";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { setScore, type Score } from "@stores/scoreSlice";
import { RootState } from "@stores/store";
import type { SheetMetaData } from "#types/sheet";

export default function FullSheetDetailsPage() {
  const { id: sheetId } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const [loading, setLoading] = useState(true);
  const [sheetMissing, setSheetMissing] = useState(false);

  useEffect(() => {
    const loadSheet = async () => {
      if (!sheetId) {
        setSheetMissing(true);
        return;
      }

      try {
        const metadata = await fetchApi<SheetMetaData>(
          `${API_BASE_URL}/api/get-sheet-metadata/${sheetId}`
        );
        dispatch(setSheetMetadata(metadata));

        const scoreResponse = await fetch(`${R2_BASE_URL}/sheets/${metadata.id}.json`);
        if (!scoreResponse.ok) {
          throw new Error(`Failed to fetch score data for ${metadata.id}`);
        }

        const rawData = await scoreResponse.json();
        const scoreData: Score = "scoreData" in rawData ? rawData.scoreData : rawData;

        dispatch(
          setScore({
            key: scoreData.key || "C",
            tempo: scoreData.tempo || 120,
            tracks: scoreData.tracks || [],
          })
        );

        setLoading(false);
      } catch (error) {
        console.error("Failed to load full sheet:", error);
        setSheetMissing(true);
      }
    };

    loadSheet();
  }, [dispatch, sheetId]);

  if (sheetMissing) {
    return (
      <div className="min-h-[80%] rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
        <h1 className="text-center text-3xl text-[var(--text-primary)]">Sheet Not Found</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] overflow-y-hidden px-2 md:px-8 xl:max-w-[90rem]">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col lg:order-[-1] lg:w-1/4">
          <ReadOnlyMetadataForm />
          {!loading && sheetMetadata.id && <LikeButton sheetId={sheetMetadata.id} />}
        </div>

        <div className="relative flex h-[90vh] flex-col overflow-x-hidden lg:w-3/4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-[var(--text-primary)]">
              加载中...
            </div>
          ) : (
            <ScoreViewer />
          )}
        </div>
      </div>
    </div>
  );
}
