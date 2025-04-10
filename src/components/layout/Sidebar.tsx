import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import {
  HeartIcon,
  PencilIcon,
  MusicalNoteIcon,
  GlobeAsiaAustraliaIcon,
} from "@heroicons/react/24/outline";
import { resetSheetMetadata } from "@stores/sheetMetadataSlice";
import { resetSimpleScore } from "@stores/simpleScoreSlice";
import { useUiStore } from "@stores/uiStore";
import { v4 as uuidv4 } from "uuid";
import { addLocalSheet } from "../../lib/localsheet";

export default function Sidebar() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSidebarOpen = useUiStore((state) => state.isMobileSidebarOpen);

  const handleCreateSheet = async () => {
    try {
      dispatch(resetSimpleScore());
      dispatch(resetSheetMetadata());

      const localKey = uuidv4();

      const initialMetadata = {
        title: "未命名乐谱",
      };

      const initialContent = {
        key: "C3",
        tempo: 120,
        timeSignature: "4/4",
        content: "[I]你存在，我[IV]深深地脑海里",
      };

      await addLocalSheet({
        localKey,
        metadata: initialMetadata,
        content: initialContent,
      });

      console.log(`Created local draft with key: ${localKey}`);

      navigate(`/editor/${localKey}`);
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
            onClick={handleCreateSheet}
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
