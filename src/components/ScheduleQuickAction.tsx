'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Calendar, Clock, ArrowRight, Book, Target, Save, X } from 'lucide-react'
import { convertScheduleToActivity } from '@/app/activities/schedule/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Schedule } from "@/types";

interface ScheduleItem {
    id: string
    topic: string
    day_of_week: number
    teaching_hours?: string
    is_confirmed_today?: boolean
    report_categories?: { name: string, is_teaching?: boolean }
    schedule_class_rooms?: { class_rooms: { name: string } }[]
}

export default function ScheduleQuickAction({ initialSchedules, selectedDate }: { initialSchedules: Schedule[], selectedDate: string }) {
    const [todaySchedules, setTodaySchedules] = useState<ScheduleItem[]>([])
    const [loading, setLoading] = useState<string | null>(null)
    const [completed, setCompleted] = useState<string[]>([])
    
    // KBM Input States
    const [isInputting, setIsInputting] = useState<string | null>(null)
    const [materi, setMateri] = useState('')
    const [capaian, setCapaian] = useState('')

    useEffect(() => {
        // Parse the selectedDate to get the day of the week (0-6)
        const dateObj = new Date(selectedDate)
        const dayOfWeek = dateObj.getDay()

        const filtered = (initialSchedules.filter(s => s.day_of_week === dayOfWeek) as any) as ScheduleItem[]
        setTodaySchedules(filtered)

        // Mark as completed if already confirmed on server
        const alreadyConfirmed = filtered.filter(s => s.is_confirmed_today).map(s => s.id)
        setCompleted(alreadyConfirmed)
    }, [initialSchedules, selectedDate])

    const handleConfirm = async (id: string, mat?: string, cap?: string) => {
        setLoading(id)
        try {
            const result = await convertScheduleToActivity(id, selectedDate, mat, cap) as { success: boolean; error?: string }

            if (result && result.success === false) {
                toast.error(result.error || 'Terjadi kesalahan.')
                if (result.error?.includes('sudah dibuat')) {
                    setCompleted(prev => [...prev, id])
                }
            } else {
                setCompleted(prev => [...prev, id])
                toast.success('Kegiatan berhasil dicatat dari jadwal!')
                setIsInputting(null)
                setMateri('')
                setCapaian('')
            }
        } catch (error: unknown) {
            console.error('Failed to confirm schedule:', error)
            const err = error as { message?: string };
            toast.error(err.message || 'Gagal mencatat kegiatan. Silakan coba lagi.')
        } finally {
            setLoading(null)
        }
    }

    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    if (todaySchedules.length === 0) {
        if (initialSchedules.length === 0) {
            return (
                <section className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 border-dashed text-center space-y-3">
                    <Calendar className="mx-auto text-amber-500 opacity-50" size={32} />
                    <div>
                        <h3 className="text-sm font-black text-amber-900 uppercase">Otomatisasi Belum Diatur</h3>
                        <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-wider">Atur jadwal mingguan Anda agar pengisian jurnal harian jadi lebih cepat!</p>
                    </div>
                    <a href="/activities/schedule" className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">
                        MULAI ATUR JADWAL <ArrowRight size={14} />
                    </a>
                </section>
            )
        }
        return null
    }

    return (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="text-amber-500" size={20} />
                    {isToday ? 'Jadwal Anda Hari Ini' : `Jadwal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                    {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long' })}
                </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-start">
                {todaySchedules.map((item) => {
                    const isDone = completed.includes(item.id)
                    const isKBM = item.report_categories?.is_teaching === true
                    const classNames = item.schedule_class_rooms?.map((p) => p.class_rooms?.name).filter(Boolean).join(', ');
                    const isExpanded = isInputting === item.id

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative overflow-hidden transition-all duration-500",
                                isExpanded ? "sm:col-span-2" : "",
                                isDone
                                    ? "bg-green-50/50 border border-green-100 opacity-75 shadow-sm rounded-[2rem] p-6"
                                    : "bg-white border border-slate-100 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-50 rounded-[2rem] p-6"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                    isDone ? "bg-green-500 text-white shadow-lg shadow-green-100" : "bg-slate-50 text-slate-400 group-hover:bg-amber-500 group-hover:text-white"
                                )}>
                                    {isDone ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                </div>
                                {!isDone && !isExpanded && (
                                    <button
                                        onClick={() => {
                                            if (isKBM) {
                                                setIsInputting(item.id)
                                            } else {
                                                handleConfirm(item.id)
                                            }
                                        }}
                                        disabled={loading === item.id}
                                        className="h-10 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {loading === item.id ? "PROSES..." : (isKBM ? "INPUT KEGIATAN" : "KONFIRMASI SELESAI")}
                                    </button>
                                )}
                                {isExpanded && (
                                    <button 
                                        onClick={() => setIsInputting(null)}
                                        className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className={cn(
                                    "font-black tracking-tight uppercase truncate transition-colors",
                                    isDone ? "text-green-700" : "text-slate-900 group-hover:text-amber-600"
                                )}>
                                    {item.topic}
                                </h3>
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className={cn(isDone ? "text-green-600/60" : "text-slate-400")}>{item.report_categories?.name}</span>
                                    {item.teaching_hours && <span className={cn(isDone ? "text-green-600/60" : "text-slate-400")}>• {item.teaching_hours} JP</span>}
                                    {classNames && (
                                        <span className={cn(isDone ? "text-green-600" : "text-amber-500")}>• KLS: {classNames}</span>
                                    )}
                                </div>
                            </div>

                            {/* Expanded KBM Input Section */}
                            {isExpanded && (
                                <div className="mt-8 pt-6 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Book size={12} className="text-amber-500" />
                                                Materi Pembelajaran Yang Diajarkan
                                            </label>
                                            <div className="relative group/input">
                                                <textarea
                                                    value={materi}
                                                    onChange={(e) => setMateri(e.target.value)}
                                                    placeholder="Topik materi yang diajarkan hari ini..."
                                                    className="w-full h-32 p-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Target size={12} className="text-green-500" />
                                                Capaian / Hasil Pembelajaran
                                            </label>
                                            <div className="relative group/input">
                                                <textarea
                                                    value={capaian}
                                                    onChange={(e) => setCapaian(e.target.value)}
                                                    placeholder="Siswa mampu memahami konsep dasar..."
                                                    className="w-full h-32 p-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleConfirm(item.id, materi, capaian)}
                                            disabled={loading === item.id || !materi || !capaian}
                                            className="h-14 px-8 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-3"
                                        >
                                            {loading === item.id ? (
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            SIMPAN KEGIATAN
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isDone && (
                                <div className="absolute top-2 right-2 rotate-12">
                                    <span className="text-[10px] font-black text-green-600 border-2 border-green-600 rounded px-2 py-0.5 uppercase opacity-30">Tercatat</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
