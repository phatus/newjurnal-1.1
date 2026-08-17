import React from "react";
import { Database, ArrowRight, BookOpen, Layers, Target } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MasterDataPage() {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        return redirect('/login');
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 pb-10">
            <div className="bg-white border-b border-slate-100 px-6 sm:px-10 py-8">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manajemen Data</span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Data Master Pribadi</h1>
                <p className="text-slate-500 mt-2 font-medium">Kelola kategori, daftar kelas, dan dasar pelaksanaan yang Anda gunakan untuk pencatatan harian.</p>
            </div>

            <div className="max-w-[1600px] mx-auto w-full px-6 sm:px-10 mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            name: "Kategori Laporan",
                            desc: "Kelola RHK dan kategori KBM yang sering Anda gunakan.",
                            href: "/master-data/categories",
                            icon: BookOpen,
                            color: "text-amber-600",
                            bg: "bg-amber-50"
                        },
                        {
                            name: "Daftar Kelas",
                            desc: "Atur daftar kelas yang Anda ajar.",
                            href: "/master-data/classes",
                            icon: Layers,
                            color: "text-blue-600",
                            bg: "bg-blue-50"
                        },
                        {
                            name: "Dasar Pelaksanaan",
                            desc: "Kelola jenis SK atau surat tugas sebagai dasar kegiatan.",
                            href: "/master-data/bases",
                            icon: Target,
                            color: "text-indigo-600",
                            bg: "bg-indigo-50"
                        },
                    ].map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-amber-200 hover:-translate-y-1 transition-all group group"
                        >
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${item.bg}`}>
                                <item.icon className={item.color} size={32} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{item.name}</h2>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{item.desc}</p>
                            <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 group-hover:gap-3 transition-all">
                                <span>Kelola Sekarang</span>
                                <ArrowRight size={16} />
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 p-8 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl text-center md:text-left">
                            <h3 className="text-2xl font-black leading-tight mb-2">Punya Pertanyaan tentang Data Master?</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Anda dapat menambahkan data baru yang bersifat pribadi. Data ini hanya akan tampil di akun Anda dan tidak akan memengaruhi data pengguna lain.</p>
                        </div>
                        <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-12 shrink-0">
                            <Database size={32} />
                        </div>
                    </div>
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
