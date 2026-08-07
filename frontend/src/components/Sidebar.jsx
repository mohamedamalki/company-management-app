import {
    Building2,
    ChevronRight,
    LayoutDashboard,
    Package,
    Users,
    X,
    Tags,
    Badge,
    MapPinned,
    WalletCards,
    BadgePercent,
    BadgeDollarSign,
    Truck,
    ClipboardList
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
    {
        label: "Overview",
        to: "/admin/dashboard",
        icon: LayoutDashboard,
        end: true,
    },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Locations", to: "/admin/locations", icon: Building2 },
    { label: "Location assignments", to: "/admin/location-assignments", icon: MapPinned },
    { label: "Categories", to: "/admin/categories", icon: Tags },
    { label: "Brands", to: "/admin/brands", icon: Badge },
    { label: "TVA rates", to: "/admin/tax-rates", icon: BadgePercent },
    { label: "Products", to: "/admin/products", icon: Package },
    { label: "Product prices", to: "/admin/product-prices", icon: BadgeDollarSign },
    { label: "Suppliers", to: "/admin/suppliers", icon: Truck },
    { label: "Purchase order", to: "/admin/purchase-orders", icon: ClipboardList },
    { label: "Payment methods", to: "/admin/payment-methods", icon: WalletCards },
];

function getInitials(name = "Admin User") {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function formatRole(role = "admin") {
    return role
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Sidebar({
    open,
    onClose,
    user,
    lowStockCount = 0,
}) {
    const userName = user?.name || "Admin User";
    const badges = { lowStockCount };

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
                        to="/admin/dashboard"
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
                <nav className="relative flex-1 overflow-y-auto px-4 pb-6 pt-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300/60">
                        Workspace
                    </p>

                    <ul className="space-y-0.5">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const badge = item.badgeKey
                                ? badges[item.badgeKey]
                                : null;

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
                    <NavLink
                        to="/admin/profile"
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-xl p-2 outline-none transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
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

                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-200/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </NavLink>
                </div>
            </aside>
        </>
    );
}
