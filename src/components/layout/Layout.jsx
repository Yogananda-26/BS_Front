import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_MINI_WIDTH } from "./Sidebar";

const MOBILE_BREAKPOINT = 768;

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= MOBILE_BREAKPOINT
  );
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= MOBILE_BREAKPOINT;
      setIsDesktop(desktop);
      setSidebarOpen(desktop);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const mainMargin = isDesktop ? (sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_MINI_WIDTH) : 0;

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <TopNavbar onToggleSidebar={toggleSidebar} />

      <div className="flex-grow-1" style={{ paddingTop: "64px" }}>
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} onClose={closeSidebar} />

        <main
          className="p-3 p-md-4 pb-5 pb-md-4"
          style={{
            marginLeft: `${mainMargin}px`,
            transition: "margin-left 0.3s ease",
            minHeight: "calc(100vh - 64px)"
          }}
        >
          <div className="mx-auto" style={{ maxWidth: "1400px" }}>
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export { Layout };
