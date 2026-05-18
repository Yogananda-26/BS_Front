import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home",     href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Workflow", href: "#workflow" },
  { label: "Contact",  href: "#contact" },
  { label: "Team",     href: "#team" },
];

function TopNav() {
  const [active, setActive]     = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      className="px-4 py-3"
    >
      <div className="d-flex align-items-center justify-content-between">

        {/* Logo */}
        <a className="fw-bold fs-5 text-decoration-none text-dark" href="#">
          BuildSmart
        </a>

        {/* Desktop Nav Links */}
        <div className="d-none d-lg-flex gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-decoration-none text-dark"
              style={{ fontWeight: active === link.label ? 600 : 400 }}
              onClick={() => setActive(link.label)}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Login + Mobile Hamburger */}
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/login"
            className="btn btn-dark btn-sm rounded-3 d-none d-lg-block"
          >
            Login
          </Link>

          <button
            type="button"
            className="btn d-lg-none border-0 p-1"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {/* Animated hamburger → X */}
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#000",
                marginBottom: 5,
                transition: "transform 0.3s, opacity 0.3s",
                transformOrigin: "center",
                transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#000",
                marginBottom: 5,
                transition: "opacity 0.3s",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: "#000",
                transition: "transform 0.3s, opacity 0.3s",
                transformOrigin: "center",
                transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — CSS-only max-height animation */}
      <div
        style={{
          maxHeight: menuOpen ? "500px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "rgba(255,255,255,0.98)",
        }}
        className="d-lg-none"
      >
        <div className="d-flex flex-column gap-1 pt-3 pb-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-decoration-none text-dark px-2 py-2 rounded"
              style={{
                fontWeight: active === link.label ? 600 : 400,
                background: active === link.label ? "#f5f5f5" : "transparent",
              }}
              onClick={() => {
                setActive(link.label);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            className="btn btn-dark btn-sm rounded-3 mt-2 w-100"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

export { TopNav };