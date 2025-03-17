import { Link } from "react-router-dom";
import PlayTriangle from "./PlayTriangle";

interface Artist {
  id: number;
  name: string;
  image: string;
  sheets: Array<{
    id: string;
    title: string;
    coverImage: string;
    role: string;
  }>;
}

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="p-4 text-center group relative hover:bg-[#2f2f2f] rounded-md"
    >
      <PlayTriangle containerClassName="absolute bottom-6 group-hover:translate-y-[15%] right-4" />
      {artist.image ? (
        <img
          src={artist.image}
          alt={artist.name}
          className="w-full aspect-square object-cover rounded-full mb-2 transition-opacity"
        />
      ) : (
        <div className="w-full aspect-square bg-gray-700 rounded-full mb-2 flex items-center justify-center transition-colors">
          <span className="text-4xl">{artist.name[0]}</span>
        </div>
      )}
      <h3 className="font-medium truncate px-2">{artist.name}</h3>
      <p className="text-sm text-gray-400">
        {artist.sheets.length} {artist.sheets.length === 1 ? "sheet" : "sheets"}
      </p>
    </Link>
  );
} 