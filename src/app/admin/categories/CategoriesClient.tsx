"use client";

import React, { useState } from "react";
import { ChevronLeft, Plus, Trash2, Tag, Loader2, X, Edit } from "lucide-react";
import Link from "next/link";
import { createCategory, deleteCategory, updateCategory } from "@/app/admin/actions";
import { toast } from 'sonner';
import type { Category } from "@/types";

export default function AdminCategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await createCategory(formData);
            toast.success('Kategori berhasil ditambahkan');
            window.location.reload(); // Simple way to refresh data
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Terjadi kesalahan');
        }
    }

    async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await updateCategory(editingCategory!.id, formData);
            toast.success('Kategori berhasil diperbarui');
            window.location.reload(); // Simple way to refresh data
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Terjadi kesalahan');
        }
    }

    function startEdit(category: Category) {
        setEditingCategory(category);
        setIsEditing(true);
        setIsAdding(false); // Close add form if open
    }

    function cancelEdit() {
        setIsEditing(false);
        setEditingCategory(null);
        setIsAdding(false);
    }

    async function handleDelete(id: number) {
        if (!confirm("Hapus kategori ini?")) return;
        setLoadingId(id);
        try {
            await deleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Kategori berhasil dihapus');
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error.message || 'Terjadi kesalahan');
        } finally {
            setLoadingId(null);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        href="/admin"
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">Master Data</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kategori Laporan</h1>
                        <p className="text-slate-500 mt-1 font-medium">Kelola RHK dan kategori aktivitas guru.</p>
                    </div>
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setIsEditing(false);
                            setEditingCategory(null);
                        }}
                        disabled={isEditing}
                        className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={20} />
                        Tambah Kategori
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 mt-10">
                {isAdding && (
                    <div className="mb-10 bg-white rounded-[2.5rem] p-8 border-2 border-amber-500 shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tambah Kategori Baru</h2>
                            <button onClick={() => setIsAdding(false)} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                                <input name="name" required className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-amber-500" placeholder="Contoh: Pembelajaran" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label RHK</label>
                                <input name="rhk_label" required className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-amber-500" placeholder="Contoh: Terlaksananya pembelajaran..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Layanan</label>
                                <select name="is_teaching" className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-amber-500">
                                    <option value="true">Jurnal Mengajar (KBM)</option>
                                    <option value="false">Kegiatan Biasa/Penunjang</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" className="h-14 px-10 rounded-2xl bg-amber-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-600">Simpan Kategori</button>
                            </div>
                        </form>
                    </div>
                )}

                {isEditing && editingCategory && (
                    <div className="mb-10 bg-white rounded-[2.5rem] p-8 border-2 border-blue-500 shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Kategori</h2>
                            <button onClick={cancelEdit} className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                                <input
                                    name="name"
                                    required
                                    defaultValue={editingCategory?.name || ""}
                                    className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Pembelajaran"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label RHK</label>
                                <input
                                    name="rhk_label"
                                    required
                                    defaultValue={editingCategory?.rhk_label || (editingCategory as any)?.rhkLabel || ""}
                                    className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Terlaksananya pembelajaran..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Layanan</label>
                                <select
                                    name="is_teaching"
                                    defaultValue={String(editingCategory?.is_teaching ?? (editingCategory as any)?.isTeaching ?? false)}
                                    className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="true">Jurnal Mengajar (KBM)</option>
                                    <option value="false">Kegiatan Biasa/Penunjang</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button type="submit" className="h-14 px-10 rounded-2xl bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-600">
                                    Update Kategori
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nama Kategori</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Label RHK</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status KBM</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Tag size={18} />
                                            </div>
                                            <span className="font-bold text-slate-900">{cat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-bold text-slate-500">{cat.rhk_label || (cat as any).rhkLabel || cat.name}</td>
                                    <td className="px-8 py-5">
                                        {cat.is_teaching ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest border border-green-100">Aktif</span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100">Biasa</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 outline-none">
                                            <button
                                                onClick={() => startEdit(cat)}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                                                title="Edit kategori"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                disabled={loadingId === cat.id}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="Hapus kategori"
                                            >
                                                {loadingId === cat.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
