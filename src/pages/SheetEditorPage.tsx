import { useState } from "react";
import SheetRenderer from "../components/SheetRenderer";
import MetadataForm from "../components/MetadataForm";
export default function SheetEditor() {
    const [lyrics, setLyrics] = useState(`[G]春风又[C]绿江南岸
[Am]明月何[D]时照我还
[G]想你[Em]时你在[C]天涯海角
[Am]望你[D]时你在[G]天上`);

    const [title, setTitle] = useState("");
    const [composer, setComposer] = useState("");
    const [singer, setSinger] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [coverImage, setCoverImage] = useState<string | null>(null);

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
            lyrics,
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
        <div className="max-w-[90rem] mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                    <MetadataForm
                        title={title}
                        setTitle={setTitle}
                        composer={composer}
                        setComposer={setComposer}
                        singer={singer}
                        setSinger={setSinger}
                        coverImage={coverImage}
                        setCoverImage={setCoverImage}
                    />
                </div>

                <div className="lg:w-3/4">
                    <SheetRenderer lyrics={lyrics} setLyrics={setLyrics} />

                    <textarea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="w-full mt-4 h-32 p-2 bg-transparent border border-gray-700 rounded mb-4 text-gray-100"
                    />

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full bg-gray-700 text-gray-100 py-2 rounded hover:bg-gray-600 transition disabled:bg-gray-800"
                    >
                        {uploading ? "上传中..." : "上传乐谱"}
                    </button>
                    {message && <p className="mt-2 text-center text-gray-400">{message}</p>}
                </div>
            </div>
        </div>
    );
}