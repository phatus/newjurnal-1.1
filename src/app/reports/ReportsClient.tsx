"use client";

import React, { useState } from "react";
import { Calendar, Download, ArrowRight, FileText, BookOpen, ClipboardCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
    FileText,
    BookOpen,
    ClipboardCheck
};

export default function ReportsClient({ reportTypes }: { reportTypes: Array<{ id: string; icon: string; bg: string; color: string; name: string; desc: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [month, setMonth] = useState((searchParams && searchParams.get("month")) || new Date().getMonth().toString());
    const [year, setYear] = useState((searchParams && searchParams.get("year")) || new Date().getFullYear().toString());

    function handleDownload(id: string) {
        router.push(`/reports/${id}?month=${month}&year=${year}`);
    }

    return (
        <div className="space-y-10">
            {/* Filters Header (Duplicate of what was in page.tsx but functional) */}
            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-fit ml-auto -mt-20 relative z-20">
                <div className="flex items-center gap-2 px-3 border-r border-slate-200">
                    <Calendar size={18} className="text-slate-400" />
                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 appearance-none py-1"
                    >
                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
                <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 appearance-none py-1 pr-8"
                >
                    {[2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <section className="space-y-6">
                <h2 className="text-sm font-black text-slate-900 tracking-widest ml-2 border-l-4 border-amber-500 pl-4 uppercase">Eksport Laporan</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {reportTypes.map((type) => {
                        const Icon = iconMap[type.icon] || FileText;
                        return (
                            <div key={type.id} className="group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1">
                                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", type.bg, type.color)}>
                                    <Icon size={28} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{type.name}</h3>
                                <p className="text-[11px] text-slate-400 font-bold mt-3 leading-relaxed uppercase tracking-wide">
                                    {type.desc}
                                </p>

                                <div className="mt-auto pt-8 w-full">
                                    <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100/50">
                                        <button
                                            onClick={() => handleDownload(type.id)}
                                            className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-white text-amber-600 border border-amber-100 font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                                        >
                                            <Download size={14} />
                                            CETAK PDF
                                        </button>
                                        <button
                                            onClick={() => handleDownload(type.id)}
                                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-100 hover:text-amber-500 hover:border-amber-200 transition-all"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
