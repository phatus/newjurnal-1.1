import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ActivityForm from "@/components/ActivityForm";
import { getCategories, getClassRooms, getImplementationBases, seedInitialData, createActivity } from "@/app/activities/actions";

import { AlertCircle, CheckCircle2 } from "lucide-react";

export default async function CreateActivityPage(props: {
    searchParams: Promise<{ message?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const message = searchParams.message;
    const type = searchParams.type;

    const categories = await getCategories();
    const classes = await getClassRooms();
    const bases = await getImplementationBases();

    const isDbEmpty = categories.length === 0;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Input Data</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catat Kegiatan Harian</h1>
                        <p className="text-slate-500 mt-1 font-medium">Rekam aktivitas profesional Anda untuk laporan kinerja.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full px-6 sm:px-10 mt-10">
                {message && (
                    <div className={cn(
                        "mb-8 p-6 rounded-[2rem] border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
                        type === 'error' ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                    )}>
                        {type === 'error' ? <AlertCircle className="shrink-0" /> : <CheckCircle2 className="shrink-0" />}
                        <p className="text-sm font-black uppercase tracking-tight">{message}</p>
                    </div>
                )}

                {isDbEmpty ? (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm text-center space-y-6">
                        <h2 className="text-2xl font-black text-slate-900">Database Kosong</h2>
                        <p className="text-slate-500 font-medium">Tampaknya kategori laporan belum dikonfigurasi. Silakan klik tombol di bawah untuk mengisi data awal secara otomatis.</p>
                        <form action={seedInitialData}>
                            <button
                                type="submit"
                                className="px-8 h-14 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                Inisialisasi Data Dasar
                            </button>
                        </form>
                    </div>
                ) : (
                    <ActivityForm
                        categories={categories}
                        classes={classes}
                        bases={bases}
                        action={createActivity}
                    />
                )}
            </div>
        </div>
    );
}
