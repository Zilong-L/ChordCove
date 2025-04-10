import { Bars3Icon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { logout } from "@stores/authSlice";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { RootState } from "@stores/store";
import ThemeToggle from "@components/ThemeToggle";
import { useUiStore } from "@stores/uiStore";
// import SearchBar from "@components/basic/search/SearchBar"; // Assuming search is in header
// import UserMenu from "@components/basic/user/UserMenu"; // Assuming user menu is in header

export default function Header() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const toggleSidebar = useUiStore((state) => state.toggleMobileSidebar);

  const handleLogout = () => {
    dispatch(logout());
  };
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-transparent px-4 py-2 text-[var(--text-primary)]">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="top-5 z-[100] ml-[1rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Assume Logo or other leading items might go here */}
        {/* <Link to="/" className="text-xl font-bold">ChordCove</Link> */}
      </div>
      <div className="flex flex-grow items-center justify-center px-4">
        {/* Assume SearchBar is centered */}
        {/* <SearchBar /> */}
      </div>
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
      <div className="flex items-center md:mr-24">
        {/* Assume UserMenu or other trailing items might go here */}
        {/* <UserMenu /> */}
      </div>
    </header>
  );
}
