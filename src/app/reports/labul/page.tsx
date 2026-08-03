import React from "react";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { ReportFooter, PrintButton, BackButton } from "@/components/ReportComponents";
import type { Activity } from "@/types";
import { redirect } from "next/navigation";

export default async function LabulReportPage(props: {
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
        evidence_link: act.evidenceLink,
        category: act.category ? { name: act.category.name, rhk_label: act.category.rhkLabel, is_teaching: act.category.isTeaching } : null,
        classes: act.classRooms.map(c => ({
            class: c.classRoom ? { name: c.classRoom.name } : null
        }))
    })) as any[];

    // Group activities by RHK and Activity Description for deduplication
    const groupedActivities: Record<string, {
        rhk: string;
        description: string;
        volume: number;
        evidences: Set<string>
    }> = {};

    (activities || []).forEach((act: Activity) => {
        const rhk = act.category?.rhk_label || "Lain-lain";

        // For teaching activities, add prefix and use topic (Nama Pelajaran)
        const baseDesc = act.category?.is_teaching ? (act.topic || act.description) : act.description;
        let displayDesc = act.category?.is_teaching ? `Melaksanakan kegiatan pembelajaran ${baseDesc}` : baseDesc;

        // Add classes if available
        if (act.classes && act.classes.length > 0) {
            const clsNames = act.classes?.map((c) => c.class?.name).filter((name): name is string => !!name).sort().join(', ') || '';
            if (clsNames) displayDesc = `${displayDesc} (Kls: ${clsNames})`;
        }

        const groupKey = `${rhk}-${displayDesc}`;

        if (!groupedActivities[groupKey]) {
            groupedActivities[groupKey] = {
                rhk,
                description: displayDesc,
                volume: 0,
                evidences: new Set()
            };
        }

        groupedActivities[groupKey].volume += 1;
        if (act.evidence_link) {
            groupedActivities[groupKey].evidences.add(act.evidence_link);
        }
    });

    const finalReportData = Object.values(groupedActivities).sort((a, b) => a.rhk.localeCompare(b.rhk));

    const monthName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month - 1];

    return (
        <div className="bg-white min-h-screen p-10 print:p-0 font-sans text-slate-900 max-w-7xl mx-auto printable-area">
            <div className="no-print mb-8 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pratinjau: LABUL — {monthName} {year}</p>
                <div className="flex gap-3">
                    <BackButton />
                    <PrintButton />
                </div>
            </div>

            <h2 className="text-center text-xl font-black mb-1 tracking-wide">Laporan Kinerja Bulanan</h2>
            <p className="text-center text-sm font-bold text-slate-600 mb-8">{monthName} {year}</p>

            {/* Two Column Header Table */}
            <div className="signature-block">
                <table className="w-full border-collapse border border-slate-900 text-[10px] mb-6">
                    <thead>
                        <tr className="bg-amber-100/50">
                            <th className="border border-slate-900 px-4 py-2 w-1/2 text-center font-black">Pejabat Penilai</th>
                            <th className="border border-slate-900 px-4 py-2 w-1/2 text-center font-black">ASN yang Melaporkan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-slate-900 p-0">
                                <table className="w-full border-collapse text-[9px]">
                                    <tbody>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">NAMA</td>
                                            <td className="px-3 py-1">: {profile?.school?.headmasterName || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">NIP</td>
                                            <td className="px-3 py-1">: {profile?.school?.headmasterNip || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">PANGKAT/GOL</td>
                                            <td className="px-3 py-1">: {profile?.school?.headmasterPangkat || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">JABATAN</td>
                                            <td className="px-3 py-1">: {profile?.school?.headmasterJabatan || 'Kepala Madrasah'}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">Unit Kerja</td>
                                            <td className="px-3 py-1">: {profile?.school?.name || '................................'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td className="border border-slate-900 p-0">
                                <table className="w-full border-collapse text-[9px]">
                                    <tbody>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">NAMA</td>
                                            <td className="px-3 py-1">: {profile?.name || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">NIP</td>
                                            <td className="px-3 py-1">: {profile?.nip || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">PANGKAT/GOL</td>
                                            <td className="px-3 py-1">: {profile?.pangkatGol || '................................'}</td>
                                        </tr>
                                        <tr className="border-b border-slate-900">
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">JABATAN</td>
                                            <td className="px-3 py-1">: {profile?.jabatan || '................................'}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-1 w-24 font-bold border-r border-slate-900">Unit Kerja</td>
                                            <td className="px-3 py-1">: {profile?.school?.name || '................................'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Main Data Table */}
            <table className="w-full border-collapse border border-slate-900 text-[10px] mb-4">
                <thead>
                    <tr className="bg-amber-100/50">
                        <th className="border border-slate-900 px-2 py-3 font-bold uppercase w-10">NO</th>
                        <th className="border border-slate-900 px-3 py-3 font-bold uppercase text-center">RENCANA HASIL KERJA (RHK)</th>
                        <th className="border border-slate-900 px-3 py-3 font-bold uppercase text-center">URAIAN KEGIATAN</th>
                        <th className="border border-slate-900 px-2 py-3 font-bold uppercase text-center w-20">VOLUME</th>
                        <th className="border border-slate-900 px-3 py-3 font-bold uppercase text-center">ALAMAT EVIDEN</th>
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const rhkSpans: Record<string, number> = {};
                        finalReportData.forEach(item => {
                            rhkSpans[item.rhk] = (rhkSpans[item.rhk] || 0) + 1;
                        });

                        let currentRHK = "";
                        let sequenceNumber = 0; // Numbering resets/persists based on RHK change

                        return (finalReportData || []).map((item, i) => {
                            const isNewRHK = item.rhk !== currentRHK;
                            if (isNewRHK) {
                                currentRHK = item.rhk;
                                sequenceNumber++; // Increment NO when RHK changes
                            }

                            return (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    {isNewRHK ? (
                                        <td rowSpan={rhkSpans[item.rhk]} className="border border-slate-900 px-2 py-3 text-center font-bold align-top">
                                            {sequenceNumber}
                                        </td>
                                    ) : null}
                                    {isNewRHK ? (
                                        <td rowSpan={rhkSpans[item.rhk]} className="border border-slate-900 px-3 py-3 font-bold align-top">
                                            {item.rhk}
                                        </td>
                                    ) : null}
                                    <td className="border border-slate-900 px-3 py-3 align-top">
                                        {item.description}
                                    </td>
                                    <td className="border border-slate-900 px-2 py-3 text-center align-top font-bold whitespace-nowrap">
                                        {item.volume}
                                    </td>
                                    <td className="border border-slate-900 px-3 py-3 align-top text-[8px] text-blue-600 break-all">
                                        <div className="space-y-1">
                                            {Array.from(item.evidences).map((link, idx) => (
                                                <p key={idx} className="underline line-clamp-1">{link}</p>
                                            ))}
                                            {item.evidences.size === 0 && <p className="text-slate-400">-</p>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        });
                    })()}
                    {finalReportData.length === 0 && (
                        <tr>
                            <td colSpan={5} className="border border-slate-900 px-2 py-12 text-center italic text-slate-500">
                                Belum ada data kinerja untuk periode ini.
                            </td>
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
