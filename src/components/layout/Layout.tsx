import { Outlet } from "react-router-dom";
import Header from "@components/layout/Header";
import Sidebar from "@components/layout/Sidebar";
import { useUiStore } from "@stores/uiStore";

export default function Layout() {
  const isSidebarOpen = useUiStore((state) => state.isMobileSidebarOpen);

  return (
    <div className="relative min-h-screen bg-[var(--bg-page)]">
      <Header />
      <Sidebar />
      <main
        className={`min-h-[calc(100vh-4rem)] overflow-x-hidden bg-[var(--bg-page)] transition-[padding-left] duration-300 ease-in-out ${
          isSidebarOpen ? "md:pl-64" : "md:pl-[5.5rem]"
        }`}
      >
        <div className="px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
