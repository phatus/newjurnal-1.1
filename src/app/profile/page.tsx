import React from "react";
import {
    LogOut,
    ShieldCheck,
    MapPin,
    Briefcase,
    GraduationCap,
    ChevronRight,
    Info,
    Calendar,
    Lock,
    Bell,
    Palette
} from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { logout } from "@/app/auth/actions";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import ProfileAvatar from "@/components/ProfileAvatar";

export default async function ProfilePage() {
    const session = await auth();
    const sessionUser = session?.user;

    if (!sessionUser || !sessionUser.id) return null;

    const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id }
    });

    const dbProfile = await prisma.profile.findUnique({
        where: { id: sessionUser.id }
    });

    const profile = dbProfile ? {
        ...dbProfile,
        avatar_url: dbProfile.avatarUrl,
        unit_kerja: dbProfile.unitKerja,
        pangkat_gol: dbProfile.pangkatGol
    } : null;

    const user = {
        ...sessionUser,
        email: sessionUser.email || '',
        created_at: dbUser?.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString()
    };

    const sections = [
        {
            title: "Keamanan & Akun",
            items: [
                { label: "Ubah Kata Sandi", icon: Lock, color: "text-amber-500", bg: "bg-amber-50", href: "/profile/change-password" },
                { label: "Riwayat Perangkat", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50", href: "/profile/devices" },
            ]
        },
        {
            title: "Preferensi Aplikasi",
            items: [
                { label: "Notifikasi Laporan", icon: Bell, color: "text-red-500", bg: "bg-red-50", href: "/profile/preferences" },
                { label: "Tema & Tampilan", icon: Palette, color: "text-purple-500", bg: "bg-purple-50", href: "/profile/preferences" },
            ]
        },
        {
            title: "Informasi",
            items: [
                { label: "Bantuan & Dukungan", icon: Info, color: "text-slate-500", bg: "bg-slate-100", href: "/help" },
                { label: "Tentang newjurnalku", icon: GraduationCap, color: "text-slate-500", bg: "bg-slate-100", href: "/about" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Dynamic Header Background */}
            <div className="relative h-72 bg-slate-900">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-600/20 via-slate-900 to-slate-900" />
                    <div className="absolute top-0 right-0 h-96 w-96 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                </div>

                <div className="relative h-full flex items-end px-10 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 text-center sm:text-left">
                        <ProfileAvatar
                            uid={user.id || ''}
                            url={profile?.avatar_url || undefined}
                            name={profile?.name || undefined}
                            email={user.email || undefined}
                        />
                        <div className="space-y-3 pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <h1 className="text-4xl font-black text-white tracking-tight">{profile?.name || user.email?.split('@')[0]}</h1>
                                <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/20 w-fit mx-auto sm:mx-0">{profile?.role || 'Pengguna'}</span>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={14} className="text-amber-500" />
                                    <span>NIP. {profile?.nip || 'Belum diatur'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPin size={14} className="text-amber-500" />
                                    <span>{profile?.unit_kerja || 'Indonesia'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-10 -mt-8 relative z-10 grid lg:grid-cols-3 gap-8">

                {/* Detail Cards Area */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight text-center sm:text-left">Detail Pegawai</h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all">
                                    <Briefcase size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Jabatan</p>
                                    <p className="text-sm font-black text-slate-700 mt-0.5">{profile?.jabatan || 'Guru'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all">
                                    <GraduationCap size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mata Pelajaran</p>
                                    <p className="text-sm font-black text-slate-700 mt-0.5">{profile?.subject || 'Semua Mapel'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unit Kerja</p>
                                    <p className="text-sm font-black text-slate-700 mt-0.5">{profile?.unit_kerja || 'Sekolah'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <Link
                                href="/profile/edit"
                                className="w-full h-14 flex items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Perbarui Profil
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="h-20 w-20 rounded-full border-4 border-amber-500/10 flex items-center justify-center">
                            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Calendar size={24} />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 uppercase">Terdaftar Pada</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">{new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Menu & Settings Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm overflow-hidden">
                        {sections.map((section, idx) => (
                            <div key={idx} className="p-4 space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mt-2">{section.title}</h4>
                                <div className="grid sm:grid-cols-2 gap-2">
                                    {section.items.map((item, i) => (
                                        <Link key={i} href={item.href || '#'} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-all group active:scale-[0.98]">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", item.bg, item.color)}>
                                                    <item.icon size={20} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-200 group-hover:text-amber-500 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                                {idx < sections.length - 1 && <div className="h-px bg-slate-50 mx-4 mt-4" />}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <form action={logout} className="flex-1">
                            <button className="w-full h-16 flex items-center justify-center gap-3 rounded-[1.5rem] bg-red-50 text-red-500 font-extrabold shadow-sm hover:bg-red-100 hover:scale-[0.99] transition-all">
                                <LogOut size={20} />
                                <span>Keluar Sesi</span>
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
