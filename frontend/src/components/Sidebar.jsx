import {
  Badge,
  BadgeDollarSign,
  BadgePercent,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Package,
  ShieldCheck,
  Tags,
  Truck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  {
    label: "Overview",
    to: "/app/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Users",
    to: "/app/users",
    icon: Users,
    permission: "users.manage",
  },
  {
    label: "Permissions",
    to: "/app/permissions",
    icon: ShieldCheck,
    permission: "permissions.manage",
  },
  {
    label: "Locations",
    to: "/app/locations",
    icon: Building2,
    permission: "locations.view",
  },
  {
    label: "Location assignments",
    to: "/app/location-assignments",
    icon: MapPinned,
    permission: "location-assignments.view",
  },
  {
    label: "Categories",
    to: "/app/categories",
    icon: Tags,
    permission: "categories.view",
  },
  {
    label: "Brands",
    to: "/app/brands",
    icon: Badge,
    permission: "brands.view",
  },
  {
    label: "TVA rates",
    to: "/app/tax-rates",
    icon: BadgePercent,
    permission: "tax-rates.view",
  },
  {
    label: "Products",
    to: "/app/products",
    icon: Package,
    permission: "products.view",
    badgeKey: "lowStockCount",
  },
  {
    label: "Product prices",
    to: "/app/product-prices",
    icon: BadgeDollarSign,
    permission: "product-prices.view",
  },
  {
    label: "Suppliers",
    to: "/app/suppliers",
    icon: Truck,
    permission: "suppliers.view",
  },
  {
    label: "Purchase orders",
    to: "/app/purchase-orders",
    icon: ClipboardList,
    permission: "purchase-orders.view",
  },
  {
    label: "Payment methods",
    to: "/app/payment-methods",
    icon: WalletCards,
    permission: "payment-methods.view",
  },
];

function getInitials(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRole(role = "user") {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Sidebar({ open, onClose, user, lowStockCount = 0 }) {
  const userName = user?.name || "User";
  const badges = { lowStockCount };
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const visibleNavigation = navigation.filter(
    (item) => !item.permission || permissions.includes(item.permission),
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-hidden bg-[#0b2a5b] text-white shadow-2xl ring-1 ring-white/5 transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Ambient background accents */}
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-400/5 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Brand */}
        <div className="relative flex h-20 shrink-0 items-center px-6">
          <NavLink
            to="/app/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <span className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-2xl bg-white shadow-lg shadow-black/10 ring-1 ring-black/5">
              <span className="h-6 w-2 rounded-full bg-blue-600" />
              <span className="h-6 w-2 rounded-full bg-blue-400" />
            </span>

            <span className="text-[21px] font-extrabold tracking-tight text-white">
              M-App
            </span>
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-2 text-blue-200 transition hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mx-6 h-px shrink-0 bg-white/10" />

        {/* Navigation */}
        <nav className="relative flex-1 overflow-y-auto px-4 pb-6 pt-6 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300/60">
            Workspace
          </p>

          <ul className="space-y-0.5">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const badge = item.badgeKey ? badges[item.badgeKey] : null;

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                          : "text-blue-100/70 hover:bg-white/[0.07] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-blue-200" />
                        )}

                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-blue-200/70 group-hover:text-white"
                          }`}
                          strokeWidth={2}
                        />

                        <span className="truncate">{item.label}</span>

                        {Number(badge) > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-400/25 px-1.5 text-[10.5px] font-bold text-blue-50 ring-1 ring-white/10">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User footer */}
        <div className="relative shrink-0 border-t border-white/10 bg-black/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[13px] font-extrabold text-blue-700 ring-2 ring-white/10">
              {getInitials(userName)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-bold leading-tight text-white">
                {userName}
              </span>

              <span className="block truncate text-[11.5px] font-medium leading-tight text-blue-200/60">
                {formatRole(user?.role)}
              </span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
