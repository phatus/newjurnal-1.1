"use client";

import React, { useState, useEffect } from "react";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import type { Profile, User } from "@/types";

interface ClientLayoutProps {
    children: React.ReactNode;
    user: User | null;
    profile: Profile | null;
}

export default function ClientLayout({ children, user, profile }: ClientLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load saved state from localStorage on mount
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("sidebar_collapsed");
        if (saved) {
            setIsCollapsed(saved === "true");
        }
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", String(newState));
    };

    // Prevent hydration mismatch for classes that depend on state
    if (!mounted) {
        return (
            <div className="flex min-h-screen">
                <Sidebar user={user} profile={profile} isCollapsed={false} toggleCollapse={() => { }} />
                <main className={cn("flex-1 min-w-0 pb-24 sm:pb-0 transition-all duration-300", user && "sm:pl-72")}>
                    <div className="max-w-[1600px] mx-auto h-full p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
                <MobileNav user={user} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar
                user={user}
                profile={profile}
                isCollapsed={isCollapsed}
                toggleCollapse={toggleCollapse}
            />
            <main className={cn(
                "flex-1 min-w-0 pb-24 sm:pb-0 transition-all duration-300 ease-in-out",
                user && (isCollapsed ? "sm:pl-20" : "sm:pl-72")
            )}>
                <div className="max-w-[1600px] mx-auto h-full p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
            <MobileNav user={user} />
        </div>
    );
}
