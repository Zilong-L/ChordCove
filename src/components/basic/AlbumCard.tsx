import * as motion from "motion/react-client";
import { SheetMetaData } from "@/types/sheet";

export default function AlbumCard({ sheet }: { sheet?: SheetMetaData }) {
    if (!sheet) {
        return (
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg animate-pulse">
                <div className="w-full h-40 bg-gray-700"></div>
                <div className="p-4">
                    <div className="h-5 bg-gray-600 w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-700 w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            key={sheet.id}
            className=" rounded-lg relative overflow-hidden  cursor-pointer hover:bg-[#2f2f2f] transition-color duration-200 group"
        >
            <div className=" px-4 py-2 absolute bottom-6 group-hover:translate-y-[15%]  right-4 bg-green-800 transition-transform opacity-0 duration-1000 group-hover:opacity-100 hover:bg-green-700 rounded-md">学这首！</div>
            <img
                src={sheet["image-url"] ? `https://${sheet["image-url"]}` : "https://via.placeholder.com/150"}
                alt={sheet.title}
                className="w-full  aspect-square object-cover"
            />
            <div className="p-4">
                <h3 className="text-lg font-semibold">{sheet.title}</h3>
                <p className="text-sm text-gray-400">{sheet.singer || "Unknown Singer"}</p>
            </div>
        </motion.div>
    );
}
