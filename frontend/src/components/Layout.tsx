import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import GlobalSearch from "./GlobalSearch";

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    if (window.innerWidth <= 768) closeSidebar();
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
        <GlobalSearch />
        <h2>IRDR Solutions</h2>
      </header>

      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <h2>IRDR Solutions</h2>
          <p>Import, Funding & Inventory</p>
        </div>
        <div className="sidebar-search">
          <GlobalSearch />
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" onClick={handleNavClick}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/contracts" onClick={handleNavClick}>
            📄 Import Contracts
          </NavLink>
          <NavLink to="/shipments" onClick={handleNavClick}>
            🚢 Shipments
          </NavLink>
          <NavLink to="/expenses" onClick={handleNavClick}>
            💰 Expenses
          </NavLink>
          <NavLink to="/inventory" onClick={handleNavClick}>
            📦 Inventory
          </NavLink>
          <NavLink to="/funded-inventory" onClick={handleNavClick}>
            🏦 Funded Inventory
          </NavLink>
          <NavLink to="/warehouse" onClick={handleNavClick}>
            🏭 Warehouse & Plants
          </NavLink>
          <NavLink to="/approvals" onClick={handleNavClick}>
            ✅ Approvals
          </NavLink>
        </nav>
        <div
          style={{
            position: "absolute",
            bottom: "1.5rem",
            left: "1.5rem",
            right: "1.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              marginBottom: "0.5rem",
            }}
          >
            {user?.name} ({user?.role})
          </p>
          <button
            className="btn btn-outline"
            style={{ width: "100%", color: "#94a3b8", borderColor: "#475569" }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
