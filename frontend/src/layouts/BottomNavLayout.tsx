import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/app/leituras", label: "Leituras", icon: "📚" },
  { to: "/app/vendidos", label: "Vendidos", icon: "🏷️" },
  { to: "/app/comprados", label: "Comprados", icon: "🛒" },
  { to: "/app/grupos", label: "Grupos", icon: "👥" },
];

export function BottomNavLayout() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Principal">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}
          >
            <span className="bottom-nav-icon" aria-hidden>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
