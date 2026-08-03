'use server'

import { auth } from '@/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'

export async function createSchool(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const npsn = (formData.get('npsn') as string)?.trim()
    const schoolName = (formData.get('school_name') as string)?.trim() || (formData.get('school_name_manual') as string)?.trim()
    const schoolAddress = (formData.get('school_address') as string)?.trim() || (formData.get('school_address_manual') as string)?.trim()
    const schoolCity = (formData.get('school_city') as string)?.trim() || (formData.get('school_city_manual') as string)?.trim()

    if (!npsn || npsn.length < 8) {
        return redirect('/onboarding?message=' + encodeURIComponent('NPSN wajib diisi (8 digit).') + '&type=error')
    }

    if (!schoolName) {
        return redirect('/onboarding?message=' + encodeURIComponent('Nama sekolah wajib diisi.') + '&type=error')
    }

    // Check if school with this NPSN already exists
    const existingSchool = await prisma.school.findFirst({
        where: { npsn }
    })

    if (existingSchool) {
        return redirect('/onboarding?message=' + encodeURIComponent('Sekolah dengan NPSN ' + npsn + ' sudah terdaftar (' + existingSchool.name + '). Hubungi Admin sekolah tersebut untuk mendapatkan kode undangan.') + '&type=error')
    }

    try {
        // Create the school
        const school = await prisma.school.create({
            data: {
                name: schoolName,
                address: schoolAddress || null,
                city: schoolCity || null,
                npsn: npsn,
            }
        })

        // Update the user's profile with school_id and make them admin
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                schoolId: school.id,
                role: 'admin',
                updatedAt: new Date()
            }
        })

        // Initialize base data from template
        await initializeSchoolData(school.id, user.id);

        return redirect('/?message=' + encodeURIComponent('Selamat! Sekolah "' + schoolName + '" berhasil didaftarkan. Data dasar telah disiapkan. Anda menjadi Admin.') + '&type=success')
    } catch (schoolError: any) {
        console.error('Create School Error:', schoolError)
        return redirect('/onboarding?message=' + encodeURIComponent('Gagal membuat sekolah: ' + schoolError.message) + '&type=error')
    }
}

/**
 * Initializes a new school with base data copied from a template school.
 * This ensures new schools have categories, classes, and bases to start with.
 */
export async function initializeSchoolData(newSchoolId: string, creatorId: string) {
    const TEMPLATE_SCHOOL_ID = 'e62b1c6b-f2d7-4591-97be-492f794df156';

    console.log(`Initializing master data for school ${newSchoolId} (Creator: ${creatorId})`);

    try {
        // 1. Copy Categories
        const cats = await prisma.reportCategory.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (cats && cats.length > 0) {
            console.log(`Copying ${cats.length} categories...`);
            const catRecords = cats.map(c => ({
                name: c.name,
                rhkLabel: c.rhkLabel,
                isTeaching: c.isTeaching,
                schoolId: newSchoolId,
                userId: creatorId
            }));
            await prisma.reportCategory.createMany({ data: catRecords });
        }

        // 2. Copy Class Rooms
        const classes = await prisma.classRoom.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (classes && classes.length > 0) {
            const classRecords = classes.map(c => ({
                name: c.name,
                schoolId: newSchoolId,
                userId: creatorId
            }));
            await prisma.classRoom.createMany({ data: classRecords });
        }

        // 3. Copy Implementation Bases
        const bases = await prisma.implementationBasis.findMany({
            where: { schoolId: TEMPLATE_SCHOOL_ID }
        })

        if (bases && bases.length > 0) {
            const baseRecords = bases.map(b => ({
                name: b.name,
                schoolId: newSchoolId,
                userId: creatorId
            }));
            await prisma.implementationBasis.createMany({ data: baseRecords });
        }

        console.log('Master data initialization completed successfully.');
    } catch (error) {
        console.error('Failed to initialize school master data:', error);
    }
}

export async function joinSchool(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const inviteCode = (formData.get('invite_code') as string)?.trim()?.toLowerCase()

    if (!inviteCode) {
        return redirect('/onboarding?tab=join&message=' + encodeURIComponent('Kode undangan wajib diisi.') + '&type=error')
    }

    // Find the school by invite code
    const school = await prisma.school.findFirst({
        where: {
            inviteCode,
            isActive: true
        }
    })

    if (!school) {
        return redirect('/onboarding?tab=join&message=' + encodeURIComponent('Kode undangan tidak valid atau sekolah tidak aktif.') + '&type=error')
    }

    try {
        // Update the user's profile with the school_id
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                schoolId: school.id,
                updatedAt: new Date()
            }
        })

        return redirect('/?message=' + encodeURIComponent('Berhasil bergabung ke "' + school.name + '"!') + '&type=success')
    } catch (profileError: any) {
        console.error('Join School Error:', profileError)
        return redirect('/onboarding?tab=join&message=' + encodeURIComponent('Gagal bergabung ke sekolah.') + '&type=error')
    }
}
