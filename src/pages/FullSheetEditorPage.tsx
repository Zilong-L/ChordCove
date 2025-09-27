import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import {
  getLocalSheetData,
  updateLocalSheetContent,
  updateLocalSheetAfterSync,
} from "../utils/idb/localsheet";
import { Score } from "@stores/scoreSlice";
import { API_BASE_URL, fetchApi } from "@utils/api";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { v4 as uuidv4 } from "uuid";

interface SaveFullSheetResponse {
  id: string;
  coverImage?: string;
  createdAt?: number;
  lastModified: number;
  imageUpdateStatus?: string;
}
export default function FullSheetEditorPage() {
  const { id: localKey } = useParams<{ id: string }>();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);

  const normalizeArtists = <T extends { name: string }>(
    artists: Array<T & { name: string }> | undefined
  ) => artists?.map((artist) => ({ name: artist.name })) ?? [];

  // Initialize DB and load score data on mount
  useEffect(() => {
    const loadScore = async () => {
      if (!localKey || isInitialized) return;

      setIsLoading(true);
      try {
        const data = await getLocalSheetData(localKey);
        if (data?.content?.score) {
          dispatch(
            setScore({
              key: data.content.score.key,
              tempo: data.content.score.tempo,
              tracks: data.content.score.tracks,
            })
          );
          dispatch(
            setSheetMetadata({
              id: data.metadata.serverId || "",
              title: data.metadata.title || "",
              sheetType: data.metadata.sheetType || "full",
              composers:
                data.metadata.composers?.map((composer) => ({
                  ...composer,
                  role: "COMPOSER",
                })) || [],
              singers:
                data.metadata.singers?.map((singer) => ({
                  ...singer,
                  role: "SINGER",
                })) || [],
              coverImage: data.metadata.coverImage || "",
              bvid: data.metadata.bvid || "",
              uploader: data.metadata.uploader || "",
              uploaderId: data.metadata.uploaderId || 0,
            })
          );
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
      console.log("saving");
      debouncedSaveScore(localKey, score);
    }
  }, [localKey, score, debouncedSaveScore, isLoading]);

  const handleImageUpload = async (file: File, sheetId: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetId", sheetId);

    const response = await fetchApi<{ data: { coverImage: string } }>(
      `${API_BASE_URL}/api/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response?.data.coverImage) {
      throw new Error("封面上传失败");
    }

    return response.data.coverImage;
  };

  const handleSync = async () => {
    if (!auth.isAuthenticated) {
      setMessage("请先登录");
      navigate("/login");
      return;
    }

    if (!sheetMetadata.title.trim()) {
      setMessage("请填写曲名");
      return;
    }

    if (!localKey) {
      setMessage("无效的乐谱标识");
      return;
    }

    const sheetId = sheetMetadata.id || uuidv4();

    setUploading(true);
    setMessage("");

    try {
      let finalCoverImage = sheetMetadata.coverImage;

      if (pendingImage) {
        finalCoverImage = await handleImageUpload(pendingImage.file, sheetId);
      }

      const requestBody = {
        id: sheetId,
        title: sheetMetadata.title,
        sheetType: "full" as const,
        coverImage: finalCoverImage,
        singers: normalizeArtists(sheetMetadata.singers),
        composers: normalizeArtists(sheetMetadata.composers),
        bvid: sheetMetadata.bvid,
        scoreData: {
          key: score.key,
          tempo: score.tempo,
          tracks: score.tracks,
        },
      };

      const data = await fetchApi<SaveFullSheetResponse>(`${API_BASE_URL}/api/sheets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const persistedCover = data.coverImage || finalCoverImage;

      await updateLocalSheetAfterSync(localKey, {
        id: data.id,
        coverImage: persistedCover,
        createdAt: data.createdAt,
        lastModified: data.lastModified,
      });

      dispatch(
        setSheetMetadata({
          ...sheetMetadata,
          id: data.id,
          coverImage: persistedCover,
          sheetType: "full",
        })
      );

      setPendingImage(null);
      setMessage(sheetMetadata.id ? "保存成功！" : `上传成功！乐谱 ID: ${data.id}`);
    } catch (err) {
      console.error("Sync error:", err);
      const errorMessage = err instanceof Error ? err.message : "网络错误，请稍后再试";
      if (errorMessage.toLowerCase().includes("unauthorized")) {
        setMessage("登录已过期，请重新登录");
        navigate("/login");
      } else {
        setMessage(errorMessage || "网络错误，请稍后再试");
      }
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">加载编辑器中...</div>;
  }

  return (
    <div className="mx-auto px-2 md:px-8 xl:max-w-[90vw]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="order-2 flex flex-col xl:order-[-1] xl:w-1/5">
          <MetadataForm uploading={uploading} setPendingImage={setPendingImage} />
          <button
            onClick={handleSync}
            disabled={uploading || isSavingLocally}
            className={`mx-auto w-[90%] justify-self-center rounded py-2 transition ${
              uploading || isSavingLocally
                ? "bg-[var(--bg-button-disabled)] text-[var(--text-button-disabled)]"
                : "bg-[var(--bg-button)] text-[var(--text-button)] shadow-[var(--bg-button)] shadow-inner hover:bg-[var(--bg-button-hover)]"
            }`}
            title={sheetMetadata.id ? "保存修改" : "上传乐谱"}
          >
            {uploading || isSavingLocally ? "处理中..." : sheetMetadata.id ? "保存" : "上传乐谱"}
          </button>
          {message && (
            <p className="mt-2 text-center text-sm text-[var(--text-tertiary)]">{message}</p>
          )}
        </div>

        <div className="flex gap-4 xl:w-4/5">
          <Editor />
          {/* Control Panel */}
          <div className="sticky top-0 w-64 shrink-0 overflow-auto">
            <EditorControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
