import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import {
  HeartIcon,
  PencilIcon,
  MusicalNoteIcon,
  GlobeAsiaAustraliaIcon,
} from "@heroicons/react/24/outline";
import { createSimpleSheet, } from "../../utils/idb/sheetEditing";
import { useUiStore } from "@stores/uiStore";
export default function Sidebar() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const isSidebarOpen = useUiStore((state) => state.isMobileSidebarOpen);

  const handleCreateSimpleSheet = async () => {
    try {
      const { url } = await createSimpleSheet();
      navigate(url);
    } catch (error) {
      console.error("Failed to create sheet draft:", error);
    }
  };

  return (
    <aside
      className={
        `fixed left-0 top-0 z-10 h-screen overflow-hidden border-r border-[var(--border-primary)] ` +
        `bg-[var(--bg-page)] text-[var(--text-primary)] transition-[width] duration-300 ease-in-out` +
        ` ${isSidebarOpen ? "w-64 translate-x-0" : "w-0"} ` +
        ` md:translate-x-0 ${isSidebarOpen ? "md:w-64" : "md:w-[5.5rem]"}`
      }
    >
      <div className="flex h-16 items-center px-4"></div>
      <ul className="space-y-2 px-4 pb-4">
        <li>
          <Link
            to="/"
            className="flex cursor-pointer items-center gap-8 rounded p-4 hover:bg-[var(--bg-hover)]"
          >
            <GlobeAsiaAustraliaIcon className="h-6 w-6 flex-shrink-0" />
            <span className="whitespace-nowrap">Explore</span>
          </Link>
        </li>
        <li>
          <button
            onClick={handleCreateSimpleSheet}
            className="flex w-full cursor-pointer items-center gap-8 rounded p-4 text-left hover:bg-[var(--bg-hover)]"
            aria-label="创建乐谱"
          >
            <PencilIcon className="h-6 w-6 flex-shrink-0" />
            <span className="whitespace-nowrap">创建乐谱</span>
          </button>
        </li>
        {isAuthenticated && (
          <>
            <li>
              <Link
                to="/my-sheets"
                className="flex cursor-pointer items-center gap-8 rounded p-4 hover:bg-[var(--bg-hover)]"
              >
                <MusicalNoteIcon className="h-6 w-6 flex-shrink-0" />
                <span className="whitespace-nowrap">我的谱子</span>
              </Link>
            </li>
            <li>
              <Link
                to="/liked"
                className="flex cursor-pointer items-center gap-8 rounded p-4 hover:bg-[var(--bg-hover)]"
              >
                <HeartIcon className="h-6 w-6 flex-shrink-0" />
                <span className="whitespace-nowrap">喜欢</span>
              </Link>
            </li>
          </>
        )}
        <li className="cursor-pointer rounded hover:bg-[var(--bg-hover)]"></li>
      </ul>
    </aside>
  );
}
