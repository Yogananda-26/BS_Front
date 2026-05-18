import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { TopNav } from "./Navbar";
import { Footer } from "./Footer";

const PublicLayout = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // run once on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Sticky nav — receives scroll state for elevation shadow */}
      <TopNav scrolled={scrolled} />

      {/* Page content — grows to fill remaining height */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export { PublicLayout };
