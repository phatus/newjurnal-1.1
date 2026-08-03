'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function seedInitialData(_formData: FormData) {
    try {
        // 1. Seed Categories
        const categories = [
            { name: 'Kegiatan Belajar Mengajar (KBM)', rhkLabel: 'Proses Pembelajaran', isTeaching: true },
            { name: 'Administrasi Kurikulum', rhkLabel: 'Administrasi Sekolah', isTeaching: false },
            { name: 'Pengembangan Diri (Pelatihan)', rhkLabel: 'Kompetensi Guru', isTeaching: false },
            { name: 'Tugas Tambahan (Wali Kelas)', rhkLabel: 'Tugas Tambahan', isTeaching: false },
            { name: 'Kegiatan Ekstrakurikuler', rhkLabel: 'Kesiswaan', isTeaching: false },
        ]

        for (const cat of categories) {
            const exists = await prisma.reportCategory.findFirst({
                where: {
                    name: cat.name,
                    schoolId: null,
                    userId: null
                }
            })
            if (!exists) {
                await prisma.reportCategory.create({
                    data: {
                        name: cat.name,
                        rhkLabel: cat.rhkLabel,
                        isTeaching: cat.isTeaching,
                        schoolId: null,
                        userId: null
                    }
                })
            }
        }

        // 2. Seed Class Rooms
        const classes = [
            { name: 'X RPL 1' }, { name: 'X RPL 2' },
            { name: 'XI RPL 1' }, { name: 'XI RPL 2' },
            { name: 'XII RPL 1' }, { name: 'XII RPL 2' },
        ]

        for (const cls of classes) {
            const exists = await prisma.classRoom.findFirst({
                where: {
                    name: cls.name,
                    schoolId: null,
                    userId: null
                }
            })
            if (!exists) {
                await prisma.classRoom.create({
                    data: {
                        name: cls.name,
                        schoolId: null,
                        userId: null
                    }
                })
            }
        }

        // 3. Seed Implementation Bases
        const bases = [
            { name: 'SK Pembagian Tugas Mengajar' },
            { name: 'Surat Tugas Kepala Sekolah' },
            { name: 'Program Kerja Sekolah' },
        ]

        for (const base of bases) {
            const exists = await prisma.implementationBasis.findFirst({
                where: {
                    name: base.name,
                    schoolId: null,
                    userId: null
                }
            })
            if (!exists) {
                await prisma.implementationBasis.create({
                    data: {
                        name: base.name,
                        schoolId: null,
                        userId: null
                    }
                })
            }
        }

        revalidatePath('/activities/create')
        return { success: true }
    } catch (error) {
        console.error('Seed Error:', error)
        return { success: false, error: 'Gagal melakukan seeding data.' }
    }
}
