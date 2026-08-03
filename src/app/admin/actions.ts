'use server'

import { auth } from '@/auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

// Helper to serialize BigInts
function serializeCategory(cat: any) {
    if (!cat) return null;
    return {
        ...cat,
        id: Number(cat.id)
    };
}

function serializeClassRoom(cls: any) {
    if (!cls) return null;
    return {
        ...cls,
        id: Number(cls.id)
    };
}

function serializeBase(base: any) {
    if (!base) return null;
    return {
        ...base,
        id: Number(base.id)
    };
}

// --- Categories ---
export async function createCategory(formData: FormData) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })

    const name = formData.get('name') as string
    const rhk_label = formData.get('rhk_label') as string
    const is_teaching = formData.get('is_teaching') === 'true'

    await prisma.reportCategory.create({
        data: {
            name,
            rhkLabel: rhk_label,
            isTeaching: is_teaching,
            schoolId: profile?.schoolId || null
        }
    })

    revalidatePath('/admin/categories')
    return { success: true }
}

export async function deleteCategory(id: number) {
    await prisma.reportCategory.delete({
        where: { id: BigInt(id) }
    })

    revalidatePath('/admin/categories')
    return { success: true }
}

export async function updateCategory(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const rhk_label = formData.get('rhk_label') as string
    const is_teaching = formData.get('is_teaching') === 'true'

    await prisma.reportCategory.update({
        where: { id: BigInt(id) },
        data: {
            name,
            rhkLabel: rhk_label,
            isTeaching: is_teaching
        }
    })

    revalidatePath('/admin/categories')
    return { success: true }
}

// --- Classes ---
export async function createClass(formData: FormData) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })

    const name = formData.get('name') as string

    await prisma.classRoom.create({
        data: {
            name,
            schoolId: profile?.schoolId || null
        }
    })

    revalidatePath('/admin/classes')
    return { success: true }
}

export async function deleteClass(id: number) {
    await prisma.classRoom.delete({
        where: { id: BigInt(id) }
    })

    revalidatePath('/admin/classes')
    return { success: true }
}

// --- Implementation Bases ---
export async function createBase(formData: FormData) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })

    const name = formData.get('name') as string

    await prisma.implementationBasis.create({
        data: {
            name,
            schoolId: profile?.schoolId || null
        }
    })

    revalidatePath('/admin/bases')
    return { success: true }
}

export async function deleteBase(id: number) {
    await prisma.implementationBasis.delete({
        where: { id: BigInt(id) }
    })

    revalidatePath('/admin/bases')
    return { success: true }
}

// --- Users ---
export async function getUsers() {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true, role: true }
    })

    let query: any = {}

    // super_admin sees all, admin sees only their school
    if (profile?.role !== 'super_admin' && profile?.schoolId) {
        query.schoolId = profile.schoolId
    }

    const data = await prisma.profile.findMany({
        where: query,
        orderBy: { createdAt: 'desc' }
    })

    return data
}

export async function updateUserRole(id: string, role: string) {
    await prisma.profile.update({
        where: { id },
        data: { role }
    })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(id: string) {
    try {
        // Cascade delete on public.users will automatically clean up public.profiles,
        // public.activities, and pivot tables.
        await prisma.user.delete({
            where: { id }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Delete User Error:', error)
        throw new Error(error.message || 'Gagal menghapus pengguna')
    }
}

export async function updateUserPassword(id: string, password: string) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        })

        return { success: true }
    } catch (error: any) {
        console.error('Update Password Error:', error)
        throw new Error(error.message || 'Gagal memperbarui password')
    }
}
