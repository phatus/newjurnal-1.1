import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import ActivityForm from "@/components/ActivityForm";
import {
    getCategories,
    getClassRooms,
    getImplementationBases,
    getActivityById,
    updateActivity
} from "@/app/activities/actions";
import { notFound } from "next/navigation";

export default async function EditActivityPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const activityId = params.id;

    if (!activityId) return notFound();

    const categories = await getCategories();
    const classes = await getClassRooms();
    const bases = await getImplementationBases();

    let activity;
    try {
        activity = await getActivityById(activityId);
    } catch (error) {
        console.error("EditActivityPage Error:", error);
        return notFound();
    }

    if (!activity) return notFound();

    // Bind ID to updateActivity Server Action
    const updateActivityWithId = updateActivity.bind(null, activityId);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            {/* Page Header */}
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/activities"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Edit Data</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Perbarui Kegiatan</h1>
                        <p className="text-slate-500 mt-1 font-medium">Ubah detail catatan aktivitas harian Anda.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full px-6 sm:px-10 mt-10">
                <ActivityForm
                    categories={categories}
                    classes={classes}
                    bases={bases}
                    initialData={activity}
                    action={updateActivityWithId}
                />
            </div>
        </div>
    );
}
