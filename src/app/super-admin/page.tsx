import React from "react";
import { Globe, Building2, Users, ClipboardList, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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

                {/* Quick Management Links for Super Admin */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Menu Pengelolaan Master Data System</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Link href="/admin/categories" className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 transition-colors border border-amber-100 group">
                            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                📋
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors">Edit Kategori</p>
                                <p className="text-[10px] text-slate-500 font-bold">Kategori & RHK</p>
                            </div>
                        </Link>
                        <Link href="/admin/classes" className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 transition-colors border border-blue-100 group">
                            <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                📚
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">Daftar Kelas</p>
                                <p className="text-[10px] text-slate-500 font-bold">Master Kelas</p>
                            </div>
                        </Link>
                        <Link href="/admin/bases" className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 transition-colors border border-indigo-100 group">
                            <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                🎯
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Dasar SK</p>
                                <p className="text-[10px] text-slate-500 font-bold">Dasar Pelaksanaan</p>
                            </div>
                        </Link>
                        <Link href="/admin/users" className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 transition-colors border border-emerald-100 group">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                👥
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Pengguna</p>
                                <p className="text-[10px] text-slate-500 font-bold">Kelola User</p>
                            </div>
                        </Link>
                    </div>
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
