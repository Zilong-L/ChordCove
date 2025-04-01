import { useEffect, useState } from "react";
import { fetchApi, API_BASE_URL } from "@utils/api";
import ArtistCard from "./ArtistCard";
import Carousel from "./Carousel";

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
  const [currentIndex, setCurrentIndex] = useState(0);

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

  function handleScroll(direction: "left" | "right") {
    let nextIndex = currentIndex;
    if (direction === "left") {
      nextIndex -= 3;
    } else {
      nextIndex += 3;
    }
    setCurrentIndex(Math.max(0, Math.min(nextIndex, artists.length - 1)));
  }

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
    <div className="group relative -mx-6">
      <h2 className="ml-6 text-3xl font-bold hover:cursor-pointer hover:underline">Artists</h2>
      <Carousel
        currentIndex={currentIndex}
        onScroll={handleScroll}
        showLeftGradient={currentIndex > 0}
        itemWidth={14}
        itemCounts={artists.length}
      >
        {artists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} imageClassName="w-[12rem]" />
        ))}
      </Carousel>
    </div>
  );
}
