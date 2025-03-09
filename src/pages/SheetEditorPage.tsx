import { useState } from "react";
import SimpleSheetEditor from "../components/SimpleEditor/SimpleSheetEditor";
import MetadataForm from "../components/MetadataForm";

import { useSelector } from "react-redux";
import { RootState } from "../stores/store";
import { useDispatch } from "react-redux";
import { setContent } from "@stores/simpleScoreSlice";
export default function SheetEditor() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const simpleScore = useSelector((state: RootState) => state.simpleScore);
    const dispatch = useDispatch();


    const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
    const { title, composer, singer, coverImage } = sheetMetadata;

    const handleUpload = async () => {
        if (!title.trim()) {
            setMessage("请填写曲名");
            return;
        }

        setUploading(true);
        setMessage("");

        const body = {
            title,
            composer,
            singer,
            uploader: "anonymous",
            lyrics: simpleScore.content,
            coverImage
        };

        try {
            const res = await fetch("https://chordcove.875159954.workers.dev/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const { id } = await res.json();
                setMessage(`上传成功！乐谱 ID: ${id}`);
            } else {
                setMessage("上传失败，请重试");
            }
        } catch (error) {
            setMessage("网络错误，请稍后再试");
        }

        setUploading(false);
    };

    return (
        <div className="max-w-[90rem] mx-auto px-4 ">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="order-2 lg:order-[-1] lg:w-1/4 flex flex-col">
                    <MetadataForm />
                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-[90%]  text-gray-100 py-2 rounded hover:bg-gray-700 transition bg-[#1f1f1f] justify-self-center shadow-[#1f1f1f] shadow-inner mx-auto"

                    >
                        {uploading ? "上传中..." : "上传乐谱"}
                    </button>
                </div>

                <div className="lg:w-3/4 flex flex-col">
                    <SimpleSheetEditor />

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