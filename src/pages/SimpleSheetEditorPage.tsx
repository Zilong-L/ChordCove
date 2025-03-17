import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SimpleSheetEditor from "../components/SimpleEditor/SimpleSheetEditor";
import MetadataForm from "../components/basic/MetadataForm";

import { useSelector } from "react-redux";
import { RootState } from "../stores/store";
import { useDispatch } from "react-redux";
import { setContent } from "@stores/simpleScoreSlice";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { fetchApi } from '@utils/api';
import { SheetMetaData } from '@/types/sheet';

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
                    "Authorization": `Bearer ${auth.token}`
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
            console.error('Save error:', err);
            setMessage("网络错误，请稍后再试");
        }

        setUploading(false);
    }

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
                    "Authorization": `Bearer ${auth.token}`
                },
                body: JSON.stringify(body),
            });

            if (data) {
                setMessage(`上传成功！乐谱 ID: ${data.id}`);
                dispatch(setSheetMetadata({...sheetMetadata, id: data.id}));
            } else if (data === false) {
                setMessage("登录已过期，请重新登录");
                navigate("/login");
            } else {
                setMessage("上传失败，请重试");
            }
        } catch (err) {
            console.error('Upload error:', err);
            setMessage("网络错误，请稍后再试");
        }

        setUploading(false);
    };

    return (
        <div className="h-[calc(100vh-4rem)] overflow-scroll overflow-x-hidden xl:max-w-[90rem] mx-auto px-2 md:px-8 ">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="order-2 lg:order-[-1] lg:w-1/4 flex flex-col">
                    <MetadataForm uploading={uploading} setUploading={setUploading}/>
                    {!sheetMetadata.id ? 
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-[90%] text-gray-100 py-2 rounded hover:bg-gray-700 transition bg-[#1f1f1f] justify-self-center shadow-[#1f1f1f] shadow-inner mx-auto"
                            title="上传乐谱"
                        >
                            {uploading ? "上传中..." : "上传乐谱"}
                        </button>
                        :
                        <button
                            onClick={handleSave}
                            disabled={uploading}
                            className="w-[90%] text-gray-100 py-2 rounded hover:bg-gray-700 transition bg-[#1f1f1f] justify-self-center shadow-[#1f1f1f] shadow-inner mx-auto"
                            title="保存修改"
                        >
                            {uploading ? "保存中..." : "保存修改"}
                        </button>
                    }
                </div>

                <div className="lg:w-3/4 flex flex-col h-[90vh]">
                    <div className="flex h-full overflow-y-scroll">
                        <SimpleSheetEditor />
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={simpleScore.content}
                        onChange={(e) => dispatch(setContent(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                                e.preventDefault(); // Prevent default tab behavior
                                
                                // Get cursor position
                                const textarea = textareaRef.current;
                                if (!textarea) return;
                                
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                
                                // Get current content
                                const content = simpleScore.content;
                                
                                // Insert square brackets at cursor position
                                const newContent = content.substring(0, start) + '[]' + content.substring(end);
                                
                                // Update content
                                dispatch(setContent(newContent));
                                
                                // Set cursor position inside brackets immediately after the update
                                requestAnimationFrame(() => {
                                    textarea.focus();
                                    textarea.selectionStart = start + 1;
                                    textarea.selectionEnd = start + 1;
                                });
                            }
                        }}
                        className="w-[90%] mx-auto mt-4 h-32 resize-none p-2 bg-transparent border border-gray-700 rounded mb-4 text-gray-100 outline-none"
                        placeholder="输入乐谱内容"
                        title="乐谱内容"
                        aria-label="乐谱内容"
                    />

                    {message && <p className="mt-2 text-center text-gray-400">{message}</p>}
                </div>
            </div>
        </div>
    );
}