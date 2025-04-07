import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { HeartIcon, PencilIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { resetSheetMetadata } from "@stores/sheetMetadataSlice";
import { resetSimpleScore } from "@stores/simpleScoreSlice";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
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
        {isAuthenticated && (
          <li>
            <Link
              to="/liked"
              className="flex cursor-pointer items-center gap-2 rounded p-4 hover:bg-[var(--bg-hover)]"
            >
              <HeartIcon className="h-5 w-5" />
              喜欢
            </Link>
          </li>
        )}
        <li className="cursor-pointer rounded hover:bg-[var(--bg-hover)]">
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
        </li>
      </ul>
    </aside>
  );
}
