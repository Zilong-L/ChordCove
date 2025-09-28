import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { RootState } from "@stores/store";
import { addLocalSheet, findLocalSheetByServerId } from "@utils/idb/localsheet";

interface EditSheetButtonProps {
  loading: boolean;
}

export function EditSheetButton({ loading }: EditSheetButtonProps) {
  const navigate = useNavigate();
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const fullScore = useSelector((state: RootState) => state.score);

  const handleEditSheet = useCallback(async () => {
    if (loading) return;

    try {
      const sheetType = sheetMetadata.sheetType === "full" ? "full" : "simple";

      if (sheetMetadata.id) {
        const existingLocalKey = await findLocalSheetByServerId(sheetMetadata.id);
        if (existingLocalKey) {
          navigate(`/editor/${sheetType}/${existingLocalKey}`);
          return;
        }
      }

      const localKey = uuidv4();

      const metadata = {
        title: sheetMetadata.title,
        serverId: sheetMetadata.id,
        composers: sheetMetadata.composers || [],
        singers: sheetMetadata.singers || [],
        coverImage: sheetMetadata.coverImage || "",
        uploader: sheetMetadata.uploader || "",
        uploaderId: sheetMetadata.uploaderId || -1,
        bvid: sheetMetadata.bvid || "",
        sheetType,
      } as const;

      const content =
        sheetType === "simple"
          ? {
              key: simpleScore.key,
              tempo: simpleScore.tempo,
              timeSignature: simpleScore.timeSignature,
              content: simpleScore.content,
            }
          : {
              key: fullScore.key,
              tempo: fullScore.tempo,
              timeSignature: "4/4",
              content: "",
              score: fullScore,
            };

      await addLocalSheet({
        localKey,
        metadata,
        content,
      });

      navigate(`/editor/${sheetType}/${localKey}`);
    } catch (error) {
      console.error("Failed to create sheet copy for editing:", error);
    }
  }, [fullScore, loading, navigate, sheetMetadata, simpleScore]);

  return (
    <button
      onClick={handleEditSheet}
      className="rounded-full p-2 transition-colors duration-150 hover:bg-gray-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:hover:bg-gray-700"
      aria-label="Edit sheet"
      disabled={loading}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5a2.75 2.75 0 002.75-2.75V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
      </svg>
    </button>
  );
}
