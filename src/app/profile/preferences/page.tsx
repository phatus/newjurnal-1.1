
import React from "react";
import { ChevronLeft, Save, Bell, Palette, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { updatePreferences } from "@/app/auth/actions";
import { cn } from "@/lib/utils";

export default async function PreferencesPage() {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) return null;

    const dbProfile = await prisma.profile.findUnique({
        where: { id: user.id }
    });

    const profile = dbProfile ? {
        ...dbProfile,
        report_notifications: dbProfile.reportNotifications
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/profile"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-purple-600 uppercase tracking-widest">Pengaturan</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Preferensi Aplikasi</h1>
                <p className="text-slate-500 mt-1 font-medium">Sesuaikan pengalaman penggunaan aplikasi Anda.</p>
            </div>

            <div className="max-w-3xl mx-auto w-full px-6 sm:px-10 mt-10">
                <form action={updatePreferences} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-10">
                    {/* Notifikasi */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                                <Bell size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em]">Notifikasi Laporan</h3>
                        </div>

                        <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Laporan Aktivitas Harian</p>
                                <p className="text-xs text-slate-400 mt-0.5">Dapatkan notifikasi pengingat untuk mengisi jurnal harian.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="report_notifications"
                                    className="sr-only peer"
                                    defaultChecked={profile?.report_notifications ?? false}
                                />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50" />

                    {/* Tema & Tampilan */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                <Palette size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em]">Tema & Tampilan</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'light', label: 'Terang', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
                                { id: 'dark', label: 'Gelap', icon: Moon, color: 'text-slate-500', bg: 'bg-slate-900' },
                                { id: 'system', label: 'Sistem', icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50' },
                            ].map((theme) => (
                                <label key={theme.id} className="relative group cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={theme.id}
                                        className="sr-only peer"
                                        defaultChecked={profile?.theme === theme.id || (theme.id === 'light' && !profile?.theme)}
                                    />
                                    <div className="p-4 rounded-3xl bg-white border border-slate-100 peer-checked:border-purple-500 peer-checked:bg-purple-50/30 transition-all flex flex-col items-center gap-3">
                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", theme.bg, theme.id === 'dark' ? 'text-white' : theme.color)}>
                                            <theme.icon size={22} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 peer-checked:text-purple-600 transition-colors">{theme.label}</span>
                                    </div>
                                    <div className="absolute top-2 right-2 h-4 w-4 rounded-full border-2 border-slate-100 bg-white peer-checked:bg-purple-500 peer-checked:border-purple-500 flex items-center justify-center transition-all opacity-0 peer-checked:opacity-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.97] transition-all group"
                        >
                            <Save size={22} className="group-hover:rotate-12 transition-transform" />
                            <span>SIMPAN PREFERENSI</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
