'use client';

import React, { useState, useTransition } from "react";
import { Trash2, Calendar as CalendarIcon, Plus, Pencil } from "lucide-react";
import { toast } from 'sonner';
import type { Holiday } from "@/types";
import { createHoliday, deleteHoliday, getHolidays, updateHoliday } from "./actions";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const fetchHolidays = async () => {
    const result = await getHolidays();
    if (result.data) {
      setHolidays(result.data as Holiday[]);
    }
  };

  React.useEffect(() => {
    fetchHolidays();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        let result;
        if (editingHoliday) {
          formData.append('id', editingHoliday.id.toString());
          result = await updateHoliday(formData);
        } else {
          result = await createHoliday(formData);
        }

        if (result?.success) {
          toast.success(editingHoliday ? 'Hari libur berhasil diperbarui' : 'Hari libur berhasil ditambahkan');
          setShowForm(false);
          setEditingHoliday(null);
          fetchHolidays();
        } else {
          toast.error(result?.error || 'Terjadi kesalahan');
        }
      } catch {
        toast.error('Terjadi kesalahan sistem');
      }
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus hari libur "${name}"?`)) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id.toString());

      const result = await deleteHoliday(formData);
      if (result?.success) {
        toast.success('Hari libur berhasil dihapus');
        fetchHolidays();
      } else {
        toast.error(result?.error || 'Gagal menghapus');
      }
    });
  };

  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const sortedHolidays = [...holidays].sort((a, b) =>
    new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Hari Libur</h1>
          <p className="text-slate-500 mt-1"> Kelola hari libur dan cuti di kalender</p>
        </div>
        <button
          onClick={() => {
            setEditingHoliday(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold transition-all"
        >
          {showForm ? <Pencil size={20} /> : <Plus size={20} />}
          {showForm ? 'Batal' : 'Tambah Hari Libur'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {editingHoliday ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}
          </h2>
          <form action={handleSubmit} className="space-y-6">
            {editingHoliday && (
              <input type="hidden" name="id" value={editingHoliday.id} />
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
                Nama Hari Libur *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={editingHoliday?.name || ''}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                placeholder="Contoh: Hari+Idu+Al-Fitr"
              />
            </div>

            <div>
              <label htmlFor="holiday_date" className="block text-sm font-bold text-slate-700 mb-2">
                Tanggal *
              </label>
              <input
                type="date"
                id="holiday_date"
                name="holiday_date"
                required
                defaultValue={editingHoliday?.holiday_date || ''}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editingHoliday?.description || ''}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                placeholder="Deskripsi tambahan (opsional)"
              />
            </div>

            <div>
              <label htmlFor="is_national" className="block text-sm font-bold text-slate-700 mb-2">
                Tipe Hari Libur
              </label>
              <select
                id="is_national"
                name="is_national"
                defaultValue={editingHoliday?.is_national !== undefined ? String(editingHoliday.is_national) : 'true'}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
              >
                <option value="true">Nasional</option>
                <option value="false">Lokal/Sekolah</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingHoliday(null);
                }}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden">
        {sortedHolidays.length === 0 ? (
          <div className="p-20 text-center">
            <CalendarIcon size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-wider">Belum ada hari libur</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedHolidays.map((holiday) => (
              <div key={holiday.id} className="p-6 hover:bg-amber-50/50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                      <CalendarIcon size={28} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{holiday.name}</h3>
                      <p className="text-slate-500 mt-1">
                        {new Date(holiday.holiday_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {holiday.description && (
                        <p className="text-slate-400 text-sm mt-2">{holiday.description}</p>
                      )}
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                        holiday.is_national
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {holiday.is_national ? 'Nasional' : 'Lokal'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id, holiday.name)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
