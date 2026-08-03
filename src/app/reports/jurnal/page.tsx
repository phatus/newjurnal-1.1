import React from "react";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { ReportFooter, PrintButton, BackButton } from "@/components/ReportComponents";
import { redirect } from "next/navigation";
import type { Activity } from "@/types";

export default async function JurnalReportPage(props: {
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
            category: {
                isTeaching: true
            },
            activityDate: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            category: true,
            classRooms: {
                include: {
                    classRoom: true
                }
            }
        },
        orderBy: { activityDate: 'asc' }
    });

    const activities = dbActivities.map(act => ({
        id: act.id.toString(),
        activity_date: act.activityDate.toISOString().split('T')[0],
        description: act.description,
        topic: act.topic,
        teaching_hours: act.teachingHours,
        learning_material: act.learningMaterial,
        learning_outcome: act.learningOutcome,
        student_outcome: act.studentOutcome,
        category: act.category ? { name: act.category.name, is_teaching: act.category.isTeaching } : null,
        classes: act.classRooms.map(c => ({
            class: c.classRoom ? { name: c.classRoom.name } : null
        }))
    })) as any[];

    const monthName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month - 1];

    return (
        <div className="bg-white min-h-screen p-10 print:p-0 font-sans text-slate-900 max-w-5xl mx-auto printable-area">
            <div className="no-print mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pratinjau: JURNAL MENGAJAR — {monthName} {year}</p>
                <div className="flex gap-3">
                    <BackButton />
                    <PrintButton />
                </div>
            </div>


            <h2 className="text-center text-lg font-black mb-1 tracking-wide">Jurnal Pelaksanaan Pembelajaran</h2>
            <p className="text-center text-xs font-bold text-slate-600 mb-6">{monthName} {year}</p>

            {/* Teacher Information Section */}
            <div className="mb-6 text-sm">
                <table className="w-full text-[11px] leading-relaxed">
                    <tbody>
                        <tr>
                            <td className="font-bold w-32">Nama Guru</td>
                            <td className="px-2">:</td>
                            <td className="font-medium">{profile?.name || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold">NIP</td>
                            <td className="px-2">:</td>
                            <td className="font-medium">{profile?.nip || '................................'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold">Mata Pelajaran</td>
                            <td className="px-2">:</td>
                            <td className="font-medium">{profile?.subject || 'Semua Mapel'}</td>
                        </tr>
                        <tr>
                            <td className="font-bold">Unit Kerja</td>
                            <td className="px-2">:</td>
                            <td className="font-medium">{profile?.school?.name || '................................'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Main Data Table */}
            <table className="w-full border-collapse border border-slate-900 text-[10px] mb-4">
                <thead>
                    <tr className="bg-amber-100/50">
                        <th className="border border-slate-900 px-2 py-3 font-bold w-8">No</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-28">Hari / Tgl</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-24">Kelas</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-16">Jam Ke</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold">Materi Pembelajaran</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold w-32">Hasil / Capaian</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const dateSpans: Record<string, number> = {};
                        (activities || []).forEach((act: Activity) => {
                            const d = act.activity_date;
                            dateSpans[d] = (dateSpans[d] || 0) + 1;
                        });

                        let lastDate = "";
                        let globalNo = 0;

                        return (activities || []).map((act: Activity, i: number) => {
                            const isNewDate = act.activity_date !== lastDate;
                            if (isNewDate) {
                                lastDate = act.activity_date;
                                globalNo++;
                            }

                            const dateObj = new Date(act.activity_date);
                            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                            const day = dateObj.getDate().toString().padStart(2, '0');
                            const monthIndex = dateObj.getMonth();
                            const yearNum = dateObj.getFullYear();

                            const dateStr = `${day}/${String(monthIndex + 1).padStart(2, '0')}/${yearNum}`;
                            const classNames = act.classes?.map((c) => c.class?.name).join(', ');

                            return (
                                <tr key={act.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    {isNewDate && (
                                        <>
                                            <td rowSpan={dateSpans[act.activity_date]} className="border border-slate-900 px-2 py-2 text-center align-top font-bold">
                                                {globalNo}
                                            </td>
                                            <td rowSpan={dateSpans[act.activity_date]} className="border border-slate-900 px-2 py-2 text-center align-top font-bold text-[9px] whitespace-nowrap">
                                                {dayName}, {dateStr}
                                            </td>
                                        </>
                                    )}
                                    <td className="border border-slate-900 px-2 py-2 text-center font-bold">{classNames || '-'}</td>
                                    <td className="border border-slate-900 px-2 py-2 text-center font-bold">{act.teaching_hours || '-'}</td>
                                    <td className="border border-slate-900 px-2 py-2">{act.learning_material || act.topic || act.description}</td>
                                    <td className="border border-slate-900 px-2 py-2 text-[9px]">{act.learning_outcome || act.student_outcome || '-'}</td>
                                </tr>
                            );
                        });
                    })()}
                    {(!activities || activities.length === 0) && (
                        <tr>
                            <td colSpan={6} className="border border-slate-900 px-2 py-8 text-center text-slate-500 italic">Tidak ada data jurnal mengajar pada periode ini</td>
                        </tr>
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
