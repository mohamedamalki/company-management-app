import { useEffect, useRef, useState } from "react";
import {
    ChevronDown,
    LogOut,
    Menu,
    Search,
    Settings,
    UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function getInitials(name = "Admin User") {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function Navbar({ user, onMenuClick }) {
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const profileMenuRef = useRef(null);

    const [profileOpen, setProfileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const userName = user?.name || "Admin User";
    const userEmail = user?.email || "admin@company.com";

    useEffect(() => {
        const focusSearch = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        const closeProfileMenu = (event) => {
            if (!profileMenuRef.current?.contains(event.target)) {
                setProfileOpen(false);
            }
        };

        window.addEventListener("keydown", focusSearch);
        document.addEventListener("mousedown", closeProfileMenu);

        return () => {
            window.removeEventListener("keydown", focusSearch);
            document.removeEventListener("mousedown", closeProfileMenu);
        };
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);

        try {
            await api.post("/logout");
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login", { replace: true });
            setLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-30 h-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open navigation"
                    className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="relative hidden w-full max-w-[430px] sm:block">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search products, depots, suppliers..."
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500 md:block">
                        ⌘ K
                    </span>
                </div>

                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        aria-label="Search"
                        onClick={() => searchInputRef.current?.focus()}
                        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:hidden"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    <div ref={profileMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setProfileOpen((open) => !open)}
                            aria-expanded={profileOpen}
                            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:gap-3"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">
                                {getInitials(userName)}
                            </span>

                            <span className="hidden text-left md:block">
                                <span className="block max-w-40 truncate text-sm font-bold text-slate-800">
                                    {userName}
                                </span>
                                <span className="block text-[11px] font-semibold text-slate-400">
                                    Administrator
                                </span>
                            </span>

                            <ChevronDown
                                className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${
                                    profileOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {profileOpen && (
                            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                                <div className="border-b border-slate-100 px-3 py-3">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {userName}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {userEmail}
                                    </p>
                                </div>

                                <div className="py-2">
                                    <DropdownButton
                                        icon={UserRound}
                                        label="My profile"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate("/admin/profile");
                                        }}
                                    />
                                    <DropdownButton
                                        icon={Settings}
                                        label="Settings"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate("/admin/settings");
                                        }}
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-2">
                                    <DropdownButton
                                        icon={LogOut}
                                        label={
                                            loggingOut
                                                ? "Signing out..."
                                                : "Sign out"
                                        }
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        danger
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

function DropdownButton({
    icon: Icon,
    label,
    onClick,
    disabled = false,
    danger = false,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            }`}
        >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {label}
        </button>
    );
}
