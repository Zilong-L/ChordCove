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
      className="group relative rounded-md p-4 text-center hover:bg-[#2f2f2f]"
    >
      <PlayTriangle containerClassName="absolute bottom-6 group-hover:translate-y-[15%] right-4" />
      {artist.image ? (
        <img
          src={artist.image}
          alt={artist.name}
          className="mb-2 aspect-square w-full rounded-full object-cover transition-opacity"
        />
      ) : (
        <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-full bg-gray-700 transition-colors">
          <span className="text-4xl">{artist.name[0]}</span>
        </div>
      )}
      <h3 className="truncate px-2 font-medium">{artist.name}</h3>
      <p className="text-sm text-gray-400">
        {artist.sheets.length} {artist.sheets.length === 1 ? "sheet" : "sheets"}
      </p>
    </Link>
  );
}
