import React from "react";
import {
  ClipboardList,
  Plus,
  ChevronRight,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Award
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDashboardStats, getRecentActivities, getMonthlyStats } from "@/app/activities/actions";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import UserIdentity from "@/components/UserIdentity";
import { getSchedules } from "@/app/activities/schedule/actions";
import ScheduleQuickAction from "@/components/ScheduleQuickAction";
import { Settings } from "lucide-react";

import DashboardDateFilter from "@/components/DashboardDateFilter";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const selectedDate = (resolvedParams.date as string) || new Date().toISOString().split('T')[0];

  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Sesi Berakhir</h2>
        <p className="text-slate-500 mt-2">Silakan masuk kembali untuk mengakses dashboard.</p>
        <Link href="/login" className="mt-6 px-6 py-2 bg-amber-500 text-white rounded-xl font-bold">Masuk Sekarang</Link>
      </div>
    );
  }

  const dbProfile = await prisma.profile.findUnique({
    where: { id: user.id }
  });

  const profile = dbProfile ? {
    ...dbProfile,
    avatar_url: dbProfile.avatarUrl,
    unit_kerja: dbProfile.unitKerja,
    pangkat_gol: dbProfile.pangkatGol,
    report_notifications: dbProfile.reportNotifications,
    school_id: dbProfile.schoolId
  } : null;

  const school = profile?.school_id ? await prisma.school.findUnique({
    where: { id: profile.school_id },
    select: { name: true }
  }) : null;

  const stats = await getDashboardStats();
  const recentActivities = await getRecentActivities();
  const schedules = await getSchedules(selectedDate);
  type MonthlyStats = { counts: number[]; raw: unknown[] };
  const monthlyStats: MonthlyStats = await getMonthlyStats();

  const dashboardStats = [
    { label: "Total Kegiatan", value: stats?.totalActivities || 0, icon: ClipboardList, color: "bg-blue-500", shadow: "shadow-blue-100", trend: "+0%" },
    { label: "Jurnal Mengajar", value: stats?.teachingActivities || 0, icon: Clock, color: "bg-amber-500", shadow: "shadow-amber-100", trend: "+0%" },
    { label: "Rata-rata Harian", value: stats?.dailyAverage?.toFixed(1) || "0.0", icon: TrendingUp, color: "bg-green-500", shadow: "shadow-green-100", trend: "+0" },
    { label: "Poin Kinerja", value: stats?.performancePoints || 0, icon: Award, color: "bg-purple-500", shadow: "shadow-purple-100", trend: "+0" },
  ];

  return (
    <div className="p-4 sm:p-10 space-y-10">
      {/* Header - Desktop Optimized */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-amber-600 uppercase tracking-widest">
              {school?.name || "Sekolah"}
            </p>
            <Link href="/activities/schedule" className="group flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all">
              <Settings size={12} className="group-hover:rotate-90 transition-transform" />
              Kelola Jadwal
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Halo, {profile?.name?.split(' ')[0] || user.email?.split('@')[0]} 👋</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <DashboardDateFilter selectedDate={selectedDate} />
          <UserIdentity profile={profile as any} user={user as any} />
        </div>
      </header>

      {/* Quick Schedule Confirmation */}
      <ScheduleQuickAction initialSchedules={schedules} selectedDate={selectedDate} />

      {/* Stats Grid - Desktop Optimized */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className={cn("p-6 rounded-4xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group", stat.shadow)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg uppercase">{stat.trend}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Chart - Takes 2 cols on desktop */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Statistik Kegiatan</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-400">Bulan Ini</span>
            </div>
            <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="h-72 w-full bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col items-end justify-between gap-4 shadow-sm relative group overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-slate-50/50 to-transparent pointer-events-none" />
            {monthlyStats.counts.every((c) => c === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                Tidak ada data untuk statistik
              </div>
            ) : (
              <div className="flex w-full h-full items-end justify-between gap-2">
                {monthlyStats.counts.map((count, i: number) => {
                  const max = Math.max(...monthlyStats.counts, 1);
                  const heightPercent = Math.max(5, (count / max) * 100); // min 5% for visibility
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group/bar">
                      <div
                        className={cn(
                          "w-full rounded-2xl transition-all duration-500 overflow-hidden",
                          i === new Date().getMonth() ? "bg-amber-500 shadow-lg shadow-amber-200" : (count > 0 ? "bg-slate-300" : "bg-slate-100")
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] font-black text-slate-400 uppercase shrink-0 group-hover/bar:text-slate-900 transition-colors">
                        {['J', 'P', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Recent Activities - Takes 1 col on desktop */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Kegiatan Terbaru</h2>
            <Link href="/activities" className="text-xs font-black text-amber-600 uppercase tracking-widest">Semua</Link>
          </div>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada kegiatan</p>
              </div>
            ) : recentActivities.map((act) => (
              <div key={act.id} className="group flex items-center p-5 rounded-3xl bg-white border border-slate-100 hover:border-amber-100 hover:shadow-lg hover:shadow-amber-50 transition-all cursor-pointer">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all shadow-inner">
                  <ClipboardList size={22} />
                </div>
                <div className="ml-5 flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{act.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">{act.category?.name || 'Kegiatan'}</span>
                    <span>{new Date(act.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={20} />
              </div>
            ))}

            <Link href="/activities/create" className="w-full py-5 flex items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/30 transition-all group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span>CATAT KEGIATAN BARU</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
