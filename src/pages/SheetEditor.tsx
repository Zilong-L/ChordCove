import { useState } from "react";
import SheetRenderer from "../components/SheetRenderer";
import SheetDisplay from "../components/SheetDisplay";

export default function SheetEditor() {
    const [lyrics, setLyrics] = useState(`[G]春风又[C]绿江南岸
[Am]明月何[D]时照我还
[G]想你[Em]时你在[C]天涯海角
[Am]望你[D]时你在[G]天上`);

    // 🎵 添加元数据字段
    const [title, setTitle] = useState("");
    const [composer, setComposer] = useState("");
    const [singer, setSinger] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    // 🎵 处理上传
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
            uploader: "anonymous", // 可改为用户ID
            lyrics
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
        <div className="p-4 max-w-6xl mx-auto">
            <svg
                width="200" height="200"
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none" stroke="black" stroke-width="2"
            >
                <path d="M165.156,176.583c-16.007,20.073-24.81,40.457-26.128,60.599c-1.475,22.705,5.003,44.281,19.273,64.099 c15.118,21.119,34.22,32.572,56.759,34.047c7.574,0.497,14.7,0.288,21.276-0.597c1.35,7.649,2.709,15.252,3.971,22.781 c1.567,10.176,2.124,19.008,1.644,26.241c-0.661,9.998-3.779,18.178-9.294,24.321c-5.963,6.628-13.396,9.533-22.826,8.92 c-4.105-0.269-7.722-1.326-10.904-3.201c3.745-0.862,7.145-2.469,10.119-4.785c5.761-4.469,8.989-10.965,9.521-19.28 c0.503-7.999-1.529-14.995-6.067-20.778c-4.827-6.332-11.389-9.818-19.5-10.355c-8.283-0.545-15.797,2.806-21.957,9.807 c-5.474,6.199-8.54,13.493-9.061,21.68c-0.797,12.227,3.847,22.67,13.85,31.026c8.771,7.321,19.272,11.421,31.22,12.202 c6.792,0.445,13.354-0.337,19.466-2.328c5.021-1.635,9.842-4.12,14.366-7.37c10.94-7.878,16.88-18.182,17.692-30.656 c0.63-9.506,0.148-20.767-1.454-33.603l-4.464-28.918c11.425-3.814,21.007-10.707,28.473-20.462 c7.926-10.303,12.391-22.47,13.296-36.167c1.103-16.823-2.913-32.079-11.962-45.34c-9.918-14.543-23.52-22.478-40.406-23.582 c-1.948-0.126-3.988-0.112-6.12,0.046l-4.744-35.516c13.168-11.257,23.832-25.409,31.723-42.092 c7.798-16.574,12.383-34.514,13.608-53.305c0.718-11.046-0.797-24.754-4.508-40.761c-5.086-21.718-12.335-32.586-22.201-33.238 c-3.49-0.218-7.33,1.557-12.015,5.677c-11.377,10.285-19.656,22.728-24.609,36.96c-3.833,10.87-6.368,25.403-7.548,43.208 c-0.579,8.869,0.826,23.942,4.328,46.059C189.015,150.517,173.957,165.542,165.156,176.583z" stroke="black" stroke-width="4" fill="none" />

                <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#002934" />
                        <stop offset="100%" stop-color="#00b8ab" />
                    </linearGradient>
                </defs>
                <path d="M 60 170 C 30 130, 30 70, 100 50 C 170 70, 170 130, 140 170" stroke="url(#waveGradient)" stroke-width="10" fill="none" />
            </svg>



            <h1 className="text-xl font-bold mb-4">ChordCove - 和弦编辑器</h1>

            {/* 🎵 元数据输入 */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="曲名（必填）"
            />
            <input
                type="text"
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                placeholder="作曲者"
            />
            <input
                type="text"
                value={singer}
                onChange={(e) => setSinger(e.target.value)}
                className="w-full p-2 border rounded mb-4"
                placeholder="演唱者"
            />

            {/* 🎵 和弦渲染 */}
            <SheetRenderer lyrics={lyrics} setLyrics={setLyrics} />
            <SheetDisplay lyrics={lyrics}  />

            {/* 🎵 乐谱编辑 */}
            <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="w-full mt-4 h-32 p-2 border rounded mb-4"
                placeholder="输入和弦和歌词，例如：[G]春风又[C]绿江南岸"
            />

            {/* 🎵 上传按钮 */}
            <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
            >
                {uploading ? "上传中..." : "上传乐谱"}
            </button>

            {/* 🎵 状态消息 */}
            {message && <p className="mt-2 text-center text-red-500">{message}</p>}
        </div>
    );
}
