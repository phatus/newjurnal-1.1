'use server'

import { auth } from '@/auth'
import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Helpers to serialize BigInts & Dates
function serializeHoliday(h: any) {
    if (!h) return null;
    return {
        id: Number(h.id),
        holiday_date: h.holidayDate.toISOString().split('T')[0],
        name: h.name,
        description: h.description,
        is_national: h.isNational,
        created_by: h.createdBy
    };
}

function serializeSchedule(s: any) {
    if (!s) return null;
    return {
        ...s,
        categoryId: s.categoryId ? Number(s.categoryId) : null,
        implementationBasisId: s.implementationBasisId ? Number(s.implementationBasisId) : null,
        report_categories: s.category ? {
            name: s.category.name,
            is_teaching: s.category.isTeaching
        } : null,
        schedule_class_rooms: s.classRooms ? s.classRooms.map((c: any) => ({
            class_room_id: Number(c.classRoomId),
            class_rooms: c.classRoom ? {
                name: c.classRoom.name
            } : null
        })) : []
    };
}

export async function getHolidays() {
    try {
        const data = await prisma.holiday.findMany({
            orderBy: { holidayDate: 'asc' }
        });
        return { data: data.map(serializeHoliday), error: null };
    } catch (error: any) {
        console.error('Error fetching holidays:', error);
        return { data: null, error: error.message || 'Gagal mengambil hari libur' };
    }
}

export async function getSchedules(selectedDate?: string) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) return []

    const checkDate = selectedDate || new Date().toISOString().split('T')[0]
    const dateParsed = new Date(checkDate)

    try {
        const data = await prisma.activitySchedule.findMany({
            where: { userId: user.id },
            include: {
                category: true,
                classRooms: {
                    include: {
                        classRoom: true
                    }
                }
            },
            orderBy: { dayOfWeek: 'asc' }
        })

        // Check which ones are already confirmed for the checkDate
        const dateActivities = await prisma.activity.findMany({
            where: {
                userId: user.id,
                activityDate: dateParsed,
                scheduleId: { not: null }
            },
            select: { scheduleId: true }
        })

        const confirmedIds = new Set(dateActivities.map(a => a.scheduleId).filter(Boolean) as string[])

        return data.map(s => {
            const serialized = serializeSchedule(s)
            return {
                ...serialized,
                is_confirmed_today: confirmedIds.has(s.id)
            }
        })
    } catch (e) {
        console.error('getSchedules Error:', e)
        return []
    }
}

export async function saveSchedule(formData: FormData) {
    try {
        const session = await auth()
        const user = session?.user

        if (!user || !user.id) return { success: false, error: 'Unauthorized' }

        const days_of_week = (formData.get('days_of_week') as string || '').split(',').filter(id => id).map(id => parseInt(id, 10))
        const category_id = parseInt(formData.get('category_id') as string, 10)
        const topic = formData.get('topic') as string
        const implementation_basis_id = parseInt(formData.get('implementation_basis_id') as string, 10) || null
        const description = formData.get('description') as string || null
        const teaching_hours = formData.get('teaching_hours') as string || null
        const class_room_ids = (formData.get('class_room_ids') as string || '').split(',').filter(id => id).map(id => parseInt(id, 10))

        if (days_of_week.length === 0) return { success: false, error: 'Harap pilih minimal satu hari' }

        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { schoolId: true }
        })

        const catIdVal = BigInt(category_id)
        const basisIdVal = implementation_basis_id ? BigInt(implementation_basis_id) : null

        for (const day_of_week of days_of_week) {
            const schedule = await prisma.activitySchedule.create({
                data: {
                    userId: user.id,
                    schoolId: profile?.schoolId,
                    categoryId: catIdVal,
                    implementationBasisId: basisIdVal,
                    dayOfWeek: day_of_week,
                    topic,
                    description,
                    teachingHours: teaching_hours ? parseInt(teaching_hours, 10) : null,
                    isActive: true
                }
            })

            if (class_room_ids.length > 0 && schedule) {
                const pivotData = class_room_ids.map(class_id => ({
                    scheduleId: schedule.id,
                    classRoomId: BigInt(class_id)
                }))

                await prisma.scheduleClassRoom.createMany({
                    data: pivotData
                })
            }
        }

        revalidatePath('/activities/schedule')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('SERVER ACTION: saveSchedule Error', e)
        return { success: false, error: e.message || 'Terjadi kesalahan sistem' }
    }
}

export async function deleteSchedule(id: string) {
    try {
        const session = await auth()
        const user = session?.user
        if (!user || !user.id) return { success: false, error: 'Unauthorized' }

        // Find topic and category to delete all siblings
        const current = await prisma.activitySchedule.findFirst({
            where: { id }
        })
        
        if (current) {
            await prisma.activitySchedule.deleteMany({
                where: {
                    userId: user.id,
                    topic: current.topic,
                    categoryId: current.categoryId
                }
            })
        } else {
            // Fallback to just deleting the ID
            await prisma.activitySchedule.delete({
                where: { id }
            })
        }

        revalidatePath('/activities/schedule')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('SERVER ACTION: deleteSchedule Error', e)
        return { success: false, error: e.message || 'Gagal menghapus jadwal' }
    }
}

export async function updateSchedule(id: string, formData: FormData) {
    try {
        const session = await auth()
        const user = session?.user

        if (!user || !user.id) return { success: false, error: 'Unauthorized' }

        // 1. Get current record to find siblings (topic match)
        const current = await prisma.activitySchedule.findFirst({
            where: { id }
        })
        if (!current) return { success: false, error: 'Jadwal tidak ditemukan' }

        const new_days_of_week = (formData.get('days_of_week') as string || '').split(',').filter(id => id).map(id => parseInt(id, 10))
        const category_id = parseInt(formData.get('category_id') as string, 10)
        const topic = formData.get('topic') as string
        const implementation_basis_id = parseInt(formData.get('implementation_basis_id') as string, 10) || null
        const description = formData.get('description') as string || null
        const teaching_hours = formData.get('teaching_hours') as string || null
        const class_room_ids = (formData.get('class_room_ids') as string || '').split(',').filter(id => id).map(id => parseInt(id, 10))

        if (new_days_of_week.length === 0) return { success: false, error: 'Harap pilih minimal satu hari' }

        // 2. Delete ALL records with current topic and category for this user 
        // This effectively "syncs" the group
        await prisma.activitySchedule.deleteMany({
            where: {
                userId: user.id,
                topic: current.topic,
                categoryId: current.categoryId
            }
        })

        // 3. Create NEW records for all selected days
        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { schoolId: true }
        })

        const catIdVal = BigInt(category_id)
        const basisIdVal = implementation_basis_id ? BigInt(implementation_basis_id) : null

        for (const day of new_days_of_week) {
            const schedule = await prisma.activitySchedule.create({
                data: {
                    userId: user.id,
                    schoolId: profile?.schoolId,
                    categoryId: catIdVal,
                    implementationBasisId: basisIdVal,
                    dayOfWeek: day,
                    topic,
                    description,
                    teachingHours: teaching_hours ? parseInt(teaching_hours, 10) : null,
                    isActive: true
                }
            })

            if (class_room_ids.length > 0 && schedule) {
                const pivotData = class_room_ids.map(class_id => ({
                    scheduleId: schedule.id,
                    classRoomId: BigInt(class_id)
                }))
                await prisma.scheduleClassRoom.createMany({
                    data: pivotData
                })
            }
        }

        revalidatePath('/activities/schedule')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error('SERVER ACTION: updateSchedule Error:', e)
        return { success: false, error: e.message || 'Gagal memperbarui jadwal' };
    }
}

export async function convertScheduleToActivity(
    scheduleId: string,
    date: string,
    learningMaterial?: string,
    learningOutcome?: string
) {
    const session = await auth()
    const user = session?.user
    if (!user || !user.id) throw new Error('Unauthorized')

    const dateParsed = new Date(date)

    const existing = await prisma.activity.findFirst({
        where: {
            userId: user.id,
            scheduleId: scheduleId,
            activityDate: dateParsed
        },
        select: { id: true }
    })

    if (existing) {
        return { success: false, error: 'Kegiatan untuk jadwal ini sudah dibuat hari ini.' }
    }

    const schedule = await prisma.activitySchedule.findFirst({
        where: { id: scheduleId },
        include: {
            classRooms: true
        }
    })

    if (!schedule) throw new Error('Schedule not found')

    const activity = await prisma.activity.create({
        data: {
            userId: user.id,
            schoolId: schedule.schoolId,
            categoryId: schedule.categoryId!,
            implementationBasisId: schedule.implementationBasisId,
            scheduleId: schedule.id,
            activityDate: dateParsed,
            description: schedule.description || 'Kegiatan Rutin Terjadwal',
            topic: schedule.topic || 'Kegiatan Rutin',
            learningMaterial: learningMaterial || null,
            teachingHours: schedule.teachingHours ? String(schedule.teachingHours) : '0',
            studentCount: 32,
            learningOutcome: learningOutcome || null,
            status: 'Selesai'
        }
    })

    if (schedule.classRooms && schedule.classRooms.length > 0) {
        const pivotData = schedule.classRooms.map(p => ({
            activityId: activity.id,
            classRoomId: p.classRoomId
        }))
        await prisma.activityClassRoom.createMany({
            data: pivotData
        })
    }

    revalidatePath('/')
    revalidatePath('/activities')
    return { success: true }
}
