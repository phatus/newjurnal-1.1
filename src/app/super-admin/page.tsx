import React from "react";
import { Globe, Building2, Users, ClipboardList, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getPlatformStats, getAllSchools } from "./actions";
import SuperAdminClient from "./SuperAdminClient";

export default async function SuperAdminPage(props: {
    searchParams: Promise<{ message?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) return redirect('/login');

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (profile?.role !== 'super_admin') {
        return redirect('/');
    }

    const [stats, schools] = await Promise.all([
        getPlatformStats(),
        getAllSchools(),
    ]);

    const statCards = [
        { name: "Total Sekolah", value: stats.totalSchools, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
        { name: "Total Pengguna", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Total Kegiatan", value: stats.totalActivities, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-slate-900 text-white px-6 sm:px-10 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-7xl mx-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Globe size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Super Admin</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Platform Management</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white/90">Super Admin</p>
                            <p className="text-xs text-white/50 font-medium">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 -mt-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {statCards.map((stat) => (
                        <div key={stat.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                                <stat.icon className={stat.color} size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Schools Table */}
                <SuperAdminClient
                    schools={schools}
                    message={searchParams.message}
                    type={searchParams.type}
                />
            </div>
        </div>
    );
}
