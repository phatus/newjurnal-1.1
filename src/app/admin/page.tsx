import React from "react";
import { Shield, Users, Database, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UserIdentity from "@/components/UserIdentity";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getCategories } from "@/app/activities/actions";
import { getUsers } from "./actions";

export default async function AdminPage() {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
        return redirect('/login');
    }

    // Check role
    const dbProfile = await prisma.profile.findUnique({
        where: { id: user.id }
    });

    const profile = dbProfile ? {
        ...dbProfile,
        avatar_url: dbProfile.avatarUrl,
        unit_kerja: dbProfile.unitKerja,
        pangkat_gol: dbProfile.pangkatGol
    } : null;

    if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) {
        return redirect('/');
    }

    const [users, categories] = await Promise.all([
        getUsers(),
        getCategories()
    ]);

    const stats = [
        { name: "Total Pengguna", value: users.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Kategori Laporan", value: categories.length.toString(), icon: Database, color: "text-amber-600", bg: "bg-amber-50" },
        { name: "Sistem", value: "Aktif", icon: Shield, color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-7xl mx-auto">
                    <div className="space-y-1">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Panel Kontrol</span>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Administrasi</h1>
                    </div>
                    <UserIdentity profile={profile as any} user={user as any} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 mt-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat) => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Manajemen Data Master</h2>
                        <div className="space-y-4">
                            {[
                                { name: "Kategori Laporan", desc: "Kelola RHK dan kategori KBM", href: "/admin/categories" },
                                { name: "Daftar Kelas", desc: "Kelola data kelas siswa", href: "/admin/classes" },
                                { name: "Dasar Pelaksanaan", desc: "Kelola jenis SK/perintah tugas", href: "/admin/bases" },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-100 transition-all group"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                    <ArrowRight className="text-slate-300 group-hover:text-amber-500 transition-colors" size={20} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Manajemen Pengguna</h2>
                            <Link
                                href="/admin/users"
                                className="flex items-center justify-between p-6 rounded-2xl border border-blue-50 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Kelola Akses Pegawai</p>
                                        <p className="text-xs text-slate-500 font-medium">Atur peran dan hapus pengguna</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-blue-300 group-hover:text-blue-600 transition-colors" size={20} />
                            </Link>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Identitas Sekolah</h2>
                            <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 text-center">
                                <p className="text-sm font-bold text-indigo-900 mb-4">Konfigurasi Identitas Sekolah</p>
                                <Link href="/settings" className="inline-flex h-12 items-center px-8 rounded-xl bg-indigo-600 text-white font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-colors">
                                    Atur Sekarang
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

