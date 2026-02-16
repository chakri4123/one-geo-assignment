import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/analysis", label: "AI Analysis" },
];

export default function MainLayout({ children }) {
  const location = useLocation();

  const pageTitle =
    navItems.find((item) => item.path === location.pathname)?.label ||
    "Dashboard";

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-xl font-bold">OneGeo</h1>

        <div className="text-sm text-gray-400 mt-1">
          Well Log Intelligence Platform
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
          Data Analytics Platform v1.0
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow px-8 py-4">
          <h2 className="text-lg font-semibold">{pageTitle}</h2>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
}
