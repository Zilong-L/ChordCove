import React, { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";
import SheetCard from "@components/basic/sheet/SheetCard";
import { useNavigate } from "react-router-dom";
import { PlusIcon, DocumentIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { createSimpleSheet, createFullSheet } from "../utils/idb/sheetEditing";
import LocalSheetCard from "@components/basic/sheet/LocalSheetCard";
import { getAllLocalSheetMetadata, LocalSheetMetadata, deleteLocalSheet } from "../utils/idb/localsheet";
import { Popover, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const MySheetsPage: React.FC = () => {
  const navigate = useNavigate();
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
        sheets.sort((a, b) => b.localLastSavedAt - a.localLastSavedAt);
        setLocalSheets(sheets);
      } catch (err) {
        console.error("Error fetching local sheets:", err);
      } finally {
        setIsLoadingLocal(false);
      }
    };
    loadLocalSheets();
  }, []);

  const handleDeleteLocalSheet = async (localKey: string) => {
    await deleteLocalSheet(localKey);
    setLocalSheets(prev => prev.filter(s => s.localKey !== localKey));
  };

  const renderServerContent = () => {
    if (isLoadingServer) {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded border border-red-300 bg-red-50 p-4 text-red-500">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mb-2" />
          <span className="font-semibold">出错了</span>
          <span className="text-sm">Error: {error}</span>
        </div>
      );
    }

    if (serverSheets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-[var(--text-secondary)]">
          <DocumentIcon className="mb-2 h-10 w-10 text-[var(--text-tertiary)]" />
          <p>你还没有上传任何谱子。</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {serverSheets.map(sheet => (
          <SheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>
    );
  };

  const renderLocalContent = () => {
    if (isLoadingLocal) {
      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 aspect-square rounded-lg bg-[var(--bg-tertiary)]"></div>
              <div className="mb-1 h-4 w-3/4 rounded bg[var(--bg-tertiary)]"></div>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {localSheets.map(sheet => (
          <LocalSheetCard
            key={sheet.localKey}
            sheet={sheet}
            onDelete={handleDeleteLocalSheet}
          />
        ))}
      </div>
    );
  };

  const isLoading = isLoadingServer || isLoadingLocal;
  const hasNoSheets = serverSheets.length === 0 && localSheets.length === 0 && !isLoading && !error;

  const renderCreatePopover = (isMainButton = false) => (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`
              ${open ? '' : 'text-opacity-90'}
              ${isMainButton ? 'group inline-flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-5 py-2.5 text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
                : 'mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-6 py-2 text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'}
            `}
          >
            <PlusIcon className={`h-5 w-5 ${isMainButton ? 'text-[var(--primary)] transition group-hover:scale-110' : 'text-[var(--text-primary)]'}`} />
            <span className="font-medium">
              {isMainButton ? '创建新谱子' : '创建你的第一个谱子'}
            </span>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-3 w-screen max-w-sm transform px-4 sm:px-0 lg:max-w-3xl">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-[var(--border-primary)]">
                <div className="relative grid gap-8 bg-[var(--bg-page)] p-7 lg:grid-cols-2">
                  <button
                    onClick={async () => {
                      const { url } = await createSimpleSheet();
                      navigate(url);
                    }}
                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-[var(--bg-hover)] focus:outline-none focus-visible:ring focus-visible:ring-[var(--primary)]"
                  >
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">创建简单乐谱</p>
                      <p className="text-sm text-[var(--text-secondary)]">快速创建只有旋律的乐谱</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      const { url } = await createFullSheet();
                      navigate(url);
                    }}
                    className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-[var(--bg-hover)] focus:outline-none focus-visible:ring focus-visible:ring-[var(--primary)]"
                  >
                    <div className="ml-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">创建完整乐谱</p>
                      <p className="text-sm text-[var(--text-secondary)]">创建包含旋律和伴奏的完整乐谱</p>
                    </div>
                  </button>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4"></div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">我的谱子</h1>
        {renderCreatePopover(true)}
      </div>

      {hasNoSheets ? (
        <div className="flex flex-col items-center justify-center py-10 text-[var(--text-secondary)]">
          <DocumentIcon className="mb-2 h-10 w-10 text-[var(--text-tertiary)]" />
          <p>你还没有上传或创建任何谱子。</p>
          {renderCreatePopover()}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">本地草稿</h2>
            {renderLocalContent()}
          </div>
          <div>
            <h2 className="mb-4 text-xl font-semibold text[var(--text-primary)]">已上传的谱子</h2>
            {renderServerContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default MySheetsPage;
