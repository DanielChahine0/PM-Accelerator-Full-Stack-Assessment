import { Link, useLocation } from "react-router-dom";
import { Database, Menu, X } from "lucide-react";
import { useState } from "react";
import favicon from "../assets/favicon.ico";

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Weather" },
    { to: "/history", label: "History" },
    { to: "/about", label: "About" },
  ];

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <img src={favicon} alt="Logo" height={22} width={22} />
          <span>WeatherApp</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links" style={styles.links}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                ...styles.link,
                ...(pathname === l.to ? styles.linkActive : {}),
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          style={styles.hamburger}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={styles.mobileMenu}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{
                ...styles.mobileLink,
                ...(pathname === l.to ? styles.linkActive : {}),
              }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    background: "#fff",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontWeight: 800,
    fontSize: "1.1rem",
    color: "var(--primary)",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    gap: "0.25rem",
  },
  link: {
    padding: "0.4rem 0.9rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    textDecoration: "none",
    transition: "background 0.15s, color 0.15s",
  },
  linkActive: {
    background: "#dbeafe",
    color: "var(--primary)",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.4rem",
    color: "var(--text)",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    padding: "0.5rem 1rem 1rem",
    gap: "0.25rem",
    borderTop: "1px solid var(--border)",
  },
  mobileLink: {
    padding: "0.6rem 0.9rem",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "var(--text-muted)",
    textDecoration: "none",
  },
};
