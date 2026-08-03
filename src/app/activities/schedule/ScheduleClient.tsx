"use client";

import React, { useState, useTransition } from "react";
import { Trash2, Calendar, Clock, Pencil, Users, AlertCircle } from "lucide-react";
import { deleteSchedule } from "./actions";
import ScheduleForm from "@/components/ScheduleForm";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import type { Schedule, Category, ClassRoom, ImplementationBase, Holiday } from "@/types";

interface ScheduleClientProps {
    schedules: Schedule[];
    categories: Category[];
    classes: ClassRoom[];
    bases: ImplementationBase[];
    holidays: Holiday[];
}

export default function ScheduleClient({ schedules, categories, classes, bases, holidays }: ScheduleClientProps) {
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const dayNames = [
        "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
    ];

    // Group schedules by day
    const groupedSchedules = schedules.reduce((acc: Record<number, Schedule[]>, s: Schedule) => {
        const day = s.day_of_week;
        if (!acc[day]) acc[day] = [];
        acc[day].push(s);
        return acc;
    }, {} as Record<number, Schedule[]>);

    // Group holidays by day of week
    const holidaysByDay = holidays.reduce((acc: Record<number, Holiday[]>, h: Holiday) => {
        const date = new Date(h.holiday_date);
        const day = date.getDay(); // 0 (Sunday) to 6 (Saturday)
        if (!acc[day]) acc[day] = [];
        acc[day].push(h);
        return acc;
    }, {} as Record<number, Holiday[]>);

    // Sort days starting from Monday (1) to Sunday (0)
    const sortedDayIndexes = [1, 2, 3, 4, 5, 6, 0];

    const handleEdit = (schedule: Schedule) => {
        console.log("DEBUG: Editing schedule", schedule.id);
        setEditingSchedule(schedule);
        // Scroll to form
        const element = document.getElementById("schedule-form");
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const handleDelete = async (id: string, topic: string | null | undefined) => {
        if (!confirm(`Hapus jadwal "${topic ?? 'tanpa judul'}"?`)) return;

        console.log("DEBUG: Deleting schedule", id);
        startTransition(async () => {
            try {
                const result = await deleteSchedule(id);
                console.log("DEBUG: Delete result", result);
                if (result?.success) {
                    toast.success('Jadwal berhasil dihapus');
                    router.refresh();
                } else {
                    toast.error(`Gagal menghapus: ${result?.error || 'Terjadi kesalahan sistem'}`);
                }
            } catch (err: unknown) {
                console.error("DEBUG: Delete error", err);
                const error = err as { message?: string };
                toast.error(`Gagal menghapus: ${error.message || 'Terjadi kesalahan'}`);
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 mt-10 grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <ScheduleForm
                categories={categories}
                classes={classes}
                bases={bases}
                initialData={editingSchedule}
                allSchedules={schedules}
                onCancel={() => setEditingSchedule(null)}
            />

            {/* List Section */}
            <section className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-900">Daftar Jadwal Rutin</h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                        {schedules.length} Jadwal Total
                    </span>
                </div>

                {schedules.length === 0 && holidays.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-20 border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                        <Calendar size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Belum ada jadwal atau hari libur</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedDayIndexes.map((dayIdx) => {
                            const daySchedules = groupedSchedules[dayIdx] || [];
                            const dayHolidays = holidaysByDay[dayIdx] || [];
                            const hasContent = daySchedules.length > 0 || dayHolidays.length > 0;

                            if (!hasContent) return null;

                            return (
                                <div key={dayIdx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{dayNames[dayIdx]}</h3>
                                        <div className="h-px flex-1 bg-slate-100" />
                                    </div>

                                    <div className="grid gap-3">
                                        {/* Holidays First */}
                                        {dayHolidays.map((holiday: Holiday) => (
                                            <div key={`holiday-${holiday.id}`} className="group bg-red-50 p-5 rounded-3xl border-2 border-red-100">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                                        <AlertCircle size={24} className="text-red-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-black text-red-700 truncate uppercase text-sm tracking-tight">
                                                                Hari Libur: {holiday.name}
                                                            </h4>
                                                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-[8px] font-black text-red-600 uppercase tracking-widest whitespace-nowrap">
                                                                {holiday.is_national ? 'Nasional' : 'Lokal'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                                                            {new Date(holiday.holiday_date).toLocaleDateString('id-ID', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                        {holiday.description && (
                                                            <p className="text-red-500 text-sm mt-2">{holiday.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Regular Schedules */}
                                        {daySchedules.map((item: Schedule) => {
                                            const classNames = item.schedule_class_rooms?.map((p) => p.class_rooms?.name).filter(Boolean).join(', ');

                                            return (
                                                <div key={item.id} className="group bg-white p-5 rounded-3xl border border-slate-100 hover:border-amber-100 hover:shadow-xl hover:shadow-amber-50/50 transition-all flex items-center gap-5">
                                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all shrink-0">
                                                        <Clock size={20} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className="font-black text-slate-900 truncate uppercase text-sm tracking-tight">{item.topic}</h4>
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                                {item.report_categories?.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {item.teaching_hours && (
                                                                <span className="text-amber-600 flex items-center gap-1">
                                                                    <Clock size={10} /> {item.teaching_hours} JP
                                                                </span>
                                                            )}
                                                            {classNames && (
                                                                <span className="text-slate-500 flex items-center gap-1">
                                                                    <Users size={10} /> {classNames}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all shrink-0"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id, item.topic)}
                                                            disabled={isPending}
                                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0 disabled:opacity-50"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
