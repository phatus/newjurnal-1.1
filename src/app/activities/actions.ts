'use server'

import { auth } from '@/auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ActivitySchema } from '@/lib/schemas'
import { calculateMonthlyCounts } from '@/utils/date-utils'

// Helpers to serialize BigInts
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

function serializeActivity(act: any) {
    if (!act) return null;
    const rawDate = act.activityDate || act.activity_date;
    let formattedDate = '';
    if (rawDate) {
        if (rawDate instanceof Date) {
            formattedDate = rawDate.toISOString().split('T')[0];
        } else {
            formattedDate = String(rawDate).split('T')[0];
        }
    }
    return {
        ...act,
        id: Number(act.id),
        activity_date: formattedDate,
        categoryId: Number(act.categoryId),
        implementationBasisId: act.implementationBasisId ? Number(act.implementationBasisId) : null,
        category: act.category ? {
            name: act.category.name,
            is_teaching: act.category.isTeaching,
            ...act.category,
            id: Number(act.category.id)
        } : null,
        basis: act.implementationBasis ? {
            name: act.implementationBasis.name,
            ...act.implementationBasis,
            id: Number(act.implementationBasis.id)
        } : (act.basis ? {
            name: act.basis.name,
            ...act.basis,
            id: Number(act.basis.id)
        } : null),
        classes: act.classRooms ? act.classRooms.map((c: any) => ({
            class_room_id: Number(c.classRoomId),
            class: c.classRoom ? {
                id: Number(c.classRoom.id),
                name: c.classRoom.name
            } : null
        })) : []
    };
}

export async function createActivity(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    // Validate input using Zod
    const rawData = Object.fromEntries(formData.entries())
    const validation = ActivitySchema.safeParse(rawData)

    if (!validation.success) {
        const errorMsg = validation.error.issues[0].message
        throw new Error(errorMsg)
    }

    const validatedData = validation.data
    const { category_id, activity_date, description, evidence_link, implementation_basis_id, teaching_hours, topic, learning_material, learning_outcome, student_outcome, class_room_ids } = validatedData

    // Get user's school_id
    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    });

    const categoryIdVal = BigInt(category_id)
    const basisIdVal = implementation_basis_id ? BigInt(implementation_basis_id) : null

    // Create Activity
    const activity = await prisma.activity.create({
        data: {
            userId: user.id,
            schoolId: profile?.schoolId,
            categoryId: categoryIdVal,
            implementationBasisId: basisIdVal,
            activityDate: new Date(activity_date),
            description,
            evidenceLink: evidence_link,
            teachingHours: teaching_hours,
            topic,
            learningMaterial: learning_material,
            learningOutcome: learning_outcome,
            studentOutcome: student_outcome,
            status: 'Selesai'
        }
    })

    // Handle Class Rooms pivot if it's a teaching activity
    if (class_room_ids && activity) {
        const ids = class_room_ids.split(',').map(id => id.trim()).filter(id => id !== "")
        if (ids.length > 0) {
            const pivotData = ids.map(class_id => ({
                activityId: activity.id,
                classRoomId: BigInt(class_id)
            }))

            await prisma.activityClassRoom.createMany({
                data: pivotData
            })
        }
    }

    revalidatePath('/')
    revalidatePath('/reports')
    return redirect('/')
}

export async function getCategories() {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        const data = await prisma.reportCategory.findMany({
            where: {
                userId: null,
                schoolId: null
            },
            orderBy: { name: 'asc' }
        })
        return data.map(serializeCategory)
    }

    // Get user's school_id
    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })
    const schoolId = profile?.schoolId

    let whereClause: any = {
        OR: [
            { userId: null, schoolId: null }
        ]
    }

    if (schoolId) {
        whereClause.OR.push({ schoolId, userId: null })
        whereClause.OR.push({ schoolId, userId: user.id })
    }
    
    whereClause.OR.push({ userId: user.id })

    try {
        const data = await prisma.reportCategory.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        })
        return data.map(serializeCategory) || []
    } catch (e) {
        console.error('getCategories Unexpected Error:', e)
        return []
    }
}

export async function getClassRooms() {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        const data = await prisma.classRoom.findMany({
            where: {
                userId: null,
                schoolId: null
            },
            orderBy: { name: 'asc' }
        })
        return data.map(serializeClassRoom)
    }

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })
    const schoolId = profile?.schoolId

    let whereClause: any = {
        OR: [
            { userId: null, schoolId: null }
        ]
    }

    if (schoolId) {
        whereClause.OR.push({ schoolId, userId: null })
        whereClause.OR.push({ schoolId, userId: user.id })
    }

    whereClause.OR.push({ userId: user.id })

    try {
        const data = await prisma.classRoom.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        })
        return data.map(serializeClassRoom) || []
    } catch (e) {
        console.error('getClassRooms Unexpected Error:', e)
        return []
    }
}

export async function getImplementationBases() {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        const data = await prisma.implementationBasis.findMany({
            where: {
                userId: null,
                schoolId: null
            },
            orderBy: { name: 'asc' }
        })
        return data.map(serializeBase)
    }

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })
    const schoolId = profile?.schoolId

    let whereClause: any = {
        OR: [
            { userId: null, schoolId: null }
        ]
    }

    if (schoolId) {
        whereClause.OR.push({ schoolId, userId: null })
        whereClause.OR.push({ schoolId, userId: user.id })
    }

    whereClause.OR.push({ userId: user.id })

    try {
        const data = await prisma.implementationBasis.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        })
        return data.map(serializeBase) || []
    } catch (e) {
        console.error('getImplementationBases Unexpected Error:', e)
        return []
    }
}

export async function getRecentActivities() {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) return []

    const data = await prisma.activity.findMany({
        where: { userId: user.id },
        include: {
            category: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    return data.map(serializeActivity)
}

export async function getMonthlyStats() {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) return { counts: Array(12).fill(0), raw: [] }

    const data = await prisma.activity.findMany({
        where: { userId: user.id },
        select: { activityDate: true }
    })

    const raw = data.map(d => ({
        activity_date: d.activityDate.toISOString().split('T')[0]
    }))
    const counts = calculateMonthlyCounts(raw)

    return { counts, raw }
}

export async function getDashboardStats() {
    try {
        const session = await auth()
        const user = session?.user
        if (!user || !user.id) {
            return {
                totalActivities: 0,
                teachingActivities: 0,
                dailyAverage: 0,
                performancePoints: 0
            }
        }

        const totalActivities = await prisma.activity.count({
            where: { userId: user.id }
        })

        const teachingCount = await prisma.activity.count({
            where: {
                userId: user.id,
                category: {
                    isTeaching: true
                }
            }
        })

        return {
            totalActivities,
            teachingActivities: teachingCount,
            dailyAverage: totalActivities / 30,
            performancePoints: totalActivities * 10
        }
    } catch (error) {
        console.error('getDashboardStats Error:', error)
        return {
            totalActivities: 0,
            teachingActivities: 0,
            dailyAverage: 0,
            performancePoints: 0
        }
    }
}

export async function seedInitialData(_formData: FormData) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    })
    const schoolId = profile?.schoolId

    const TEMPLATE_SCHOOL_ID = 'e62b1c6b-f2d7-4591-97be-492f794df156'

    try {
        // 1. Seed Categories from Template
        const templateCats = await prisma.reportCategory.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (templateCats) {
            for (const cat of templateCats) {
                const check = await prisma.reportCategory.findFirst({
                    where: {
                        name: cat.name,
                        schoolId: schoolId || null
                    }
                })
                if (!check) {
                    await prisma.reportCategory.create({
                        data: {
                            name: cat.name,
                            rhkLabel: cat.rhkLabel,
                            isTeaching: cat.isTeaching,
                            schoolId: schoolId || null,
                            userId: user.id
                        }
                    })
                }
            }
        }

        // 2. Seed Class Rooms from Template
        const templateClasses = await prisma.classRoom.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (templateClasses) {
            for (const cls of templateClasses) {
                const check = await prisma.classRoom.findFirst({
                    where: {
                        name: cls.name,
                        schoolId: schoolId || null
                    }
                })
                if (!check) {
                    await prisma.classRoom.create({
                        data: {
                            name: cls.name,
                            schoolId: schoolId || null,
                            userId: user.id
                        }
                    })
                }
            }
        }

        // 3. Seed Implementation Bases from Template
        const templateBases = await prisma.implementationBasis.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (templateBases) {
            for (const base of templateBases) {
                const check = await prisma.implementationBasis.findFirst({
                    where: {
                        name: base.name,
                        schoolId: schoolId || null
                    }
                })
                if (!check) {
                    await prisma.implementationBasis.create({
                        data: {
                            name: base.name,
                            schoolId: schoolId || null,
                            userId: user.id
                        }
                    })
                }
            }
        }

        revalidatePath('/activities/create')
    } catch (error) {
        console.error('Seed Error:', error)
        return redirect('/activities/create?message=' + encodeURIComponent('Gagal melakukan seeding data.') + '&type=error')
    }

    return redirect('/activities/create?message=' + encodeURIComponent('Data dasar berhasil diinisialisasi!') + '&type=success')
}

export async function updateSettings(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true, schoolId: true }
    })
    if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) throw new Error('Forbidden')
    if (!profile.schoolId) throw new Error('No school configured')

    const school_name = formData.get('school_name') as string
    const school_address = formData.get('school_address') as string
    const headmaster_name = formData.get('headmaster_name') as string
    const headmaster_nip = formData.get('headmaster_nip') as string
    const headmaster_pangkat = formData.get('headmaster_pangkat') as string
    const headmaster_jabatan = formData.get('headmaster_jabatan') as string

    try {
        await prisma.school.update({
            where: { id: profile.schoolId },
            data: {
                name: school_name,
                address: school_address,
                headmasterName: headmaster_name,
                headmasterNip: headmaster_nip,
                headmasterPangkat: headmaster_pangkat,
                headmasterJabatan: headmaster_jabatan,
                updatedAt: new Date()
            }
        })
    } catch (error: any) {
        console.error('Settings Update Error:', error)
        throw new Error(error.message || 'Gagal menyimpan pengaturan')
    }

    revalidatePath('/settings')
    return redirect('/settings?message=' + encodeURIComponent('Pengaturan sekolah berhasil disimpan!') + '&type=success')
}

export async function getActivities(month?: number, year?: number) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) return []

    try {
        let whereClause: any = { userId: user.id }

        if (month && year) {
            const startDate = new Date(year, month - 1, 1)
            const endDate = new Date(year, month, 0, 23, 59, 59, 999)
            whereClause.activityDate = {
                gte: startDate,
                lte: endDate
            }
        }

        const data = await prisma.activity.findMany({
            where: whereClause,
            include: {
                category: true,
                implementationBasis: true,
                classRooms: {
                    include: {
                        classRoom: true
                    }
                }
            },
            orderBy: { activityDate: 'desc' }
        })

        return data.map(serializeActivity)
    } catch (error) {
        console.error('getActivities Exception:', error)
        return []
    }
}

export async function getActivityById(id: string) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const data = await prisma.activity.findFirst({
        where: {
            id: BigInt(id),
            userId: user.id
        },
        include: {
            category: true,
            implementationBasis: true,
            classRooms: true
        }
    })

    if (!data) return null
    return serializeActivity(data)
}

export async function updateActivity(id: string, formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    // Validate input using Zod
    const rawData = Object.fromEntries(formData.entries())
    const validation = ActivitySchema.safeParse(rawData)

    if (!validation.success) {
        const errorMsg = validation.error.issues[0].message
        throw new Error(errorMsg)
    }

    const validatedData = validation.data
    const { category_id, activity_date, description, evidence_link, implementation_basis_id, student_count, teaching_hours, topic, learning_material, learning_outcome, student_outcome, class_room_ids } = validatedData

    try {
        // Update Activity
        const activityIdVal = BigInt(id)
        await prisma.activity.update({
            where: {
                id: activityIdVal,
                userId: user.id
            },
            data: {
                categoryId: BigInt(category_id),
                implementationBasisId: implementation_basis_id ? BigInt(implementation_basis_id) : null,
                activityDate: new Date(activity_date),
                description,
                evidenceLink: evidence_link,
                teachingHours: teaching_hours,
                topic,
                learningMaterial: learning_material,
                learningOutcome: learning_outcome,
                studentOutcome: student_outcome,
                studentCount: student_count ? parseInt(student_count as any, 10) : null,
                updatedAt: new Date()
            }
        })

        // Update Class Rooms Pivot
        // 1. Delete existing pivots
        await prisma.activityClassRoom.deleteMany({
            where: { activityId: activityIdVal }
        })

        // 2. Insert new pivots if any
        if (class_room_ids) {
            const ids = class_room_ids.split(',').map(cid => cid.trim()).filter(cid => cid !== "")
            if (ids.length > 0) {
                const pivotData = ids.map(class_id => ({
                    activityId: activityIdVal,
                    classRoomId: BigInt(class_id)
                }))
                await prisma.activityClassRoom.createMany({
                    data: pivotData
                })
            }
        }
    } catch (err: any) {
        console.error('Update Activity Error:', err)
        return { success: false, error: err.message || 'Gagal memperbarui aktivitas' }
    }

    revalidatePath('/activities')
    revalidatePath('/')
    return redirect('/activities?message=' + encodeURIComponent('Data berhasil diperbarui!') + '&type=success')
}

export async function deleteActivity(id: string) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    try {
        await prisma.activity.delete({
            where: {
                id: BigInt(id),
                userId: user.id
            }
        })
    } catch (err: any) {
        throw new Error(err.message || 'Gagal menghapus aktivitas')
    }

    revalidatePath('/activities')
    revalidatePath('/')
    return { success: true }
}
