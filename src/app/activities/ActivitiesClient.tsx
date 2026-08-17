"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    ChevronLeft,
    Search,
    Trash2,
    FileText,
    BookOpen,
    ExternalLink,
    Calendar,
    Clock,
    AlertCircle,
    Loader2,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { deleteActivity } from "@/app/activities/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import type { Activity } from "@/types";

interface ActivitiesClientProps {
    initialActivities: Activity[];
    currentMonth?: number;
    currentYear?: number;
    message?: string;
    type?: string;
}

export default function ActivitiesClient({
    initialActivities,
    currentMonth,
    currentYear,
    message,
    type,
}: ActivitiesClientProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<Activity[]>(initialActivities);
    const [search, setSearch] = useState("");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentYear || new Date().getFullYear());

    // Sync activities state when initialActivities changes
    useEffect(() => {
        setActivities(initialActivities);
    }, [initialActivities]);

    const filteredActivities = activities.filter((act: Activity) =>
        act.description.toLowerCase().includes(search.toLowerCase()) ||
        (act.category?.name || '').toLowerCase() === search.toLowerCase()
    );

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    function handleFilter() {
        router.push(`/activities?month=${selectedMonth}&year=${selectedYear}`);
    }

    function handleDeleteClick(id: string) {
        setItemToDelete(id);
        setShowDeleteModal(true);
    }

    async function confirmDelete() {
        if (!itemToDelete) return;
        setShowDeleteModal(false);
        setLoadingId(itemToDelete);
        try {
            await deleteActivity(itemToDelete);
            setActivities(activities.filter(a => a.id !== itemToDelete));
            toast.success('Kegiatan berhasil dihapus');
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Terjadi kesalahan');
        } finally {
            setLoadingId(null);
            setItemToDelete(null);
        }
    }

    // Safe date formatting helper to avoid 'Invalid Date' errors
    function formatActivityDate(dateVal: string, isShortMonth = true) {
        if (!dateVal || dateVal === 'undefined') return { dateStr: '-', dayStr: '-' };
        const cleanStr = String(dateVal).split('T')[0];
        const parts = cleanStr.split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
            const [year, month, day] = parts;
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) {
                const dateStr = d.toLocaleDateString('id-ID', {
                    day: isShortMonth ? '2-digit' : 'numeric',
                    month: isShortMonth ? 'short' : 'long',
                    year: 'numeric'
                });
                const dayStr = d.toLocaleDateString('id-ID', { weekday: 'long' });
                return { dateStr, dayStr };
            }
        }
        return { dateStr: cleanStr, dayStr: '-' };
    }

    // Group activities by date
    const groupedActivities = useMemo(() => {
        return filteredActivities.reduce((acc: Record<string, Activity[]>, act: Activity) => {
            const rawDate = act.activity_date || (act as any).activityDate;
            let date = '';
            if (rawDate) {
                if (rawDate instanceof Date) {
                    date = rawDate.toISOString().split('T')[0];
                } else {
                    date = String(rawDate).split('T')[0];
                }
            }
            if (!date) return acc;
            if (!acc[date]) acc[date] = [];
            acc[date].push(act);
            return acc;
        }, {} as Record<string, Activity[]>);
    }, [filteredActivities]);

    const sortedDates = useMemo(() => Object.keys(groupedActivities).sort().reverse(), [groupedActivities]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Riwayat Kegiatan</span>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 flex-1">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Kegiatan Harian</h1>
                            <p className="text-slate-500 mt-1 font-medium">Lihat dan kelola seluruh catatan aktivitas Anda.</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {/* Month/Year Filter */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="h-10 px-4 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="h-10 px-4 bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer border-l border-slate-200"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleFilter}
                                className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                            >
                                Filter
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari kegiatan..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-12 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 w-full md:w-64 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 mt-10">
                {message && (
                    <div className={cn(
                        "mb-8 p-6 rounded-[2rem] border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
                        type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                    )}>
                        {type === 'error' ? <AlertCircle className="shrink-0" /> : <CheckCircle2 className="shrink-0" />}
                        <p className="text-sm font-black uppercase tracking-tight">{message}</p>
                    </div>
                )}

                {filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Tidak Ada Kegiatan</h3>
                        <p className="text-slate-400 font-medium mt-2">Coba kata kunci lain atau pilih bulan lain.</p>
                        <Link href="/activities/create" className="inline-flex h-12 items-center px-8 rounded-xl bg-amber-500 text-white font-bold text-sm uppercase tracking-widest mt-8 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-100">
                            Catat Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        {/* Desktop View (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="p-4 pl-6 whitespace-nowrap">Tanggal</th>
                                        <th className="p-4">Kategori</th>
                                        <th className="p-4 min-w-[250px]">Kegiatan</th>
                                        <th className="p-4">Rincian</th>
                                        <th className="p-4 text-center">Bukti</th>
                                        <th className="p-4 pr-6 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-100">
                                    {sortedDates.flatMap((date) => {
                                        const { dateStr, dayStr } = formatActivityDate(date, true);

                                        return groupedActivities[date].map((act: Activity, index: number) => (
                                            <tr key={act.id} className={cn(
                                                "hover:bg-slate-50/50 transition-colors group",
                                                index === 0 ? "border-t-2 border-slate-100" : ""
                                            )}>
                                                <td className="p-4 pl-6 whitespace-nowrap align-top">
                                                    {index === 0 ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{dateStr}</span>
                                                            <span className="text-xs text-slate-500">{dayStr}</span>
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="p-4 whitespace-nowrap align-top">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex-wrap",
                                                        act.category?.is_teaching ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                                    )}>
                                                        {act.category?.is_teaching ? <BookOpen size={12} /> : <FileText size={12} />}
                                                        {act.category?.name || "Tanpa Kategori"}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <p className="text-slate-900 font-bold leading-relaxed">{act.description}</p>
                                                    {act.basis?.name && (
                                                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                            {act.basis.name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 align-top">
                                                    {act.category?.is_teaching ? (
                                                        <div className="flex flex-col gap-2">
                                                            {act.teaching_hours && (
                                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                                                                    <Clock size={12} className="text-amber-500" /> {act.teaching_hours} JP
                                                                </span>
                                                            )}
                                                            {act.classes && act.classes.length > 0 && (
                                                                <div className="flex gap-1.5 flex-wrap">
                                                                    {act.classes.map((c, idx) => (
                                                                        <span key={idx} className="bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm inline-block">
                                                                            {c.class?.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs italic">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 align-top text-center">
                                                    {act.evidence_link ? (
                                                        <a
                                                            href={act.evidence_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all mx-auto group/btn"
                                                            title="Lihat Bukti"
                                                        >
                                                            <ExternalLink size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                            <span className="sr-only">Lihat Bukti</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 inline-block mt-2">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 pr-6 align-top">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/activities/${act.id}/edit`}
                                                            className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-500 hover:text-white transition-all text-xs font-bold shadow-2xs shrink-0"
                                                            title="Edit Kegiatan"
                                                        >
                                                            <FileText size={14} />
                                                            <span>Edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(act.id)}
                                                            disabled={loadingId === act.id}
                                                            className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-500 hover:text-white transition-all text-xs font-bold shadow-2xs disabled:opacity-50 shrink-0"
                                                            title="Hapus Kegiatan"
                                                        >
                                                            {loadingId === act.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                                            <span>Hapus</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View (Cards) */}
                        <div className="block md:hidden">
                            {sortedDates.map((date) => {
                                const { dateStr, dayStr } = formatActivityDate(date, false);

                                return (
                                    <div key={date}>
                                        {/* Date Header */}
                                        <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-2 sticky top-0 z-10">
                                            <Calendar size={13} className="text-slate-400 shrink-0" />
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{dayStr}, {dateStr}</span>
                                            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                                {groupedActivities[date].length} kegiatan
                                            </span>
                                        </div>

                                        {/* Cards for this date */}
                                        <div className="divide-y divide-slate-100">
                                            {groupedActivities[date].map((act: Activity) => (
                                                <div key={act.id} className="bg-white">
                                                    {/* Card Body */}
                                                    <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
                                                        {/* Category Badge */}
                                                        <div className={cn(
                                                            "self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                                            act.category?.is_teaching ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                                        )}>
                                                            {act.category?.is_teaching ? <BookOpen size={10} /> : <FileText size={10} />}
                                                            {act.category?.name || "Tanpa Kategori"}
                                                        </div>

                                                        {/* Description */}
                                                        <p className="text-sm font-bold text-slate-900 leading-snug">{act.description}</p>

                                                        {/* Basis */}
                                                        {act.basis?.name && (
                                                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                                                <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                                {act.basis.name}
                                                            </div>
                                                        )}

                                                        {/* Teaching Details */}
                                                        {act.category?.is_teaching && (act.teaching_hours || (act.classes && act.classes.length > 0)) && (
                                                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                                {act.teaching_hours && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                                        <Clock size={10} className="text-amber-500" /> {act.teaching_hours} JP
                                                                    </span>
                                                                )}
                                                                {act.classes && act.classes.map((c, idx) => (
                                                                    <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-md text-[10px] font-bold">
                                                                        {c.class?.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Footer: Actions */}
                                                    <div className="flex items-center border-t border-slate-100">
                                                        {act.evidence_link && (
                                                            <a
                                                                href={act.evidence_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors border-r border-slate-100"
                                                            >
                                                                <ExternalLink size={13} /> Lihat Bukti
                                                            </a>
                                                        )}
                                                        <Link
                                                            href={`/activities/${act.id}/edit`}
                                                            className={cn(
                                                                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-slate-500 text-xs font-bold hover:bg-amber-50 hover:text-amber-600 transition-colors border-r border-slate-100",
                                                            )}
                                                        >
                                                            <FileText size={13} /> Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteClick(act.id)}
                                                            disabled={loadingId === act.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
                                                        >
                                                            {loadingId === act.id
                                                                ? <Loader2 className="animate-spin" size={13} />
                                                                : <Trash2 size={13} />
                                                            }
                                                            {loadingId === act.id ? "Menghapus..." : "Hapus"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="h-14 w-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center tracking-tight">Hapus Kegiatan?</h3>
                        <p className="text-slate-500 mt-2 font-medium text-sm text-center leading-relaxed">
                            Tindakan ini tidak dapat dibatalkan. Data kegiatan ini akan dihapus secara permanen dari sistem.
                        </p>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
