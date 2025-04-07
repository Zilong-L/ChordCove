import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@components/layout/Header";
import Sidebar from "@components/layout/Sidebar";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-page)]">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      <main
        className={`min-h-[calc(100vh-4rem)] overflow-x-hidden bg-[var(--bg-page)] transition-[padding-left] duration-300 ease-in-out ${
          isSidebarOpen ? "pl-64" : "pl-0"
        }`}
      >
        <div className="px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
