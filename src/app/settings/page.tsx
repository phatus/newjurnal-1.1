
import React from "react";
import { Building2, MapPin, UserCheck, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { updateSettings } from "@/app/activities/actions";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function SettingsPage(props: {
    searchParams: Promise<{ message?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const message = searchParams.message;
    const type = searchParams.type;

    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
        return redirect('/login');
    }

    // Check role
    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true, schoolId: true }
    });

    if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) {
        return redirect('/');
    }

    if (!profile.schoolId) {
        return redirect('/onboarding');
    }

    const school = await prisma.school.findUnique({
        where: { id: profile.schoolId }
    });


    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Konfigurasi</span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Identitas Sekolah</h1>
            </div>

            <div className="max-w-4xl mx-auto w-full px-6 sm:px-10 mt-10">
                {message && (
                    <div className={cn(
                        "mb-8 p-6 rounded-[2rem] border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
                        type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                    )}>
                        {type === 'error' ? <AlertCircle className="shrink-0" /> : <CheckCircle2 className="shrink-0" />}
                        <p className="text-sm font-black uppercase tracking-tight">{message}</p>
                    </div>
                )}

                {/* Invite Code Box */}
                {school?.inviteCode && (
                    <div className="bg-slate-900 rounded-[2rem] p-6 mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kode Undangan Sekolah</p>
                            <p className="text-slate-300 text-xs font-medium">Bagikan kode ini ke guru agar mereka bisa bergabung ke sekolah Anda.</p>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-3 min-w-[140px] text-center">
                            <p className="text-2xl font-black text-amber-400 tracking-[0.3em] uppercase">{school.inviteCode}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <form action={updateSettings} className="space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                            {/* School Name */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <Building2 size={16} className="text-amber-500" />
                                    Nama Sekolah
                                </label>
                                <input
                                    name="school_name"
                                    defaultValue={school?.name}
                                    className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    placeholder="Masukkan nama sekolah..."
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <MapPin size={16} className="text-amber-500" />
                                    Alamat Sekolah
                                </label>
                                <textarea
                                    name="school_address"
                                    defaultValue={school?.address || ''}
                                    rows={3}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                                    placeholder="Alamat lengkap sekolah..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                                {/* Headmaster Name */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <UserCheck size={16} className="text-amber-500" />
                                        Nama Kepala Sekolah
                                    </label>
                                    <input
                                        name="headmaster_name"
                                        defaultValue={school?.headmasterName || ''}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>

                                {/* Headmaster NIP */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <Building2 size={16} className="text-amber-500" />
                                        NIP Kepala Sekolah
                                    </label>
                                    <input
                                        name="headmaster_nip"
                                        defaultValue={school?.headmasterNip || ''}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>

                                {/* Headmaster Pangkat */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <UserCheck size={16} className="text-amber-500" />
                                        Pangkat/Gol Kepala Sekolah
                                    </label>
                                    <input
                                        name="headmaster_pangkat"
                                        defaultValue={school?.headmasterPangkat || ''}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>

                                {/* Headmaster Jabatan */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <UserCheck size={16} className="text-amber-500" />
                                        Jabatan Kepala Sekolah
                                    </label>
                                    <input
                                        name="headmaster_jabatan"
                                        defaultValue={school?.headmasterJabatan || 'Kepala Madrasah'}
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Save size={20} />
                            Simpan Perubahan
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
