import React from "react";
import { ChevronLeft, Save, User, Briefcase, GraduationCap, MapPin, Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { updateProfile } from "@/app/auth/actions";

export default async function EditProfilePage() {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) return null;

    const dbProfile = await prisma.profile.findUnique({
        where: { id: user.id }
    });

    const profile = dbProfile ? {
        ...dbProfile,
        pangkat_gol: dbProfile.pangkatGol,
        unit_kerja: dbProfile.unitKerja
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
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Pengaturan</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Profil Saya</h1>
                <p className="text-slate-500 mt-1 font-medium">Lengkapi data profesional Anda untuk keperluan pelaporan.</p>
            </div>

            <div className="max-w-3xl mx-auto w-full px-6 sm:px-10 mt-10">
                <form action={updateProfile} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                    <div className="space-y-6">
                        {/* Nama Lengkap */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap & Gelar</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={profile?.name || ''}
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        {/* NIP */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">NIP</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="nip"
                                    defaultValue={profile?.nip || ''}
                                    placeholder="Nomor Induk Pegawai"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {/* Pangkat/Golongan */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pangkat / Golongan</label>
                                <div className="relative">
                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="pangkat_gol"
                                        defaultValue={profile?.pangkat_gol || ''}
                                        placeholder="Contoh: Pembina, IV/a"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Jabatan */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="jabatan"
                                        defaultValue={profile?.jabatan || ''}
                                        placeholder="Contoh: Guru Ahli Madya"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mata Pelajaran */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mata Pelajaran Diampu</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="subject"
                                    defaultValue={profile?.subject || ''}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Unit Kerja */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Unit Kerja / Sekolah</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="unit_kerja"
                                    defaultValue={profile?.unit_kerja || ''}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-amber-500 text-white font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-[0.97] transition-all group"
                        >
                            <Save size={22} className="group-hover:rotate-12 transition-transform" />
                            <span>SIMPAN PERUBAHAN</span>
                        </button>
                        <Link
                            href="/profile"
                            className="w-full h-14 mt-4 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all"
                        >
                            Batal
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
