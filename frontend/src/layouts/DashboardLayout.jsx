import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function getStoredUser() {
    const storedUser =
        sessionStorage.getItem("user") || localStorage.getItem("user");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch {
        return null;
    }
}

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = getStoredUser();

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                lowStockCount={12}
            />

            <div className="min-h-screen lg:pl-[248px]">
                <Navbar
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-[1600px]">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
