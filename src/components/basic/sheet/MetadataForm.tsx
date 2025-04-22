import React, { useRef, useState, KeyboardEvent, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { RootState } from "@stores/store";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { getLocalSheetData, LocalSheetMetadata, updateLocalSheetMetadata } from "@utils/idb/localsheet";
import { debounce } from "lodash";
import { useParams } from 'react-router-dom'

interface MetadataFormProps {
  uploading: boolean;
  localKey?: string;
  setPendingImage?: (data: { file: File; hash: string } | null) => void;
}

export default function MetadataForm({ uploading, setPendingImage }: MetadataFormProps) {
  const { id: localKey } = useParams<{ id: string }>();
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);
  const { title = "", composers = [], singers = [], coverImage = "", bvid = "" } = sheetMetadata;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [singerInput, setSingerInput] = useState("");
  const [composerInput, setComposerInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(coverImage || null);

  useEffect(() => {
    const loadLocalData = async () => {
      if (localKey) {
        const localData = await getLocalSheetData(localKey);
        if (localData) {
          dispatch(
            setSheetMetadata({
              id: localData.metadata.serverId || "",
              title: localData.metadata.title || "",
              composers:
                localData.metadata.composers?.map((composer) => ({
                  ...composer,
                  role: "COMPOSER",
                })) || [],
              singers:
                localData.metadata.singers?.map((singer) => ({
                  ...singer,
                  role: "SINGER",
                })) || [],
              coverImage: localData.metadata.coverImage || "",
              bvid: localData.metadata.bvid || "",
              uploader: localData.metadata.uploader || "",
              uploaderId: localData.metadata.uploaderId || 0,
              sheetType: localData.metadata.sheetType || "simple",
            })
          );
        }
      }
    };

    loadLocalData();
  }, [localKey, dispatch]);

  // Debounced function for saving metadata
  const debouncedSaveMetadata = useCallback(
    debounce(async (key: string, metadata: Omit<LocalSheetMetadata, "localKey" | "serverModifiedAt" | "localLastSavedAt">) => {
      if (!key) return;
      try {
        await updateLocalSheetMetadata(key, metadata);
        console.log("Metadata saved locally");
      } catch (err) {
        console.error("Failed to save metadata locally:", err);
      }
    }, 1000),
    []
  );

  // Save metadata when it changes
  useEffect(() => {
    if (localKey) {
      debouncedSaveMetadata(localKey, {
        title: sheetMetadata.title,
        composers: sheetMetadata.composers,
        singers: sheetMetadata.singers,
        coverImage: sheetMetadata.coverImage,
        bvid: sheetMetadata.bvid,
        sheetType: "full"
      });
    }
  }, [sheetMetadata, localKey, debouncedSaveMetadata]);

  useEffect(() => {
    // Reset preview image when coverImage changes from parent
    if (coverImage) {
      setPreviewImage(coverImage);
    }
  }, [coverImage]);

  const handleImageSelect = async (file: File) => {
    if (!auth.isAuthenticated) {
      alert("请先登录");
      navigate("/login");
      return;
    }

    // Calculate SHA-256 hash of the file
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Set pending image for parent component
    if (setPendingImage) {
      setPendingImage({ file, hash: hashHex });
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageSelect(file);
    } else {
      alert("请上传图片文件");
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    type: "singers" | "composers",
    inputValue: string,
    setInputValue: (value: string) => void
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = inputValue.trim();
      if (value) {
        const currentArray = type === "singers" ? singers || [] : composers || [];
        const newArtist = { name: value, role: type === "singers" ? "SINGER" : "COMPOSER", id: 0 };
        dispatch(
          setSheetMetadata({
            ...sheetMetadata,
            [type]: [...currentArray, newArtist],
          })
        );
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue) {
      const currentArray = type === "singers" ? singers || [] : composers || [];
      if (currentArray.length > 0) {
        dispatch(
          setSheetMetadata({
            ...sheetMetadata,
            [type]: currentArray.slice(0, -1),
          })
        );
      }
    }
  };

  const removeArtist = (index: number, type: "singers" | "composers") => {
    const currentArray = type === "singers" ? singers || [] : composers || [];
    dispatch(
      setSheetMetadata({
        ...sheetMetadata,
        [type]: currentArray.filter((_, i) => i !== index),
      })
    );
  };

  return (
    <div className="space-y-4 rounded-lg bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-4">
      <div>
        <div
          className={`aspect-square w-full border-4 ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-[var(--border-primary)]"} relative mb-4 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg shadow-md transition-colors duration-200`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnter={handleDragOver}
          role="button"
          aria-label="上传封面图片"
        >
          {previewImage ? (
            <img
              src={previewImage || undefined}
              alt="封面图片"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center text-[var(--text-tertiary)]">
              <svg
                className="mx-auto mb-2 h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>{isDragging ? "释放以上传图片" : "点击或拖拽上传封面"}</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            disabled={uploading}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="上传封面图片"
            title="上传封面图片"
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-[var(--text-tertiary)]">
          曲名
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => dispatch(setSheetMetadata({ ...sheetMetadata, title: e.target.value }))}
          className="w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)]"
          placeholder="请输入曲名"
          title="曲名"
        />
      </div>

      <div>
        <label htmlFor="composer" className="mb-1 block text-[var(--text-tertiary)]">
          作曲者
        </label>
        <div className="flex flex-wrap gap-2 rounded border border-[var(--border-primary)] bg-transparent p-2">
          {composers?.map((composer, index) => (
            <div
              key={index}
              className="flex items-center rounded bg-[var(--bg-secondary)] px-2 py-1"
            >
              <span className="text-[var(--text-primary)]">{composer.name}</span>
              <button
                onClick={() => removeArtist(index, "composers")}
                className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label={`移除作曲者 ${composer.name}`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={composerInput}
            onChange={(e) => setComposerInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "composers", composerInput, setComposerInput)}
            className="min-w-[100px] flex-1 bg-transparent text-[var(--text-primary)] outline-none"
            placeholder={composers?.length ? "" : "请输入作曲者，按回车或逗号添加"}
          />
        </div>
      </div>

      <div>
        <label htmlFor="singer" className="mb-1 block text-[var(--text-tertiary)]">
          演唱者
        </label>
        <div className="flex flex-wrap gap-2 rounded border border-[var(--border-primary)] bg-transparent p-2">
          {singers?.map((singer, index) => (
            <div
              key={index}
              className="flex items-center rounded bg-[var(--bg-secondary)] px-2 py-1"
            >
              <span className="text-[var(--text-primary)]">{singer.name}</span>
              <button
                onClick={() => removeArtist(index, "singers")}
                className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label={`移除演唱者 ${singer.name}`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={singerInput}
            onChange={(e) => setSingerInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "singers", singerInput, setSingerInput)}
            className="min-w-[100px] flex-1 bg-transparent text-[var(--text-primary)] outline-none"
            placeholder={singers?.length ? "" : "请输入演唱者，按回车或逗号添加"}
          />
        </div>
      </div>

      <div>
        <label htmlFor="bvid" className="mb-1 block text-[var(--text-tertiary)]">
          Bilibili 视频 ID (可选)
        </label>
        <input
          id="bvid"
          type="text"
          value={bvid}
          onChange={(e) => dispatch(setSheetMetadata({ ...sheetMetadata, bvid: e.target.value }))}
          placeholder="例如：BV1xx411c7mu"
          className="w-full rounded border border-[var(--border-primary)] bg-transparent p-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
        />
      </div>
    </div>
  );
}
