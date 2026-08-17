"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit2, Info, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "../actions";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import type { Category } from "@/types";

interface CategoriesClientProps {
    allCategories: Category[];
    userOnlyCategories: Category[];
}

export default function CategoriesClient({ allCategories, userOnlyCategories }: CategoriesClientProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
                toast.success('Kategori berhasil diperbarui');
            } else {
                await createCategory(formData);
                toast.success('Kategori berhasil ditambahkan');
            }
            setIsAdding(false);
            setEditingCategory(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error saving category:", error);
            toast.error(errorMessage || "Gagal menyimpan kategori.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus kategori ini?")) return;
        setIsLoading(true);
        try {
            await deleteCategory(id);
            toast.success('Kategori berhasil dihapus');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("Error deleting category:", error);
            toast.error(errorMessage || "Gagal menghapus kategori.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                    <Info size={18} />
                    <p className="text-xs font-bold uppercase tracking-wider">Kelola Kategori Pribadi</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span>Tambah Kategori</span>
                </button>
            </div>

            {/* List of Categories */}
            <div className="grid grid-cols-1 gap-4">
                {allCategories.map((cat) => {
                    const isUserOwned = userOnlyCategories.some(u => u.id === cat.id);
                    return (
                        <div
                            key={cat.id}
                            className={cn(
                                "group flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all",
                                isUserOwned && "border-amber-100 bg-amber-50/10"
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center",
                                    cat.is_teaching ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                                )}>
                                    {cat.is_teaching ? <Layers size={24} /> : <BookOpen size={24} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-900 uppercase tracking-tight">{cat.name}</p>
                                        {isUserOwned && (
                                            <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">Pribadi</span>
                                        )}
                                        {!isUserOwned && (
                                            <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase">Sistem</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5 tracking-wide">RHK: {cat.rhk_label || (cat as any).rhkLabel || cat.name}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingCategory(cat)}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                    title="Edit Kategori & RHK"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                    title="Hapus Kategori"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Form */}
            {(isAdding || editingCategory) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {editingCategory ? "Ubah Kategori" : "Tambah Kategori Baru"}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">Detail Kategori Laporan</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                                <input
                                    name="name"
                                    required
                                    defaultValue={editingCategory?.name}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    placeholder="Contoh: Pembelajaran di Kelas"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Label RHK</label>
                                <input
                                    name="rhk_label"
                                    required
                                    defaultValue={editingCategory?.rhk_label}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    placeholder="Contoh: Terlaksananya Pembelajaran"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                <input
                                    type="checkbox"
                                    name="is_teaching"
                                    id="is_teaching"
                                    value="true"
                                    defaultChecked={Boolean(editingCategory ? (editingCategory.is_teaching ?? (editingCategory as any).isTeaching) : false)}
                                    className="h-5 w-5 rounded-lg border-blue-200 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_teaching" className="flex-1 text-sm font-bold text-blue-900">
                                    Ini adalah kategori Pembelajaran (KBM)
                                    <span className="block text-[10px] text-blue-500/70 font-medium">Jika dicentang, sistem akan meminta input Kelas saat mencatat kegiatan.</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setEditingCategory(null); }}
                                    className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] h-14 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? "Menyimpan..." : (editingCategory ? "Perbarui Kategori" : "Simpan Kategori")}
                                    {!isLoading && <CheckCircle2 size={16} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
