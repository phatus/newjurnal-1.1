import React from "react";
import { ArrowLeft, Building2, Users, ClipboardList, KeyRound, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getSchoolDetail } from "../actions";
import Link from "next/link";

export default async function SchoolDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return redirect('/login');

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (profile?.role !== 'super_admin') return redirect('/');

    const rawSchool = await getSchoolDetail(params.id);
    if (!rawSchool || !rawSchool.school) return redirect('/super-admin');

    const school = {
        ...rawSchool.school,
        headmaster_name: rawSchool.school.headmasterName,
        invite_code: rawSchool.school.inviteCode
    };
    const { members, activityCount } = rawSchool;

    const stats = [
        { name: "Anggota", value: members.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Total Kegiatan", value: activityCount, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-slate-900 text-white px-6 sm:px-10 py-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/super-admin" className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white/80 transition-colors mb-4">
                        <ArrowLeft size={14} />
                        Kembali ke Daftar Sekolah
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Building2 size={28} className="text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">{school.name}</h1>
                            {school.address && (
                                <p className="text-sm text-white/50 flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} />
                                    {school.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 -mt-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* School Info */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Informasi Sekolah</h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">Nama</span>
                                <span className="font-bold text-slate-900">{school.name}</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">Alamat</span>
                                <span className="font-bold text-slate-900">{school.address || '-'}</span>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-28 shrink-0 pt-0.5">Kepala Sekolah</span>
                                <span className="font-bold text-slate-900">{school.headmaster_name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 text-white">
                                <KeyRound size={18} className="text-amber-400 shrink-0" />
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest w-24 shrink-0">Kode</span>
                                <span className="text-lg font-black text-amber-400 tracking-[0.3em] uppercase">{school.invite_code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Daftar Anggota</h2>
                        {members.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-slate-50 text-center">
                                <Users className="mx-auto mb-3 text-slate-200" size={32} />
                                <p className="text-sm font-bold text-slate-400">Belum ada anggota</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-black">
                                                {member.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{member.name || member.email}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                            member.role === 'admin' ? "bg-amber-50 text-amber-600" :
                                                member.role === 'super_admin' ? "bg-indigo-50 text-indigo-600" :
                                                    "bg-slate-100 text-slate-500"
                                        )}>
                                            {member.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
