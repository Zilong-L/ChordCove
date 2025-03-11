import { useEffect, useState } from "react";
import AlbumCard from "@components/basic/AlbumCard";
import { SheetMetaData } from "@/types/sheet";
export default function HomePage() {
    const [sheets, setSheets] = useState< SheetMetaData[]|null>(null);

    useEffect(() => {
        fetch("http://localhost:8787/api/recent-sheets")
            .then((res) => res.json())
            .then((data) => setSheets(data))
            .catch((err) => console.error("Error fetching sheets:", err));
    }, []);

    return (
        <div className="flex h-[92vh]  bg-gradient-to-b from-[#313131] to-[#121212] text-white ">
            {/* 左侧栏（占 20% 宽度） */}
            <aside className="w-1/5 p-4 border-r border-gray-700">
                <h2 className="text-xl font-bold mb-4">Navigation</h2>
                <ul className="space-y-2">
                    <li className="p-2 rounded hover:bg-gray-800 cursor-pointer">All Sheets</li>
                    <li className="p-2 rounded hover:bg-gray-800 cursor-pointer">Popular</li>
                    <li className="p-2 rounded hover:bg-gray-800 cursor-pointer">Recent Uploads</li>
                </ul>
            </aside>

            {/* 右侧栏（占 80% 宽度） */}
            <main className="w-4/5 p-6 overflow-scroll overflow-x-hidden">
                <h1 className="text-3xl font-bold mb-6 hover:underline hover:cursor-pointer">    Recent Uploads</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {!sheets && Array.from({ length: 3 }).map((_, i) => (
                        <AlbumCard key={i} />
                    ))}
                    {sheets!==null&&sheets.map((sheet) => (
                        <AlbumCard key={sheet.id} sheet={sheet} />
                    ))}
                </div>
            </main>
        </div>
    );
}
