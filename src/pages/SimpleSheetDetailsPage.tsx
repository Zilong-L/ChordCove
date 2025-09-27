import SimpleSheetDisplay from "../components/SimpleEditor/SimpleSheetDisplay";
import ReadOnlyMetadataForm from "../components/basic/sheet/ReadOnlyMetadataForm";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import LikeButton from "@components/basic/sheet/LikeButton";
import { EditSheetButton } from "../components/SimpleEditor/EditSheetButton";
import { fetchApi, R2_BASE_URL } from "@utils/api";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { useState } from "react";
import { API_BASE_URL } from "@utils/api";
import { SheetMetaData } from "#types/sheet";
import { setSimpleScore } from "@stores/simpleScoreSlice";

export default function SheetEditor() {
  const sheetId = useLocation().pathname.split("/").pop();

  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [sheetMissing, setSheetMissing] = useState(false);
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const sheetMetadata = await fetchApi<SheetMetaData>(
          `${API_BASE_URL}/api/get-sheet-metadata/${sheetId}`
        );
        dispatch(setSheetMetadata(sheetMetadata));
        const sheetData = await fetch(`${R2_BASE_URL}/sheets/${sheetMetadata.id}.json`).then(
          (res) => res.json()
        );
        dispatch(setSimpleScore(sheetData));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching sheet:", error);
        setSheetMissing(true);
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (sheetMissing) {
    return (
      <div className="min-h-[80%] rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
        {sheetMissing && (
          <h1 className="text-center text-3xl text-[var(--text-primary)]">Sheet Not Found</h1>
        )}
      </div>
    );
  }
  return (
    <div className="mx-auto h-[calc(100vh-4rem)] overflow-y-hidden px-2 md:px-8 xl:max-w-[90rem]">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col lg:order-[-1] lg:w-1/4">
          <ReadOnlyMetadataForm />
        </div>

        <div className="relative flex h-[90vh] flex-col overflow-x-hidden lg:w-3/4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-xl text-[var(--text-primary)]">
              加载中...
            </div>
          ) : (
            <SimpleSheetDisplay />
          )}
          {!loading && (
            <div className="absolute top-4 right-8 flex flex-col gap-2 text-[var(--text-tertiary)]">
              <EditSheetButton loading={loading} />
              {sheetMetadata.id && <LikeButton sheetId={sheetMetadata.id} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
