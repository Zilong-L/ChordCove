import { useEffect, useState } from "react";
import { fetchApi, API_BASE_URL } from "@utils/api";
import ArtistCard from "./ArtistCard";

interface Artist {
  id: number;
  name: string;
  description: string;
  image: string;
  created_at: string;
  sheets: Array<{
    id: string;
    title: string;
    coverImage: string;
    role: string;
  }>;
}

export default function ArtistRow() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await fetchApi<Artist[]>(`${API_BASE_URL}/api/artists`);
        setArtists(data);
      } catch (err) {
        console.error("Error fetching artists:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="mb-6 text-3xl font-bold hover:cursor-pointer hover:underline">Artists</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 aspect-square w-full rounded-full bg-[var(--bg-quaternary)]"></div>
              <div className="mx-auto h-4 w-3/4 rounded bg-[var(--bg-quaternary)]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="mb-6 text-3xl font-bold hover:cursor-pointer hover:underline">Artists</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}
