'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DashboardDateFilter({ selectedDate }: { selectedDate: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse "YYYY-MM-DD" as local date (no timezone shift) for display purposes
    const [sy, sm, sd] = selectedDate.split('-').map(Number)
    const date = new Date(sy, sm - 1, sd)

    /** Format a local Date to "YYYY-MM-DD" without timezone conversion */
    const toLocalDateStr = (d: Date): string => {
        const y = d.getFullYear()
        const mo = String(d.getMonth() + 1).padStart(2, '0')
        const dy = String(d.getDate()).padStart(2, '0')
        return `${y}-${mo}-${dy}`
    }

    const handleDateChange = (newDate: Date) => {
        const dateStr = toLocalDateStr(newDate)
        const params = new URLSearchParams(searchParams ? searchParams.toString() : '')
        params.set('date', dateStr)
        router.push(`/?${params.toString()}`)
    }

    const prevDay = () => {
        const d = new Date(date)
        d.setDate(d.getDate() - 1)
        handleDateChange(d)
    }

    const nextDay = () => {
        const d = new Date(date)
        d.setDate(d.getDate() + 1)
        handleDateChange(d)
    }

    const isToday = selectedDate === toLocalDateStr(new Date())

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 sm:p-3 rounded-3xl border border-slate-100 shadow-sm w-fit">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl">
                <button 
                    onClick={prevDay}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-amber-500 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-2 px-4 h-10">
                    <Calendar size={18} className="text-amber-500" />
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => {
                            const [y, m, d] = e.target.value.split('-').map(Number)
                            handleDateChange(new Date(y, m - 1, d))
                        }}
                        className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer p-0"
                    />
                </div>

                <button 
                    onClick={nextDay}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-amber-500 transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {!isToday && (
                <button 
                    onClick={() => handleDateChange(new Date())}
                    className="px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                >
                    Kembali ke Hari Ini
                </button>
            )}
        </div>
    )
}
