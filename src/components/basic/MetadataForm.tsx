import React, { useRef, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { RootState } from "@stores/store";
import { XMarkIcon } from "@heroicons/react/20/solid";

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

interface MetadataFormProps {
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MetadataForm({ uploading, setUploading }: MetadataFormProps) {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);
  const { title, composers, singers, coverImage } = sheetMetadata;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [singerInput, setSingerInput] = useState("");
  const [composerInput, setComposerInput] = useState("");

  const handleImageUpload = async (file: File) => {
    if (!auth.isAuthenticated) {
      alert("请先登录");
      navigate("/login");
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setSheetMetadata({ ...sheetMetadata, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await fetch(API_BASE_URL + "/api/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: formData,
      });

      if (result.ok) {
        const resultJson = await result.json();
        if (resultJson.coverImage) {
          dispatch(setSheetMetadata({ ...sheetMetadata, coverImage: resultJson.coverImage }));
        }
      } else if (result.status === 401) {
        alert("登录已过期，请重新登录");
        navigate("/login");
      } else {
        alert("上传失败，请重试");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("网络错误，请稍后再试");
    }
    setUploading(false);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
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
      handleImageUpload(file);
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
    <div className="space-y-4 rounded-lg bg-gradient-to-t from-[#121212] to-[#212121] p-4">
      <div>
        <div
          className={`aspect-square w-full border-4 ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-[#1f1f1f]"} relative mb-4 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg shadow-md transition-colors duration-200`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnter={handleDragOver}
          role="button"
          aria-label="上传封面图片"
        >
          {coverImage ? (
            <img src={coverImage} alt="封面图片" className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-gray-400">
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
        <label htmlFor="title" className="mb-1 block text-gray-400">
          曲名
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => dispatch(setSheetMetadata({ ...sheetMetadata, title: e.target.value }))}
          className="w-full rounded border border-gray-700 bg-transparent p-2 text-gray-100"
          placeholder="请输入曲名"
          title="曲名"
        />
      </div>

      <div>
        <label htmlFor="composer" className="mb-1 block text-gray-400">
          作曲者
        </label>
        <div className="flex flex-wrap gap-2 rounded border border-gray-700 bg-transparent p-2">
          {composers?.map((composer, index) => (
            <div key={index} className="flex items-center rounded bg-gray-700 px-2 py-1">
              <span className="text-gray-100">{composer.name}</span>
              <button
                onClick={() => removeArtist(index, "composers")}
                className="ml-1 text-gray-400 hover:text-gray-200"
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
            className="min-w-[100px] flex-1 bg-transparent text-gray-100 outline-none"
            placeholder={composers?.length ? "" : "请输入作曲者，按回车或逗号添加"}
          />
        </div>
      </div>

      <div>
        <label htmlFor="singer" className="mb-1 block text-gray-400">
          演唱者
        </label>
        <div className="flex flex-wrap gap-2 rounded border border-gray-700 bg-transparent p-2">
          {singers?.map((singer, index) => (
            <div key={index} className="flex items-center rounded bg-gray-700 px-2 py-1">
              <span className="text-gray-100">{singer.name}</span>
              <button
                onClick={() => removeArtist(index, "singers")}
                className="ml-1 text-gray-400 hover:text-gray-200"
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
            className="min-w-[100px] flex-1 bg-transparent text-gray-100 outline-none"
            placeholder={singers?.length ? "" : "请输入演唱者，按回车或逗号添加"}
          />
        </div>
      </div>
    </div>
  );
}
