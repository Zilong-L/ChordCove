import { useState } from "react";
import { useNavigate } from "react-router-dom";

// import MetadataForm from "../components/basic/sheet/MetadataForm";
import Editor from "@components/Editor/Editor";

// redux states
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";

import { fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";
import EditorControlPanel from "@components/Editor/EditorControlPanel";
import { API_BASE_URL } from "@utils/api";
export default function FullSheetEditorPage() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const { title } = sheetMetadata;
  const score = useSelector((state: RootState) => state.score);
  const auth = useSelector((state: RootState) => state.auth);

  const handleUpload = async () => {
    if (!auth.isAuthenticated) {
      setMessage("请先登录");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      setMessage("请填写曲名");
      return;
    }

    setUploading(true);
    setMessage("");

    const body = {
      sheetMetadata,
      scoreData: score,
    };

    try {
      const data = await fetchApi<SheetMetaData>(API_BASE_URL + "/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(body),
      });

      if (data) {
        setMessage(`上传成功！乐谱 ID: ${data.id}`);
      } else if (data === null) {
        setMessage("登录已过期，请重新登录");
        navigate("/login");
      } else {
        setMessage("上传失败，请重试");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("网络错误，请稍后再试");
    }

    setUploading(false);
  };

  return (
    <div className="mx-auto px-2 md:px-8 xl:max-w-[90vw]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="order-2 flex flex-col xl:order-[-1] xl:w-1/5">
          {/* <MetadataForm uploading={uploading} setPendingImage={setPendingImage} /> */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`mx-auto w-[90%] justify-self-center rounded py-2 transition ${
              uploading
                ? "bg-[var(--bg-button-disabled)] text-[var(--text-button-disabled)]"
                : "bg-[var(--bg-button)] text-[var(--text-button)] shadow-inner shadow-[var(--bg-button)] hover:bg-[var(--bg-button-hover)]"
            }`}
          >
            {uploading ? "上传中..." : "上传乐谱"}
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
