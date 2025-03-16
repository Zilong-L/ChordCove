import { useState } from "react";
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

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

export default function SheetEditor() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

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
        } catch (error) {
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
        } catch (error) {
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
                        >
                            {uploading ? "上传中..." : "上传乐谱"}
                        </button>
                        :
                        <button
                            onClick={handleSave}
                            disabled={uploading}
                            className="w-[90%] text-gray-100 py-2 rounded hover:bg-gray-700 transition bg-[#1f1f1f] justify-self-center shadow-[#1f1f1f] shadow-inner mx-auto"
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
                        value={simpleScore.content}
                        onChange={(e) => dispatch(setContent(e.target.value))}
                        className="w-[90%] mx-auto mt-4 h-32 resize-none p-2 bg-transparent border border-gray-700 rounded mb-4 text-gray-100 outline-none"
                    />

                    {message && <p className="mt-2 text-center text-gray-400">{message}</p>}
                </div>
            </div>
        </div>
    );
}