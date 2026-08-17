"use client";

import React, { useState } from "react";
import {
    Calendar,
    Tag,
    AlignLeft,
    ExternalLink,
    Clock,
    BookOpen,
    Save,
    CheckCircle2,
    AlertCircle,
    FileText,
    Briefcase,
    Target,
    Hash,
    Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { Category, ClassRoom, ImplementationBase, Activity } from "@/types";

interface ActivityFormProps {
    categories: Category[];
    classes: ClassRoom[];
    bases: ImplementationBase[];
    initialData?: Activity | null;
    action: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function ActivityForm({ categories, classes, bases, initialData, action }: ActivityFormProps) {
    const router = useRouter();
    const [selectedCategoryId, setSelectedCategoryId] = useState(
        initialData?.category_id?.toString() ||
        (initialData as any)?.categoryId?.toString() ||
        (initialData?.category as any)?.id?.toString() ||
        ""
    );
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
        initialData?.classes?.map((c) => (c.class?.id ?? (c as any).class_room_id)?.toString()).filter((id): id is string => typeof id === 'string') || []
    );
    const [loading, setLoading] = useState(false);

    const selectedCategory = categories.find(c => String(c.id) === String(selectedCategoryId));
    const isTeaching = Boolean(selectedCategory?.is_teaching ?? (selectedCategory as any)?.isTeaching);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (_e: React.FormEvent<HTMLFormElement>) => {
        setLoading(true);
        setErrors({});
    };

    function toggleClass(id: string) {
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    return (
        <form
            action={async (formData) => {
                try {
                    setLoading(true);
                    setErrors({});
                    const result = await action(formData);

                    if (result && !result.success) {
                        if (result.error) {
                            const errorMsg = result.error; // narrowed to string
                            // Basic mapping of common error messages to fields if possible
                            if (errorMsg.includes("Tanggal")) setErrors(prev => ({ ...prev, activity_date: errorMsg }));
                            else if (errorMsg.includes("Kategori")) setErrors(prev => ({ ...prev, category_id: errorMsg }));
                            else if (errorMsg.includes("Deskripsi")) setErrors(prev => ({ ...prev, description: errorMsg }));
                            else toast.error(errorMsg);
                        }
                        setLoading(false);
                    }
                } catch (err: unknown) {
                    // Allow Next.js redirect to propagate
                    if (
                        typeof err === 'object' &&
                        err !== null &&
                        (err as { name?: string }).name === 'NEXT_REDIRECT'
                    ) {
                        throw err;
                    }
                    if (
                        typeof err === 'object' &&
                        err !== null &&
                        (err as { digest?: string }).digest?.includes('NEXT_REDIRECT')
                    ) {
                        throw err;
                    }
                    const errorMsg = typeof err === 'string' ? err : (err as { message?: string }).message || 'Terjadi kesalahan tidak terduga';
                    toast.error(errorMsg);
                    setLoading(false);
                }
            }}
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-3 gap-10"
        >
            {/* Hidden field for multi-select class IDs */}
            <input type="hidden" name="class_room_ids" value={selectedClassIds.join(',')} />

            {/* Main Form Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* === Section 1: Info Dasar (Selalu Tampil) === */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informasi Dasar</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="date"
                                    name="activity_date"
                                    defaultValue={initialData?.activity_date || new Date().toISOString().split('T')[0]}
                                    required
                                    className={cn(
                                        "w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 transition-all font-bold text-slate-700",
                                        errors.activity_date ? "focus:ring-red-500 bg-red-50" : "focus:ring-amber-500"
                                    )}
                                />
                            </div>
                            {errors.activity_date && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{errors.activity_date}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Kegiatan</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select
                                    name="category_id"
                                    required
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className={cn(
                                        "w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 transition-all font-bold text-slate-700 appearance-none",
                                        errors.category_id ? "focus:ring-red-500 bg-red-50" : "focus:ring-amber-500"
                                    )}
                                >
                                    <option value="">Pilih Kategori...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.is_teaching ? '📚 ' : '📋 '}{cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.category_id && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{errors.category_id}</p>}
                            {selectedCategory && (
                                <div className={cn(
                                    "mt-3 p-4 rounded-2xl text-xs space-y-2.5 border animate-in fade-in duration-300 w-full overflow-hidden shadow-xs",
                                    isTeaching ? "bg-amber-50/80 border-amber-200/80 text-amber-900" : "bg-blue-50/80 border-blue-200/80 text-blue-900"
                                )}>
                                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-wider">
                                        {isTeaching ? <BookOpen size={15} className="text-amber-600 shrink-0" /> : <FileText size={15} className="text-blue-600 shrink-0" />}
                                        <span className={isTeaching ? "text-amber-700" : "text-blue-700"}>
                                            {isTeaching ? 'Kegiatan Belajar Mengajar (KBM)' : 'Kegiatan Non-KBM'}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/60">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Label RHK</p>
                                        <p className="text-xs font-bold text-slate-800 mt-0.5 leading-relaxed break-words">
                                            {selectedCategory.rhk_label || (selectedCategory as any).rhkLabel || selectedCategory.name}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Mata Pelajaran (Khusus KBM)</label>
                        <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                name="topic"
                                type="text"
                                defaultValue={initialData?.topic || ""}
                                placeholder="Misal: Informatika / Matematika"
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dasar Pelaksanaan</label>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <select
                                name="implementation_basis_id"
                                defaultValue={
                                    initialData?.implementation_basis_id?.toString() ||
                                    (initialData as any)?.implementationBasisId?.toString() ||
                                    (initialData?.basis as any)?.id?.toString() ||
                                    ""
                                }
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 appearance-none"
                            >
                                <option value="">Pilih Dasar Pelaksanaan (Opsional)...</option>
                                {bases.map(base => (
                                    <option key={base.id} value={base.id}>{base.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Uraian Kegiatan</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                            <textarea
                                name="description"
                                rows={4}
                                required
                                defaultValue={initialData?.description || ""}
                                placeholder={isTeaching
                                    ? "Contoh: Melaksanakan pembelajaran Basis Data di kelas XI RPL 1..."
                                    : "Deskripsikan secara detail apa yang Anda kerjakan hari ini..."
                                }
                                className={cn(
                                    "w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 transition-all font-bold text-slate-700 resize-none placeholder:font-medium",
                                    errors.description ? "focus:ring-red-500 bg-red-50" : "focus:ring-amber-500"
                                )}
                            />
                        </div>
                        {errors.description && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{errors.description}</p>}
                    </div>
                </div>

                {/* === Section 2: Detail KBM (Hanya untuk Kegiatan Mengajar) === */}
                {isTeaching && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-amber-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">2</div>
                            <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest">Detail Jurnal Mengajar</h3>
                        </div>

                        {/* Kelas (Multi-select chips) */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                Kelas yang Diajar <span className="text-amber-500">(pilih satu atau lebih)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        type="button"
                                        onClick={() => toggleClass(String(cls.id))}
                                        className={cn(
                                            "h-11 px-5 rounded-xl text-sm font-black transition-all border-2",
                                            selectedClassIds.includes(String(cls.id))
                                                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100"
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-200 hover:text-amber-600"
                                        )}
                                    >
                                        {cls.name}
                                    </button>
                                ))}
                            </div>
                            {classes.length === 0 && (
                                <p className="text-xs text-slate-400 font-medium italic">Belum ada data kelas. Tambahkan via Admin → Daftar Kelas.</p>
                            )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jam Pelajaran (JP)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="teaching_hours"
                                        defaultValue={initialData?.teaching_hours || ""}
                                        placeholder="Misal: 1-4 atau 2 JP"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Siswa Hadir</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="number"
                                        name="student_count"
                                        defaultValue={initialData?.student_count || ""}
                                        placeholder="Misal: 32"
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Materi Pembelajaran yang Diajarkan</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                                <textarea
                                    name="learning_material"
                                    rows={3}
                                    defaultValue={initialData?.learning_material || ""}
                                    placeholder="Topik materi yang diajarkan hari ini..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 resize-none placeholder:font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Capaian / Hasil Pembelajaran</label>
                            <div className="relative">
                                <Target className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                                <textarea
                                    name="learning_outcome"
                                    rows={3}
                                    defaultValue={initialData?.learning_outcome || ""}
                                    placeholder="Siswa mampu memahami konsep dasar..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 resize-none placeholder:font-medium"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* === Section 3: Hasil Kerja (Untuk Non-KBM) === */}
                {!isTeaching && selectedCategoryId && (
                    <div className="bg-white rounded-[2.5rem] p-8 border border-blue-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black">2</div>
                            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">Hasil & Output Kegiatan</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Output / Hasil Kegiatan</label>
                            <div className="relative">
                                <Award className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
                                <textarea
                                    name="learning_outcome"
                                    rows={3}
                                    defaultValue={initialData?.learning_outcome || ""}
                                    placeholder="Misal: Dokumen RPP semester genap selesai disusun..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 resize-none placeholder:font-medium"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar / Actions Area */}
            <div className="space-y-8">
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Kelengkapan</h3>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Link Bukti (G-Drive)</label>
                        <div className="relative group">
                            <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-amber-500" />
                            <input
                                name="evidence_link"
                                type="url"
                                defaultValue={initialData?.evidence_link || ""}
                                placeholder="https://drive.google.com/..."
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                            />
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mt-2 border border-blue-100">
                            <AlertCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">Pastikan pengaturan berbagi di Google Drive adalah &quot;Siapa saja yang memiliki link&quot;.</p>
                        </div>
                    </div>

                    {/* Summary indicator */}
                    {selectedCategory && (
                        <div className={cn(
                            "p-4 rounded-2xl border space-y-2 animate-in fade-in duration-300",
                            isTeaching ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
                        )}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ringkasan</p>
                            <p className="text-xs font-bold text-slate-600">
                                Kategori: <span className="text-slate-900">{selectedCategory.name}</span>
                            </p>
                            {isTeaching && selectedClassIds.length > 0 && (
                                <p className="text-xs font-bold text-slate-600">
                                    Kelas: <span className="text-amber-600">{selectedClassIds.length} kelas dipilih</span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-amber-500 text-white font-black text-lg shadow-xl shadow-amber-100 hover:bg-amber-600 active:scale-[0.97] transition-all disabled:opacity-70 group"
                        >
                            {loading ? (
                                <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={22} className="group-hover:rotate-12 transition-transform" />
                                    <span>{initialData ? 'PERBARUI DATA' : 'SIMPAN DATA'}</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full h-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-900 transition-all"
                        >
                            {initialData ? 'Batal Ubah' : 'Batalkan'}
                        </button>
                    </div>
                </div>

                {/* Quick Tips Box */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 text-white/5 transition-transform group-hover:scale-110 duration-700">
                        <FileText size={120} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                            <CheckCircle2 size={20} />
                        </div>
                        <h4 className="font-black text-lg">{initialData ? 'Update Data' : 'Tips Pengisian'}</h4>
                        <ul className="text-xs font-bold text-white/50 leading-relaxed uppercase tracking-wide space-y-2">
                            <li>• {initialData ? 'Pastikan data terbaru sudah akurat' : 'Pilih kategori terlebih dahulu untuk melihat field yang sesuai'}</li>
                            <li>• KBM: Pastikan kelas, jam, dan materi terisi lengkap</li>
                            <li>• Non-KBM: Isi output/hasil kegiatan</li>
                            <li>• Link bukti memudahkan verifikasi atasan</li>
                        </ul>
                    </div>
                </div>
            </div>
        </form>
    );
}
