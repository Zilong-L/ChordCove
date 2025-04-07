import { useState, useEffect } from "react";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { fetchApi, API_BASE_URL } from "@utils/api"; // Import fetchApi and API_BASE_URL

interface LikeButtonProps {
  sheetId: string;
  onLikeToggle?: (liked: boolean) => void;
  initialState?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({ sheetId, onLikeToggle, initialState }) => {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For toggle action
  const [isFetchingStatus, setIsFetchingStatus] = useState(true); // For initial status fetch

  useEffect(() => {
    const fetchLikeStatus = async () => {
      setIsFetchingStatus(true);

      try {
        // Use fetchApi instead of raw fetch
        const data = await fetchApi<{ liked: boolean }>(
          `${API_BASE_URL}/api/sheets/${sheetId}/like-status`,
          {
            method: "GET",
            // headers: headers, // fetchApi handles headers
          }
        );
        setLiked(data.liked); // fetchApi returns the 'data' part of ApiResponse
      } catch (error) {
        console.error("Error fetching like status:", error);
        // Default to not liked on any error (including 401 after refresh fail, 404, etc.)
        setLiked(false);
      } finally {
        setIsFetchingStatus(false);
      }
    };

    if (initialState !== undefined) {
      setLiked(initialState);
      setIsFetchingStatus(false);

      console.log("initialState", initialState);
      return;
    }
    if (sheetId) {
      fetchLikeStatus();
    }
  }, [sheetId, initialState]);

  const toggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoading || liked === null || isFetchingStatus) return;
    setIsLoading(true);
    const previousLikedState = liked;
    const newLikedState = !liked;
    setLiked(newLikedState);

    try {
      // Use fetchApi instead of raw fetch
      // Assuming the endpoint returns ApiResponse<void> or similar on success
      await fetchApi<void>(`${API_BASE_URL}/api/sheets/${sheetId}/like`, {
        method: newLikedState ? "POST" : "DELETE",
        // headers: headers, // fetchApi handles headers
      });

      if (onLikeToggle) {
        onLikeToggle(newLikedState);
      }
      // }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on any error from fetchApi
      setLiked(previousLikedState);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingStatus || liked === null) {
    return (
      <div className={`rounded-full p-2`} aria-label={liked ? "Unlike" : "Like"}>
        <HeartIconOutline className="h-6 w-6 text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={`rounded-full p-2 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-gray-700 ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {liked ? (
        <HeartIconSolid className="h-6 w-6 text-red-500" />
      ) : (
        <HeartIconOutline className="h-6 w-6 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
};

export default LikeButton;
