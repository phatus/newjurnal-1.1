'use server';

import { auth } from "@/auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper to serialize BigInt & Date to match original Supabase output
function serializeHoliday(h: any) {
  if (!h) return null;
  return {
    id: Number(h.id),
    holiday_date: h.holidayDate.toISOString().split('T')[0],
    name: h.name,
    description: h.description,
    is_national: h.isNational,
    created_by: h.createdBy,
    created_at: h.createdAt.toISOString(),
    updated_at: h.updatedAt.toISOString()
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
    return { data: null, error: error.message || 'Gagal mengambil data hari libur' };
  }
}

export async function getHolidaysForMonth(year: number, month: number) {
  try {
    // month is 1-indexed (1-12)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // Less than the first day of next month

    const data = await prisma.holiday.findMany({
      where: {
        holidayDate: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { holidayDate: 'asc' }
    });

    return { data: data.map(serializeHoliday), error: null };
  } catch (error: any) {
    console.error('Error fetching holidays for month:', error);
    return { data: null, error: error.message || 'Gagal mengambil data hari libur bulanan' };
  }
}

export async function createHoliday(formData: FormData) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) {
    redirect('/login');
  }

  // Check if user is admin
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) {
    redirect('/');
  }

  const holiday_date = formData.get('holiday_date') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const is_national = formData.get('is_national') === 'true';

  if (!holiday_date || !name) {
    return { success: false, error: 'Tanggal dan nama wajib diisi' };
  }

  try {
    await prisma.holiday.create({
      data: {
        holidayDate: new Date(holiday_date),
        name,
        description: description || null,
        isNational: is_national,
        createdBy: user.id
      }
    });
  } catch (error: any) {
    console.error('Error creating holiday:', error);
    return { success: false, error: error.message || 'Gagal membuat hari libur' };
  }

  revalidatePath('/activities/holidays');
  revalidatePath('/activities/schedule');
  return { success: true, error: null };
}

export async function updateHoliday(formData: FormData) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) {
    redirect('/login');
  }

  // Check if user is admin
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) {
    redirect('/');
  }

  const id = formData.get('id') as string;
  const holiday_date = formData.get('holiday_date') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const is_national = formData.get('is_national');

  if (!id || !holiday_date || !name) {
    return { success: false, error: 'ID, tanggal, dan nama wajib diisi' };
  }

  try {
    await prisma.holiday.update({
      where: { id: BigInt(id) },
      data: {
        holidayDate: new Date(holiday_date),
        name,
        description: description || null,
        isNational: is_national === 'true',
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error updating holiday:', error);
    return { success: false, error: error.message || 'Gagal memperbarui hari libur' };
  }

  revalidatePath('/activities/holidays');
  revalidatePath('/activities/schedule');
  return { success: true, error: null };
}

export async function deleteHoliday(formData: FormData) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) {
    redirect('/login');
  }

  // Check if user is admin
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!profile || !['admin', 'super_admin'].includes(profile.role || '')) {
    redirect('/');
  }

  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, error: 'ID wajib diisi' };
  }

  try {
    await prisma.holiday.delete({
      where: { id: BigInt(id) }
    });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return { success: false, error: error.message || 'Gagal menghapus hari libur' };
  }

  revalidatePath('/activities/holidays');
  revalidatePath('/activities/schedule');
  return { success: true, error: null };
}
