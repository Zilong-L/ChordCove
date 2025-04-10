import React, { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";
import SheetCard from "@components/basic/sheet/SheetCard";
import { Link } from "react-router-dom";
import { getAllLocalSheetMetadata, LocalSheetMetadata } from "../lib/localsheet";

interface LocalSheetCardProps {
  sheet: LocalSheetMetadata;
}

// A simpler card for local drafts
const LocalSheetCard: React.FC<LocalSheetCardProps> = ({ sheet }) => {
  // Calculate how long ago the sheet was saved
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffSeconds = Math.round((now - timestamp) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}秒前`;

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}天前`;
  };

  // Get sync status
  const getSyncStatus = (sheet: LocalSheetMetadata): string => {
    if (!sheet.serverId) return "草稿";
    console.log(sheet.serverModifiedAt, sheet.localLastSavedAt);
    if (sheet.serverModifiedAt && sheet.localLastSavedAt > sheet.serverModifiedAt) {
      return "本地已编辑";
    }
    return "已同步";
  };

  return (
    <Link to={`/editor/${sheet.localKey}`} className="block">
      <div className="overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-shadow hover:shadow-md">
        <div className="flex aspect-[1.5/1] items-center justify-center bg-[var(--bg-tertiary)] p-4">
          <div className="text-center">
            <span className="block truncate text-xl font-semibold">
              {sheet.title || "未命名乐谱"}
            </span>
            <span className="mt-2 inline-block rounded-full bg-[var(--bg-page)] px-3 py-1 text-xs">
              {getSyncStatus(sheet)}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm text-[var(--text-secondary)]">
            更新于: {getRelativeTime(sheet.localLastSavedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
};

const MySheetsPage: React.FC = () => {
  const [serverSheets, setServerSheets] = useState<SheetMetaData[]>([]);
  const [localSheets, setLocalSheets] = useState<LocalSheetMetadata[]>([]);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(true);
  const [isLoadingLocal, setIsLoadingLocal] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load server sheets
  useEffect(() => {
    const loadUserSheets = async () => {
      setIsLoadingServer(true);
      setError(null);
      try {
        const data = await fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/user/sheets`);
        setServerSheets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your sheets");
        console.error("Error fetching user sheets:", err);
      } finally {
        setIsLoadingServer(false);
      }
    };

    loadUserSheets();
  }, []);

  // Load local sheets
  useEffect(() => {
    const loadLocalSheets = async () => {
      setIsLoadingLocal(true);
      try {
        const sheets = await getAllLocalSheetMetadata();
        sheets.sort(
          (a: LocalSheetMetadata, b: LocalSheetMetadata) => b.localLastSavedAt - a.localLastSavedAt
        );
        setLocalSheets(sheets);
      } catch (err) {
        console.error("Error fetching local sheets:", err);
        // We don't set the error state here to avoid blocking display of server sheets
      } finally {
        setIsLoadingLocal(false);
      }
    };

    loadLocalSheets();
  }, []);

  const renderServerContent = () => {
    if (isLoadingServer) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 aspect-square rounded-lg bg-[var(--bg-tertiary)]"></div>
              <div className="mb-1 h-4 w-3/4 rounded bg-[var(--bg-tertiary)]"></div>
              <div className="h-4 w-1/2 rounded bg-[var(--bg-tertiary)]"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-64 items-center justify-center rounded border border-red-300 bg-red-50 p-4 text-red-500">
          Error: {error}
        </div>
      );
    }

    if (serverSheets.length === 0) {
      return (
        <div className="py-5 text-center text-[var(--text-secondary)]">
          <p>你还没有上传任何谱子。</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {serverSheets.map((sheet) => (
          <SheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>
    );
  };

  const renderLocalContent = () => {
    if (isLoadingLocal) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 aspect-square rounded-lg bg-[var(--bg-tertiary)]"></div>
              <div className="mb-1 h-4 w-3/4 rounded bg-[var(--bg-tertiary)]"></div>
              <div className="h-4 w-1/2 rounded bg-[var(--bg-tertiary)]"></div>
            </div>
          ))}
        </div>
      );
    }

    if (localSheets.length === 0) {
      return (
        <div className="py-5 text-center text-[var(--text-secondary)]">
          <p>没有本地草稿。</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {localSheets.map((sheet) => (
          <LocalSheetCard key={sheet.localKey} sheet={sheet} />
        ))}
      </div>
    );
  };

  const isLoading = isLoadingServer || isLoadingLocal;
  const hasNoSheets = serverSheets.length === 0 && localSheets.length === 0 && !isLoading && !error;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">我的谱子</h1>
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            const button = document.querySelector('button[aria-label="创建乐谱"]');
            if (button instanceof HTMLElement) {
              button.click();
            }
          }}
          className="rounded bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        >
          创建新谱子
        </Link>
      </div>

      {hasNoSheets ? (
        <div className="py-10 text-center text-[var(--text-secondary)]">
          <p>你还没有上传或创建任何谱子。</p>
          <button
            onClick={() => {
              const button = document.querySelector('button[aria-label="创建乐谱"]');
              if (button instanceof HTMLElement) {
                button.click();
              }
            }}
            className="mt-4 inline-block rounded bg-[var(--bg-secondary)] px-6 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            创建你的第一个谱子
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">本地草稿</h2>
            {renderLocalContent()}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">已上传的谱子</h2>
            {renderServerContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default MySheetsPage;
