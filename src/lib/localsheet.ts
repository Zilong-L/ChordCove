import { openDB, DBSchema, IDBPDatabase } from "idb";

// --- Database Definition ---

const DB_NAME = "ChordCoveDB";
const DB_VERSION = 2; // Increment version if schema changes
const METADATA_STORE = "localMetadata";
const CONTENT_STORE = "localContent";

// --- Interfaces (Align with plan) ---

// Define types for composers and singers
export interface Artist {
  id: number;
  name: string;
}

export interface LocalSheetMetadata {
  localKey: string; // Primary key (UUID generated by client)
  serverId?: string | null; // Server's ID (maps to sheets_metadata.id)
  title: string;
  // Add all metadata fields needed
  composers?: Artist[] | null;
  singers?: Artist[] | null;
  uploader?: string | null;
  uploaderId?: number | null;
  coverImage?: string | null;
  bvid?: string | null;
  createdAt?: number;
  sheetType: "simple" | "full";
  // Timestamps
  serverModifiedAt: number | null; // Timestamp from server sheets_metadata.createdAt
  localLastSavedAt: number; // Timestamp of the last local save action (to either store)
}

export interface LocalSheetContent {
  localKey: string; // Primary key (matches localMetadata.localKey)
  key: string; // Default C3 from simpleScoreSlice?
  tempo: number; // Default 120?
  timeSignature: string; // Change to string type to match SimpleScore
  content: string; // The core "[I]...[IV]..." data
}

interface ChordCoveDBSchema extends DBSchema {
  [METADATA_STORE]: {
    key: string; // localKey
    value: LocalSheetMetadata;
    indexes: { serverId: string; localLastSavedAt: number };
  };
  [CONTENT_STORE]: {
    key: string; // localKey
    value: LocalSheetContent;
    // No extra indexes needed for content store generally
  };
}

// --- Database Initialization ---

let dbPromise: Promise<IDBPDatabase<ChordCoveDBSchema>> | null = null;

export function initLocalSheetDB(): Promise<IDBPDatabase<ChordCoveDBSchema>> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB<ChordCoveDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);

      // Create/Upgrade Metadata Store
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        console.log(`Creating ${METADATA_STORE} store`);
        const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: "localKey" });
        metadataStore.createIndex("serverId", "serverId");
        metadataStore.createIndex("localLastSavedAt", "localLastSavedAt");
      }

      // Create/Upgrade Content Store
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        console.log(`Creating ${CONTENT_STORE} store`);
        db.createObjectStore(CONTENT_STORE, { keyPath: "localKey" });
      }
    },
    blocked() {
      console.error("IndexedDB access blocked. Close other tabs using the database?");
      // Potentially alert the user
    },
    blocking() {
      console.warn("IndexedDB upgrade blocked by another tab. Closing database connection.");
      // dbPromise?.close(); // Close the connection if possible
    },
    terminated() {
      console.error("IndexedDB connection terminated unexpectedly.");
      dbPromise = null; // Reset promise to allow re-initialization
    },
  });

  return dbPromise;
}

// --- Helper Functions ---

async function getDB(): Promise<IDBPDatabase<ChordCoveDBSchema>> {
  return initLocalSheetDB(); // Ensures DB is initialized
}

// --- CRUD Operations ---

export async function addLocalSheet(initialData: {
  localKey: string;
  metadata: Omit<LocalSheetMetadata, "localKey" | "serverModifiedAt" | "localLastSavedAt">;
  content: Omit<LocalSheetContent, "localKey">;
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([METADATA_STORE, CONTENT_STORE], "readwrite");
  const now = Date.now();

  const metadataRecord: LocalSheetMetadata = {
    localKey: initialData.localKey,
    serverId: initialData.metadata.serverId || null,
    title: initialData.metadata.title || "",
    composers: initialData.metadata.composers || null,
    singers: initialData.metadata.singers || null,
    uploader: initialData.metadata.uploader || null,
    uploaderId: initialData.metadata.uploaderId || null,
    coverImage: initialData.metadata.coverImage || null,
    bvid: initialData.metadata.bvid || null,
    createdAt: initialData.metadata.createdAt || now,
    serverModifiedAt: null,
    localLastSavedAt: now,
    sheetType: initialData.metadata.sheetType || "simple",
  };

  const contentRecord: LocalSheetContent = {
    ...initialData.content,
    localKey: initialData.localKey,
  };

  await Promise.all([
    tx.objectStore(METADATA_STORE).add(metadataRecord),
    tx.objectStore(CONTENT_STORE).add(contentRecord),
    tx.done,
  ]);
}

export async function getLocalSheetData(
  localKey: string
): Promise<{ metadata: LocalSheetMetadata; content: LocalSheetContent } | undefined> {
  const db = await getDB();
  // Use readonly transaction for reads
  const tx = db.transaction([METADATA_STORE, CONTENT_STORE], "readonly");
  const metadata = await tx.objectStore(METADATA_STORE).get(localKey);
  const content = await tx.objectStore(CONTENT_STORE).get(localKey);
  await tx.done;

  if (metadata && content) {
    return { metadata, content };
  }
  return undefined;
}

export async function getAllLocalSheetMetadata(): Promise<LocalSheetMetadata[]> {
  const db = await getDB();
  return db.getAll(METADATA_STORE);
}

export async function updateLocalSheetMetadata(
  localKey: string,
  updates: Omit<LocalSheetMetadata, "localKey" | "serverModifiedAt" | "localLastSavedAt">
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(METADATA_STORE, "readwrite");
  const store = tx.objectStore(METADATA_STORE);
  const currentRecord = await store.get(localKey);

  if (currentRecord) {
    const updatedRecord: LocalSheetMetadata = {
      ...currentRecord,
      ...updates,
      localLastSavedAt: Date.now(), // Update local save time
    };
    await store.put(updatedRecord);
  }
  await tx.done;
}

export async function updateLocalSheetContent(
  localKey: string,
  updates: Partial<Omit<LocalSheetContent, "localKey">>
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([CONTENT_STORE, METADATA_STORE], "readwrite");
  const contentStore = tx.objectStore(CONTENT_STORE);
  const metadataStore = tx.objectStore(METADATA_STORE);

  const currentContent = await contentStore.get(localKey);
  const currentMetadata = await metadataStore.get(localKey);

  const now = Date.now();
  let updateMetadata = false;

  if (currentContent) {
    const updatedContent: LocalSheetContent = {
      ...currentContent,
      ...updates,
    };
    await contentStore.put(updatedContent);
    updateMetadata = true; // Content changed, so update metadata timestamp
  }

  if (currentMetadata && updateMetadata) {
    const updatedMetadata: LocalSheetMetadata = {
      ...currentMetadata,
      localLastSavedAt: now,
    };
    await metadataStore.put(updatedMetadata);
  }

  await tx.done;
}

// Ensure serverData structure matches the planned UpsertSheetResponse
export async function updateLocalSheetAfterSync(
  localKey: string,
  serverData: {
    id: string;
    coverImage?: string;
    createdAt?: number;
    lastModified: number;
  }
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([METADATA_STORE, CONTENT_STORE], "readwrite");
  const metadataStore = tx.objectStore(METADATA_STORE);
  const contentStore = tx.objectStore(CONTENT_STORE);

  const currentMetadata = await metadataStore.get(localKey);
  const currentContent = await contentStore.get(localKey);

  if (!currentMetadata || !currentContent) {
    console.error(`Cannot sync sheet ${localKey}: Local record not found.`);
    await tx.abort(); // Abort transaction if records are missing
    return;
  }

  const serverModifiedTime = serverData.lastModified; // Alias for clarity

  // Update Metadata
  const updatedMetadata: LocalSheetMetadata = {
    ...currentMetadata,
    serverId: serverData.id,
    coverImage: serverData.coverImage || currentMetadata.coverImage,
    createdAt: serverData.createdAt || currentMetadata.createdAt,
    serverModifiedAt: serverModifiedTime,
    localLastSavedAt: serverModifiedTime, // Align local save time with successful sync time
  };

  await metadataStore.put(updatedMetadata);
  await tx.done;
}

export async function deleteLocalSheet(localKey: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([METADATA_STORE, CONTENT_STORE], "readwrite");
  await Promise.all([
    tx.objectStore(METADATA_STORE).delete(localKey),
    tx.objectStore(CONTENT_STORE).delete(localKey),
    tx.done,
  ]);
}

// Find a local sheet by its server ID
export async function findLocalSheetByServerId(serverId: string): Promise<string | null> {
  if (!serverId) return null;

  const db = await getDB();
  const tx = db.transaction(METADATA_STORE, "readonly");
  const index = tx.objectStore(METADATA_STORE).index("serverId");

  // Get the first match from the index
  const firstMatch = await index.get(serverId);
  await tx.done;

  return firstMatch ? firstMatch.localKey : null;
}
