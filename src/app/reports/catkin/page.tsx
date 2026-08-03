import React from "react";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { ReportFooter, PrintButton, BackButton } from "@/components/ReportComponents";
import type { Activity } from "@/types";
import { redirect } from "next/navigation";

export default async function CatkinReportPage(props: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const searchParams = await props.searchParams;
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const month = searchParams.month ? parseInt(searchParams.month) : currentMonth;
    const year = parseInt(searchParams.year || new Date().getFullYear().toString());

    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) redirect('/login');

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        include: { school: true }
    });

    // month is 1-12, use new Date(year, month, 0) to get last day of that month
    const lastDate = new Date(year, month, 0); // Date object for last day of month
    const lastDay = lastDate.getDate();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const dbActivities = await prisma.activity.findMany({
        where: {
            userId: user.id,
            activityDate: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            category: true,
            implementationBasis: true,
            classRooms: {
                include: {
                    classRoom: true
                }
            }
        },
        orderBy: [
            { activityDate: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    const activities = dbActivities.map(act => ({
        id: act.id.toString(),
        activity_date: act.activityDate.toISOString().split('T')[0],
        description: act.description,
        learning_material: act.learningMaterial,
        learning_outcome: act.learningOutcome,
        student_outcome: act.studentOutcome,
        basis: act.implementationBasis ? { name: act.implementationBasis.name } : null,
        category: act.category ? { name: act.category.name, is_teaching: act.category.isTeaching } : null,
        classes: act.classRooms.map(c => ({
            class: c.classRoom ? { name: c.classRoom.name } : null
        }))
    })) as any[];

    // Group activities by date
    const groupedActivities: Record<string, Activity[]> = {};
    (activities || []).forEach((act: Activity) => {
        if (!groupedActivities[act.activity_date]) {
            groupedActivities[act.activity_date] = [];
        }
        groupedActivities[act.activity_date].push(act);
    });

    const sortedDates = Object.keys(groupedActivities).sort();

    const monthName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month - 1];

    return (
        <div className="bg-white min-h-screen p-10 print:p-0 font-sans text-slate-900 max-w-5xl mx-auto printable-area">
            <div className="no-print mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pratinjau: CATKIN — {monthName} {year}</p>
                <div className="flex gap-3">
                    <BackButton />
                    <PrintButton />
                </div>
            </div>


            <h2 className="text-center text-lg font-black mb-1 tracking-wide">Laporan Catatan Kinerja Harian</h2>
            <p className="text-center text-xs font-bold text-slate-600 mb-6">(CATKIN) — {monthName} {year}</p>

            {/* Employee Information Section */}
            <div className="mb-6 text-sm signature-block">
                <table className="w-full text-[11px] leading-tight">
                    <tbody>
                        <tr>
                            <td className="font-bold w-32 py-0.5">Nama Pegawai</td>
                            <td className="px-2 py-0.5">:</td>
                            <td className="font-medium py-0.5">{profile?.name || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold py-0.5">NIP</td>
                            <td className="px-2 py-0.5">:</td>
                            <td className="font-medium py-0.5">{profile?.nip || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold py-0.5">Pangkat / Gol.</td>
                            <td className="px-2 py-0.5">:</td>
                            <td className="font-medium py-0.5">{profile?.pangkatGol || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold py-0.5">Jabatan</td>
                            <td className="px-2 py-0.5">:</td>
                            <td className="font-medium py-0.5">{profile?.jabatan || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold py-0.5">Unit Kerja</td>
                            <td className="px-2 py-0.5">:</td>
                            <td className="font-medium py-0.5">{profile?.school?.name || '................................'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Main Data Table */}
            <table className="w-full border-collapse border border-slate-900 text-[10px] mb-4">
                <thead>
                    <tr className="bg-amber-100/50">
                        <th className="border border-slate-900 px-2 py-3 font-bold w-8">No</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-32">Hari / Tanggal</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold">Dasar Pelaksanaan</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold">Uraian Pekerjaan</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-32">Hasil / Output</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-20">Paraf</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDates.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="border border-slate-900 px-2 py-8 text-center text-slate-500 italic">Tidak ada data kegiatan pada periode ini</td>
                        </tr>
                    ) : (
                        sortedDates.map((date, dateIndex) => {
                            const dateActivities = groupedActivities[date];
                            const dayName = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' });
                            const dateStr = new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

                            return dateActivities.map((act, actIndex) => {
                                const classNames = act.classes?.map((c) => c.class?.name).join(', ');
                                return (
                                    <tr key={act.id} className={actIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                        {actIndex === 0 && (
                                            <>
                                                <td rowSpan={dateActivities.length} className="border border-slate-900 px-2 py-2 text-center font-bold align-top">
                                                    {dateIndex + 1}
                                                </td>
                                                <td rowSpan={dateActivities.length} className="border border-slate-900 px-2 py-2 text-center font-bold align-top whitespace-nowrap text-[9px]">
                                                    {dayName}, {dateStr}
                                                </td>
                                            </>
                                        )}
                                        <td className="border border-slate-900 px-2 py-2">{act.basis?.name || '-'}</td>
                                        <td className="border border-slate-900 px-2 py-2">
                                            <div className="font-medium">{act.category?.is_teaching ? (act.learning_material || act.description) : act.description}</div>
                                            {act.category?.is_teaching && classNames && (
                                                <div className="text-[9px] text-slate-600 italic mt-0.5">Kls: {classNames}</div>
                                            )}
                                        </td>
                                        <td className="border border-slate-900 px-2 py-2 text-[9px]">{act.learning_outcome || act.student_outcome || 'Terlaksana'}</td>
                                        {actIndex === 0 && (
                                            <td rowSpan={dateActivities.length} className="border border-slate-900 px-2 py-2 text-center align-top"></td>
                                        )}
                                    </tr>
                                );
                            });
                        })
                    )}
                </tbody>
            </table>

            <p className="text-center text-[9px] text-slate-500 mb-8 print:mb-4">* Halaman berlanjut jika ada</p>

            <ReportFooter
                profileName={profile?.name || undefined}
                profileNip={profile?.nip || undefined}
                headmasterName={profile?.school?.headmasterName || undefined}
                headmasterNip={profile?.school?.headmasterNip || undefined}
                schoolName={profile?.school?.name || undefined}
                schoolAddress={profile?.school?.address || undefined}
                schoolCity={profile?.school?.city || undefined}
                reportDate={lastDate}
            />
        </div>
    );
}
