import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getSchedules, getHolidays } from "./actions";
import { getCategories, getClassRooms, getImplementationBases } from "@/app/activities/actions";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
    const schedules = await getSchedules();
    const categories = await getCategories();
    const classes = await getClassRooms();
    const bases = await getImplementationBases();
    const { data: holidays } = await getHolidays();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Master Data</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Jadwal Rutin Mingguan</h1>
                <p className="text-slate-500 mt-1 font-medium">Atur jam mengajar (KBM) atau agenda rutin lainnya agar terisi otomatis di jurnal harian.</p>
            </div>

            <ScheduleClient
                schedules={schedules}
                categories={categories}
                classes={classes}
                bases={bases}
                holidays={(holidays || []) as any}
            />
        </div>
    );
}
