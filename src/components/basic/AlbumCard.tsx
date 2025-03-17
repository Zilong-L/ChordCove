import { Link } from "react-router-dom";
import { SheetMetaData } from "@/types/sheet";
import PlayTriangle from "./PlayTriangle";

interface AlbumCardProps {
  sheet?: SheetMetaData;
}

export default function AlbumCard({ sheet }: AlbumCardProps) {
  if (!sheet) {
    return (
      <div className="animate-pulse">
        <div className="aspect-square bg-gray-700 rounded-lg mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <Link
      to={`/sheet/${sheet.id}`}
      className="group relative hover:bg-[#2f2f2f] p-4 rounded-lg"
    >
      <PlayTriangle containerClassName="absolute bottom-20 group-hover:translate-y-[15%] right-4" />
      <div className="relative">
        <img
          src={sheet.coverImage || "/default-cover.jpg"}
          alt={sheet.title}
          className="aspect-square object-cover rounded-lg mb-2"
        />
      </div>
      <h3 className="font-medium truncate">{sheet.title}</h3>
      <p className="text-sm text-gray-400 truncate">
        {sheet.singers?.map(singer => singer.name).join(", ") || "Unknown Singer"}
      </p>
    </Link>
  );
}
