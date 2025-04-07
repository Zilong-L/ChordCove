import { useState, useEffect } from "react";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { fetchApi, API_BASE_URL } from "@utils/api"; // Import fetchApi and API_BASE_URL

// Function to get the auth token (replace with your actual implementation)
// This function might become redundant if fetchApi handles token retrieval internally via the store
// const getAuthToken = (): string | null => {
//   // Example: return localStorage.getItem('authToken');
//   return "dummy-token"; // Placeholder - Replace with real token logic
// };

interface LikeButtonProps {
  sheetId: string;
  onLikeToggle?: (liked: boolean) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ sheetId, onLikeToggle }) => {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For toggle action
  const [isFetchingStatus, setIsFetchingStatus] = useState(true); // For initial status fetch

  useEffect(() => {
    const fetchLikeStatus = async () => {
      setIsFetchingStatus(true);
      // const token = getAuthToken(); // fetchApi handles the token via store

      // Create headers object - fetchApi handles headers
      // const headers: HeadersInit = {
      //   "Content-Type": "application/json",
      // };
      // Conditionally add Authorization header - fetchApi handles this
      // if (token) {
      //   headers["Authorization"] = `Bearer ${token}`;
      // }

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

        // fetchApi throws an error if !response.ok, so specific status checks here are less direct
        // if (!response.ok) {
        //   if (response.status === 404 || response.status === 401) {
        //     // Treat Not Found or Unauthorized as not liked
        //     // fetchApi attempts refresh on 401. Error implies refresh failed or no token.
        //     // Assuming 404 also throws an error that lands in catch.
        //     setLiked(false);
        //   } else {
        //     throw new Error(`Failed to fetch like status: ${response.statusText}`);
        //   }
        // } else {
        //   const data = await response.json();
        //   setLiked(data.liked); // Assuming API returns { liked: boolean }
        // }
      } catch (error) {
        console.error("Error fetching like status:", error);
        // Default to not liked on any error (including 401 after refresh fail, 404, etc.)
        setLiked(false);
      } finally {
        setIsFetchingStatus(false);
      }
    };

    if (sheetId) {
      fetchLikeStatus();
    }
  }, [sheetId]);

  const toggleLike = async () => {
    if (isLoading || liked === null || isFetchingStatus) return;
    setIsLoading(true);
    const previousLikedState = liked;
    const newLikedState = !liked;
    setLiked(newLikedState);
    // const token = getAuthToken(); // fetchApi handles the token

    // Create headers object - fetchApi handles headers
    // const headers: HeadersInit = {
    //   "Content-Type": "application/json",
    // };
    // Conditionally add Authorization header - fetchApi handles this
    // if (token) {
    //   headers["Authorization"] = `Bearer ${token}`;
    // }

    try {
      // Use fetchApi instead of raw fetch
      // Assuming the endpoint returns ApiResponse<void> or similar on success
      await fetchApi<void>(`${API_BASE_URL}/api/sheets/${sheetId}/like`, {
        method: newLikedState ? "POST" : "DELETE",
        // headers: headers, // fetchApi handles headers
      });

      // fetchApi throws error if !response.ok
      // if (!response.ok) {
      //   if (response.status === 401) {
      //     // fetchApi handles 401 refresh attempt. Error here means it failed.
      //     console.error("Unauthorized or token refresh failed: Cannot update like status.");
      //     // Optionally redirect to login or show a message
      //   } else {
      //     throw new Error(`Failed to update like status: ${response.statusText}`);
      //   }
      //   // Revert optimistic update on error
      //   setLiked(previousLikedState);
      // } else {
      // Success case
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
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 p-2 dark:bg-gray-700"></div>
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
