import {
    Building2,
    ChevronRight,
    LayoutDashboard,
    Package,
    Users,
    X,
    Tags
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
    { label: "Depots", to: "/admin/depots", icon: Building2 },
    { label: "Products", to: "/admin/products", icon: Package },
    { label: "Categories", to: "/admin/categories", icon: Tags  },
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
                className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
                    open
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col overflow-hidden bg-[#0b2a5b] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10" />

                <div className="relative flex h-20 shrink-0 items-center px-7">
                    <NavLink
                        to="/admin/dashboard"
                        onClick={onClose}
                        className="flex items-center gap-3"
                    >
                        <span className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-xl bg-white shadow-md">
                            <span className="h-6 w-2 rounded-full bg-blue-600" />
                            <span className="h-6 w-2 rounded-full bg-blue-400" />
                        </span>
                        <span className="text-xl font-extrabold tracking-tight">
                            M-App
                        </span>
                    </NavLink>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="ml-auto rounded-lg p-2 text-blue-200 transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="relative flex-1 overflow-y-auto px-5 pb-6 pt-6">
                    <p className="mb-4 px-2 text-[11px] font-extrabold tracking-[0.18em] text-blue-300/70">
                        WORKSPACE
                    </p>

                    <ul className="space-y-1.5">
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
                                            `group relative flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${
                                                isActive
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                                                    : "text-blue-100/75 hover:bg-white/10 hover:text-white"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <Icon
                                                    className={`h-[21px] w-[21px] shrink-0 ${
                                                        isActive
                                                            ? "text-white"
                                                            : "text-blue-200/80 group-hover:text-white"
                                                    }`}
                                                    strokeWidth={1.8}
                                                />

                                                <span>{item.label}</span>

                                                {Number(badge) > 0 && (
                                                    <span className="ml-auto flex min-w-7 items-center justify-center rounded-full bg-blue-400/25 px-2 py-1 text-[11px] font-extrabold text-blue-100">
                                                        {badge}
                                                    </span>
                                                )}

                                                {isActive && (
                                                    <span className="absolute right-1 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-blue-200" />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="relative shrink-0 border-t border-blue-300/20 px-6 py-5">
                    <NavLink
                        to="/admin/profile"
                        onClick={onClose}
                        className="group flex items-center gap-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                            {getInitials(userName)}
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-white">
                                {userName}
                            </span>
                            <span className="block truncate text-[11px] font-semibold text-blue-200/65">
                                {formatRole(user?.role)}
                            </span>
                        </span>

                        <ChevronRight className="h-4 w-4 text-blue-200/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </NavLink>
                </div>
            </aside>
        </>
    );
}
