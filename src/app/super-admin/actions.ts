'use server'

import { auth } from '@/auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// --- Guard ---
async function requireSuperAdmin() {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true }
    })

    if (profile?.role !== 'super_admin') throw new Error('Forbidden')
    return user
}

// --- Stats ---
export async function getPlatformStats() {
    await requireSuperAdmin()

    const [totalSchools, totalUsers, totalActivities] = await Promise.all([
        prisma.school.count(),
        prisma.profile.count(),
        prisma.activity.count()
    ])

    return {
        totalSchools,
        totalUsers,
        totalActivities
    }
}

// --- Schools ---
export async function getAllSchools() {
    await requireSuperAdmin()

    try {
        const schools = await prisma.school.findMany({
            include: {
                profiles: {
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return schools.map(s => ({
            id: s.id,
            name: s.name,
            address: s.address,
            headmaster_name: s.headmasterName,
            headmaster_nip: s.headmasterNip,
            headmaster_pangkat: s.headmasterPangkat,
            headmaster_jabatan: s.headmasterJabatan,
            logo_url: s.logoUrl,
            invite_code: s.inviteCode || '',
            is_active: s.isActive ?? true,
            created_at: s.createdAt.toISOString(),
            updated_at: s.updatedAt?.toISOString(),
            members: [{ count: s.profiles.length }]
        }))
    } catch (error) {
        console.error('Get Schools Error:', error)
        return []
    }
}

export async function getSchoolDetail(schoolId: string) {
    await requireSuperAdmin()

    const [school, members, activityCount] = await Promise.all([
        prisma.school.findUnique({ where: { id: schoolId } }),
        prisma.profile.findMany({
            where: { schoolId },
            select: { id: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.activity.count({ where: { schoolId } })
    ])

    return {
        school,
        members,
        activityCount
    }
}

export async function toggleSchoolActive(schoolId: string) {
    await requireSuperAdmin()

    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { isActive: true }
    })

    if (!school) throw new Error('School not found')

    await prisma.school.update({
        where: { id: schoolId },
        data: {
            isActive: !school.isActive,
            updatedAt: new Date()
        }
    })

    revalidatePath('/super-admin')
    return { success: true }
}

export async function deleteSchool(schoolId: string) {
    await requireSuperAdmin()

    try {
        await prisma.$transaction(async (tx) => {
            // Delete activity class rooms for activities in this school
            await tx.activityClassRoom.deleteMany({
                where: {
                    activity: { schoolId }
                }
            })

            // Delete activities
            await tx.activity.deleteMany({ where: { schoolId } })

            // Delete master data
            await tx.reportCategory.deleteMany({ where: { schoolId } })
            await tx.classRoom.deleteMany({ where: { schoolId } })
            await tx.implementationBasis.deleteMany({ where: { schoolId } })

            // Unlink profiles
            await tx.profile.updateMany({
                where: { schoolId },
                data: { schoolId: null }
            })

            // Delete the school
            await tx.school.delete({ where: { id: schoolId } })
        })

        revalidatePath('/super-admin')
        return { success: true }
    } catch (error: any) {
        console.error('Delete School Error:', error)
        throw new Error(error.message || 'Gagal menghapus sekolah')
    }
}

export async function updateSchoolSettings(schoolId: string, formData: FormData) {
    await requireSuperAdmin()

    const name = formData.get('name') as string
    const address = formData.get('address') as string

    try {
        await prisma.school.update({
            where: { id: schoolId },
            data: {
                name,
                address,
                updatedAt: new Date()
            }
        })
    } catch (error: any) {
        throw new Error(error.message || 'Gagal menyimpan pengaturan sekolah')
    }

    revalidatePath('/super-admin')
    return redirect('/super-admin?message=' + encodeURIComponent('Sekolah berhasil diperbarui.') + '&type=success')
}
