import { useState } from "react";
import { useNavigate } from "react-router-dom";

import MetadataForm from "../components/basic/MetadataForm";
import Editor from "@components/Editor/Editor";

// redux states
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";

import { fetchApi } from '@utils/api';
import { SheetMetaData } from '@/types/sheet';

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

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
                    "Authorization": `Bearer ${auth.token}`
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
            console.error('Upload error:', err);
            setMessage("网络错误，请稍后再试");
        }

        setUploading(false);
    };

    return (
        <div className="xl:max-w-[90rem] mx-auto px-2 md:px-8">
            <div className="flex flex-col xl:flex-row gap-6  xl:items-start">
                <div className="order-2 xl:order-[-1] xl:w-1/4 flex flex-col ">
                    <MetadataForm uploading={uploading} setUploading={setUploading}/>
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-[90%]  text-gray-100 py-2 rounded hover:bg-gray-700 transition bg-[#1f1f1f] justify-self-center shadow-[#1f1f1f] shadow-inner mx-auto"
                    >
                        {uploading ? "上传中..." : "上传乐谱"}
                    </button>
                </div>

                <div className="  xl:w-3/4">
                    <Editor />

       
                    
                    {message && <p className="mt-2 text-center text-gray-400">{message}</p>}
                </div>
            </div>
        </div>
    );
}