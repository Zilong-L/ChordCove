import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SimpleSheetEditor from "../components/SimpleEditor/SimpleSheetEditor";
import MetadataForm from "../components/basic/sheet/MetadataForm";

import { useSelector } from "react-redux";
import { RootState } from "../stores/store";
import { useDispatch } from "react-redux";
import { setContent } from "@stores/simpleScoreSlice";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";

import { API_BASE_URL } from "@utils/api";

export default function SheetEditor() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleSave = async () => {
    if (!auth.isAuthenticated) {
      setMessage("请先登录");
      navigate("/login");
      return;
    }

    setUploading(true);
    setMessage("");

    const body = {
      sheetMetadata,
      scoreData: simpleScore,
    };

    try {
      const data = await fetchApi<SheetMetaData>(`${API_BASE_URL}/api/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(body),
      });

      if (data) {
        setMessage(`保存成功！`);
      } else if (data === false) {
        setMessage("登录已过期，请重新登录");
        navigate("/login");
      } else {
        setMessage("上传失败，请重试");
      }
    } catch (err) {
      console.error("Save error:", err);
      setMessage("网络错误，请稍后再试");
    }

    setUploading(false);
  };

  const handleUpload = async () => {
    if (!auth.isAuthenticated) {
      setMessage("请先登录");
      navigate("/login");
      return;
    }

    if (!sheetMetadata.title.trim()) {
      setMessage("请填写曲名");
      return;
    }

    setUploading(true);
    setMessage("");

    const body = {
      sheetMetadata,
      scoreData: simpleScore,
    };

    try {
      const data = await fetchApi<SheetMetaData>(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(body),
      });

      if (data) {
        setMessage(`上传成功！乐谱 ID: ${data.id}`);
        dispatch(setSheetMetadata({ ...sheetMetadata, id: data.id }));
      } else if (data === false) {
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
    <div className="mx-auto h-[calc(100vh-4rem)] overflow-scroll px-2 md:px-8 xl:max-w-[90rem]">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col gap-4 lg:order-[-1] lg:w-1/4">
          <MetadataForm uploading={uploading} setUploading={setUploading} />
          {!sheetMetadata.id ? (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mx-auto w-[90%] justify-self-center rounded bg-[var(--bg-secondary)] py-2 text-[var(--text-primary)] shadow-inner shadow-[var(--bg-secondary)] transition hover:bg-[var(--bg-hover)]"
              title="上传乐谱"
            >
              {uploading ? "上传中..." : "上传乐谱"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={uploading}
              className="mx-auto w-[90%] justify-self-center rounded bg-[var(--bg-secondary)] py-2 text-[var(--text-primary)] shadow-inner shadow-[var(--bg-secondary)] transition hover:bg-[var(--bg-hover)]"
              title="保存修改"
            >
              {uploading ? "保存中..." : "保存修改"}
            </button>
          )}
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
