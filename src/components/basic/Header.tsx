import { Link, useLocation } from "react-router-dom";
import { resetSheetMetadata } from "@stores/sheetMetadataSlice";
import { resetSimpleScore } from "@stores/simpleScoreSlice";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@stores/authSlice";
import { RootState } from "@stores/store";
import ThemeToggle from "@components/ThemeToggle";

export default function Header() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 bg-transparent p-4">
      <div className="flex max-w-[90%] items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[var(--text-primary)]">
          ChordCove
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] ${
              location.pathname === "/" ? "text-[var(--text-primary)]" : ""
            }`}
          >
            首页
          </Link>
          <Link
            to="/create"
            onClick={() => {
              dispatch(resetSimpleScore());
              dispatch(resetSheetMetadata());
            }}
            className={`text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] ${
              location.pathname === "/create" ? "text-[var(--text-primary)]" : ""
            }`}
          >
            创建乐谱
          </Link>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
            >
              退出
            </button>
          ) : (
            <Link
              to="/login"
              className={`text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)] ${
                location.pathname === "/login" ? "text-[var(--text-primary)]" : ""
              }`}
            >
              登录
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
