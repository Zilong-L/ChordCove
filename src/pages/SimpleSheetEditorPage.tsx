import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { debounce } from "lodash";
import SimpleSheetEditor from "../components/SimpleEditor/SimpleSheetEditor";
import MetadataForm from "../components/basic/sheet/MetadataForm";

import { useSelector } from "react-redux";
import { RootState } from "../stores/store";
import { useDispatch } from "react-redux";
import { setContent, setSimpleScore } from "@stores/simpleScoreSlice";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { fetchApi, API_BASE_URL } from "@utils/api";
import { SheetMetaData } from "#types/sheet";

// Import IndexedDB functions
import {
  getLocalSheetData,
  updateLocalSheetMetadata,
  updateLocalSheetContent,
  updateLocalSheetAfterSync,
  LocalSheetContent,
} from "../lib/localsheet";

// Define our response type that includes both metadata and score data
interface SaveSheetResponse extends SheetMetaData {
  key: string;
  tempo: number;
  timeSignature: string; // Match SimpleScore type
  content: string;
  createdAt: number;
  lastModified: number;
}

interface PendingImage {
  file: File;
  hash: string;
}

export default function SheetEditor() {
  const { localKey } = useParams<{ localKey: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // Initialize DB and load data on mount - with fixed dependencies
  useEffect(() => {
    const loadSheet = async () => {
      if (!localKey) {
        setMessage("本地乐谱标识丢失");
        navigate("/sheets/create");
        return;
      }

      if (isInitialized) {
        return; // Prevent loading data multiple times
      }

      setIsLoading(true);
      try {
        const data = await getLocalSheetData(localKey);
        if (data) {
          // Update Redux store with local sheet data
          dispatch(
            setSheetMetadata({
              id: data.metadata.serverId || "",
              title: data.metadata.title,
              composers: [],
              singers: [],
              uploader: "",
              uploaderId: -1,
              coverImage: "",
            })
          );

          dispatch(
            setSimpleScore({
              key: data.content.key,
              tempo: data.content.tempo,
              timeSignature: data.content.timeSignature,
              content: data.content.content,
            })
          );

          console.log(`Loaded sheet data for localKey: ${localKey}`);
          setIsInitialized(true);
        } else {
          setMessage(`未找到本地乐谱: ${localKey}`);
          // Could redirect to create page or show error
        }
      } catch (err) {
        console.error("Failed to load local sheet:", err);
        setMessage("无法加载乐谱数据");
      } finally {
        setIsLoading(false);
      }
    };

    loadSheet();
  }, [localKey, dispatch, navigate, isInitialized]);

  // Debounced functions for local saving
  const debouncedSaveMetadata = useCallback(
    debounce(async (key: string, title: string) => {
      if (!key || isLoading) return;
      setIsSavingLocally(true);
      try {
        await updateLocalSheetMetadata(key, { title });
        console.log("Metadata saved locally");
      } catch (err) {
        console.error("Failed to save metadata locally:", err);
        // Maybe set a temporary error message
      } finally {
        setIsSavingLocally(false);
      }
    }, 1000),
    [isLoading]
  );

  const debouncedSaveContent = useCallback(
    debounce(async (key: string, contentData: Partial<Omit<LocalSheetContent, "localKey">>) => {
      if (!key || isLoading) return;
      setIsSavingLocally(true);
      try {
        await updateLocalSheetContent(key, contentData);
        console.log("Content saved locally");
      } catch (err) {
        console.error("Failed to save content locally:", err);
        // Maybe set a temporary error message
      } finally {
        setIsSavingLocally(false);
      }
    }, 1000),
    [isLoading]
  );

  // Watch for metadata changes and save locally
  useEffect(() => {
    if (!isLoading && localKey && sheetMetadata.title) {
      debouncedSaveMetadata(localKey, sheetMetadata.title);
    }
  }, [localKey, sheetMetadata.title, debouncedSaveMetadata, isLoading]);

  // Watch for content changes and save locally
  useEffect(() => {
    if (!isLoading && localKey) {
      debouncedSaveContent(localKey, {
        key: simpleScore.key,
        tempo: simpleScore.tempo,
        timeSignature: simpleScore.timeSignature,
        content: simpleScore.content,
      });
    }
  }, [
    localKey,
    simpleScore.key,
    simpleScore.tempo,
    simpleScore.timeSignature,
    simpleScore.content,
    debouncedSaveContent,
    isLoading,
  ]);

  // Function to extract hash from coverImage URL
  const getHashFromUrl = (url: string): string | null => {
    const match = url.match(/\/([a-f0-9]{64})\.webp$/);
    return match ? match[1] : null;
  };

  // Function to handle image upload
  const handleImageUpload = async (file: File, hash: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sha256", hash);

    const response = await fetchApi<{ data: { coverImage: string } }>(
      `${API_BASE_URL}/api/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );
    console.log(response);

    if (!response || !response.data.coverImage) {
      throw new Error("Image upload failed");
    }

    return response.data.coverImage;
  };

  // Unified save/sync to server function
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

    setUploading(true);
    setMessage("");

    try {
      // Handle image upload if needed
      let finalCoverImage = sheetMetadata.coverImage;
      if (pendingImage) {
        const currentHash = sheetMetadata.coverImage
          ? getHashFromUrl(sheetMetadata.coverImage)
          : null;

        // Only upload if the hash is different
        if (currentHash !== pendingImage.hash) {
          finalCoverImage = await handleImageUpload(pendingImage.file, pendingImage.hash);
        }
      }

      // Prepare request body
      const requestBody = {
        id: sheetMetadata.id || undefined,
        title: sheetMetadata.title,
        composers: sheetMetadata.composers,
        singers: sheetMetadata.singers,
        coverImage: finalCoverImage,
        bvid: sheetMetadata.bvid,
        key: simpleScore.key,
        tempo: simpleScore.tempo,
        timeSignature: simpleScore.timeSignature,
        content: simpleScore.content,
      };

      // Use our unified endpoint
      const data = await fetchApi<SaveSheetResponse>(`${API_BASE_URL}/api/sheets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(requestBody),
      });
      console.log(data);
      if (data) {
        // Update IndexedDB with server response
        await updateLocalSheetAfterSync(localKey, {
          id: data.id,
          createdAt: data.createdAt,
          lastModified: data.lastModified,
        });

        // Update Redux store
        dispatch(
          setSheetMetadata({
            ...sheetMetadata,
            id: data.id,
            coverImage: finalCoverImage,
          })
        );

        // Clear pending image after successful sync
        setPendingImage(null);

        if (sheetMetadata.id) {
          setMessage(`保存成功！`);
        } else {
          setMessage(`上传成功！乐谱 ID: ${data.id}`);
        }
      } else if (data === false) {
        setMessage("登录已过期，请重新登录");
        navigate("/login");
      } else {
        setMessage("保存失败，请重试");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setMessage("网络错误，请稍后再试");
    } finally {
      setUploading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">加载编辑器中...</div>;
  }

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] overflow-scroll px-2 md:px-8 xl:max-w-[90rem]">

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col gap-4 lg:order-[-1] lg:w-1/4">
          <MetadataForm
            uploading={uploading}
            localKey={localKey}
            setPendingImage={setPendingImage}
          />

          {/* Unified save button */}
          <button
            onClick={handleSync}
            disabled={uploading || isSavingLocally}
            className="mx-auto w-[90%] justify-self-center rounded bg-[var(--bg-secondary)] py-2 text-[var(--text-primary)] shadow-inner shadow-[var(--bg-secondary)] transition hover:bg-[var(--bg-hover)]"
            title={sheetMetadata.id ? "保存修改" : "上传乐谱"}
          >
            保存
          </button>
        </div>

        <div className="flex h-[90vh] flex-col lg:w-3/4">
          <SimpleSheetEditor />
          <textarea
            ref={textareaRef}
              value={simpleScore.content}
              onChange={(e) => dispatch(setContent(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();

                  const textarea = textareaRef.current;
                  if (!textarea) return;

                  // 插入 [] 保留 undo 历史
                  textarea.focus();
                  document.execCommand("insertText", false, "[]");
                  // deprecated but no alternative for now.

                  // 移动光标到中间
                  const pos = textarea.selectionStart;
                  textarea.setSelectionRange(pos - 1, pos - 1);

                  // 同步到 Redux
                  dispatch(setContent(textarea.value));
                }
              }}
              className="mx-auto mb-4 mt-4 min-h-48 w-[90%] resize-none rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)] outline-none"
              placeholder="输入乐谱内容"
              title="乐谱内容"
              aria-label="乐谱内容"
            />
            {message && <p className="mt-2 text-center text-[var(--text-tertiary)]">{message}</p>}
          </div>
      </div>
    </div>
  );
}
