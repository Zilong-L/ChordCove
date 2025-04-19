import { v4 as uuidv4 } from "uuid";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@stores/store";
import { addLocalSheet, findLocalSheetByServerId } from "@utils/idb/localsheet";

// Rename for more clarity
export function EditSheetButton({ loading }: { loading: boolean }) {
  const navigate = useNavigate();

  // Get current sheet data from Redux store
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const simpleScore = useSelector((state: RootState) => state.simpleScore);

  const handleEditSheet = async () => {
    try {
      // Check if we already have a local copy of this sheet
      if (sheetMetadata.id) {
        const existingLocalKey = await findLocalSheetByServerId(sheetMetadata.id);
        console.log(`Searching for existing local copy with server ID `, sheetMetadata);
        if (existingLocalKey) {
          //get local metadata
          const localMetadata = await findLocalSheetByServerId(sheetMetadata.id);
          console.log(`Found existing local copy with key: ${existingLocalKey}`, localMetadata);
          console.log(`Found existing local copy with key: ${existingLocalKey}`);
          navigate(`/editor/${sheetMetadata.sheetType}/${existingLocalKey}`);
          return;
        }
      }

      // No existing copy found, create a new one
      const localKey = uuidv4();

      // Prepare metadata to save with ALL fields
      const metadata = {
        title: sheetMetadata.title,
        serverId: sheetMetadata.id, // Store the server ID to track relationship
        composers: sheetMetadata.composers || [],
        singers: sheetMetadata.singers || [],
        coverImage: sheetMetadata.coverImage || "",
        uploader: sheetMetadata.uploader || "",
        uploaderId: sheetMetadata.uploaderId || -1,
        bvid: sheetMetadata.bvid || "",
        sheetType: "simple" as const

      };

      // Prepare content to save
      const content = {
        key: simpleScore.key,
        tempo: simpleScore.tempo,
        timeSignature: simpleScore.timeSignature,
        content: simpleScore.content,
      };

      // Save current sheet data to IndexedDB
      await addLocalSheet({
        localKey,
        metadata,
        content,
      });

      console.log(`Created local copy for editing with key: ${localKey}`);

      // Navigate to the editor with the local key
      navigate(`/editor/simple/${localKey}`);
    } catch (error) {
      console.error("Failed to create sheet copy for editing:", error);
    }
  };

  return (
    <button
      onClick={handleEditSheet}
      className="rounded-full p-2 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-gray-700"
      aria-label="Edit sheet"
      disabled={loading}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-6 w-6"
      >
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5a2.75 2.75 0 002.75-2.75V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
      </svg>
    </button>
  );
}
