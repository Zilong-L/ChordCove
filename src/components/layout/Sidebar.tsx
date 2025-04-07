import { Link } from "react-router-dom";
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

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  return (
    <aside
      className={`fixed left-0 top-0 z-10 h-screen border-r border-[var(--border-primary)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-transform duration-300 ease-in-out ${
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
      }`}
    >
      <div className="flex h-16 items-center px-4"></div>
      <ul className="space-y-2 px-4 pb-4">
        <li>
          <Link
            to="/"
            className="flex cursor-pointer items-center gap-2 rounded p-4 hover:bg-[var(--bg-hover)]"
          >
            <GlobeAsiaAustraliaIcon className="h-5 w-5" />
            Explore
          </Link>
        </li>
        <Link
          to="/create"
          onClick={() => {
            dispatch(resetSimpleScore());
            dispatch(resetSheetMetadata());
          }}
          className="flex cursor-pointer items-center gap-2 rounded p-4 hover:bg-[var(--bg-hover)]"
        >
          <PencilIcon className="h-5 w-5" />
          创建乐谱
        </Link>
        {isAuthenticated && (
          <>
            <li>
              <Link
                to="/my-sheets"
                className="flex cursor-pointer items-center gap-2 rounded p-4 hover:bg-[var(--bg-hover)]"
              >
                <MusicalNoteIcon className="h-5 w-5" />
                我的谱子
              </Link>
            </li>
            <li>
              <Link
                to="/liked"
                className="flex cursor-pointer items-center gap-2 rounded p-4 hover:bg-[var(--bg-hover)]"
              >
                <HeartIcon className="h-5 w-5" />
                喜欢
              </Link>
            </li>
          </>
        )}
        <li className="cursor-pointer rounded hover:bg-[var(--bg-hover)]"></li>
      </ul>
    </aside>
  );
}
