import {
    Badge,
    BadgeDollarSign,
    BadgePercent,
    Building2,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    LayoutDashboard,
    MapPinned,
    Package,
    PackageOpen,
    ShieldCheck,
    ShoppingCart,
    Tags,
    Truck,
    Users,
    WalletCards,
    Warehouse,
    X,
    Handshake,
    HandCoins,
    RotateCcw,
    ReceiptText,
    FolderCog
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useAuth from "../context/useAuth";

const navigationSections = [
    {
        label: "General",
        items: [
            {
                label: "Overview",
                to: "/app/dashboard",
                icon: LayoutDashboard,
                end: true,
            },
        ],
    },
    {
        label: "Administration",
        items: [
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
        ],
    },
    {
        label: "Inventory",
        items: [
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
                label: "Products",
                to: "/app/products",
                icon: Package,
                permission: "products.view",
            },
            {
                label: "Product prices",
                to: "/app/product-prices",
                icon: BadgeDollarSign,
                permission: "product-prices.view",
            },
            {
                label: "Location stocks",
                to: "/app/location-stocks",
                icon: Warehouse,
                permission: "location-stocks.view",
                badgeKey: "lowStockCount",
            },
            {
                label: "Stock movements",
                to: "/app/stock-movements",
                icon: PackageOpen,
                permission: "stock-movements.view",
            },
        ],
    },
    {
        label: "Purchasing",
        items: [
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
                label: "Purchase receipts",
                to: "/app/purchase-receipts",
                icon: ClipboardCheck,
                permission: "purchase-receipts.view",
            },
        ],
    },
    {
        label: "Sales",
        items: [
            {
                label: "Sales",
                to: "/app/sales",
                icon: ShoppingCart,
                permission: "sales.view",
            },
            {
                label: "Fournisseurs",
                to: "/app/fournisseurs",
                icon: Handshake,
                permission: "fournisseurs.view",
            },
            {
                label: "Sale balances",
                to: "/app/sale-balances",
                icon: HandCoins,
                permission: "sale-payments.view",
            },
            {
                label: "Sale returns",
                to: "/app/sale-returns",
                icon: RotateCcw,
                permission: "sale-returns.view",
            },
        ],
    },
    {
        label : "Expenses",
        items : [
            {
                label: "Expenses",
                to: "/app/expenses",
                icon: ReceiptText,
                permission: "expenses.view",
            },
            {
                label: "Expense categories",
                to: "/app/expense-categories",
                icon: FolderCog,
                permission: "expense-categories.view",
            },
            {
                label: "Employees",
                to: "/app/employees",
                icon: Users,
                permission: "employees.view",
            },
            {
                label: "Salaries",
                to: "/app/salaries",
                icon: WalletCards,
                permission: "salaries.view",
            },
        ]
    },
    {
        label: "Settings",
        items: [
            {
                label: "TVA rates",
                to: "/app/tax-rates",
                icon: BadgePercent,
                permission: "tax-rates.view",
            },
            {
                label: "Payment methods",
                to: "/app/payment-methods",
                icon: WalletCards,
                permission: "payment-methods.view",
            },
        ],
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
        .replace(
            /\b\w/g,
            (letter) => letter.toUpperCase()
        );
}

function Sidebar({
    open,
    onClose,
    lowStockCount = 0,
}) {
    const { user } = useAuth();

    const userName = user?.name || "User";
    const role = user?.role
        ?.trim()
        .toLowerCase();

    const permissions = Array.isArray(user?.permissions)
        ? user.permissions
        : [];

    const badges = {
        lowStockCount,
    };

    const hasPermission = (permission) => {
        if (!permission) {
            return true;
        }

        // Admin should always see the complete application menu.
        if (role === "admin") {
            return true;
        }

        return permissions.includes(permission);
    };

    const visibleSections = navigationSections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
                hasPermission(item.permission)
            ),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <>
            {/* Mobile backdrop */}
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
                className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-hidden bg-[#0b2a5b] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${
                    open
                        ? "translate-x-0"
                        : "-translate-x-full"
                }`}
            >
                {/* Background decorations */}
                <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-2xl" />

                <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-400/5 blur-3xl" />

                {/* Logo */}
                <div className="relative flex h-20 shrink-0 items-center px-6">
                    <NavLink
                        to="/app/dashboard"
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                        <span className="flex h-11 w-11 items-center justify-center gap-1.5 rounded-2xl bg-white shadow-lg">
                            <span className="h-6 w-2 rounded-full bg-blue-600" />
                            <span className="h-6 w-2 rounded-full bg-blue-400" />
                        </span>

                        <span className="text-[21px] font-extrabold tracking-tight">
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

                <div className="relative mx-6 h-px shrink-0 bg-white/10" />

                {/* Navigation */}
                <nav className="relative flex-1 overflow-y-auto px-4 pb-6 pt-5 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]">
                    {visibleSections.map((section) => (
                        <div
                            key={section.label}
                            className="mb-6"
                        >
                            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/60">
                                {section.label}
                            </p>

                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;

                                    const badge =
                                        item.badgeKey
                                            ? badges[
                                                  item.badgeKey
                                              ]
                                            : null;

                                    return (
                                        <li key={item.to}>
                                            <NavLink
                                                to={item.to}
                                                end={item.end}
                                                onClick={onClose}
                                                className={({
                                                    isActive,
                                                }) =>
                                                    `group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13.5px] font-semibold outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-300 ${
                                                        isActive
                                                            ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                                                            : "text-blue-100/70 hover:bg-white/[0.07] hover:text-white"
                                                    }`
                                                }
                                            >
                                                {({
                                                    isActive,
                                                }) => (
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
                                                            strokeWidth={
                                                                2
                                                            }
                                                        />

                                                        <span className="truncate">
                                                            {
                                                                item.label
                                                            }
                                                        </span>

                                                        {Number(
                                                            badge
                                                        ) > 0 && (
                                                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                                {
                                                                    badge
                                                                }
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Current user */}
                <div className="relative shrink-0 border-t border-white/10 bg-black/10 px-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl p-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[13px] font-extrabold text-blue-700 ring-2 ring-white/10">
                            {getInitials(userName)}
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-bold text-white">
                                {userName}
                            </span>

                            <span className="block truncate text-[11.5px] font-medium text-blue-200/60">
                                {formatRole(role)}
                            </span>
                        </span>

                        <ChevronRight className="h-4 w-4 shrink-0 text-blue-200/30" />
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
