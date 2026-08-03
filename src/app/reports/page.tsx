import React from "react";
import {
    TrendingUp,
    History,
    Search
} from "lucide-react";
import { auth } from "@/auth";
import { getDashboardStats } from "@/app/activities/actions";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) return null;

    const stats = await getDashboardStats();

    const reportTypes = [
        { id: "catkin", name: "Catatan Kinerja", desc: "Daftar lengkap seluruh kegiatan harian Anda.", icon: "FileText", color: "text-blue-500", bg: "bg-blue-50" },
        { id: "jurnal", name: "Jurnal Mengajar", desc: "Laporan khusus kegiatan belajar mengajar di kelas.", icon: "BookOpen", color: "text-amber-500", bg: "bg-amber-50" },
        { id: "labul", name: "Laporan Bulanan", desc: "Evaluasi capaian RHK yang dikelompokkan per kategori.", icon: "ClipboardCheck", color: "text-green-500", bg: "bg-green-50" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-7xl mx-auto">
                    <div className="space-y-1">
                        <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Kinerja & Dokumentasi</span>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pusat Laporan Guru</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-10 grid lg:grid-cols-4 gap-8">
                {/* Left: Summary Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <div className="relative z-10 space-y-8">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Kinerja</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <h3 className="text-xl font-black text-slate-900">Normal</h3>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div>
                                    <p className="text-5xl font-black text-amber-500 tracking-tighter italic">
                                        {stats?.totalActivities > 0 ? 'AKTIF' : 'PASIF'}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Status Pencatatan</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full -mb-12 -mr-12 blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                                    <TrendingUp size={20} />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest">Analisis Cepat</h4>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                {stats?.totalActivities > 0 
                                    ? `Anda telah mencatat ${stats.totalActivities} kegiatan bulan ini. Pertahankan konsistensi Anda.` 
                                    : "Mulai catat kegiatan Anda hari ini untuk melihat analisis kinerja di sini."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Report Selection via Client Component */}
                <div className="lg:col-span-3 space-y-10">
                    <ReportsClient reportTypes={reportTypes} />

                    {/* Export History Table Placeholder */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <History size={20} className="text-slate-400" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Unduhan</h2>
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input type="text" placeholder="Cari laporan..." className="h-10 pl-10 pr-4 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 w-48 transition-all" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-20 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat unduhan</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
