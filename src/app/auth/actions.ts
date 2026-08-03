'use server'

import { auth, signIn, signOut } from '@/auth'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return redirect(`/login?message=${encodeURIComponent('Email dan password harus diisi.')}&type=error`)
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/',
        })
    } catch (error: any) {
        if (error instanceof AuthError) {
            return redirect(`/login?message=${encodeURIComponent('Email atau password salah.')}&type=error`)
        }
        if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error; // Re-throw Next.js redirect
        }
        console.error('Login error:', error)
        return redirect(`/login?message=${encodeURIComponent('Terjadi kesalahan autentikasi.')}&type=error`)
    }
}

export async function register(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    if (!email || !password || !fullName) {
        return redirect(`/register?message=${encodeURIComponent('Semua bidang harus diisi.')}&type=error`)
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return redirect(`/register?message=${encodeURIComponent('Email sudah terdaftar.')}&type=error`)
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user and profile in transaction
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                }
            })

            await tx.profile.create({
                data: {
                    id: user.id,
                    name: fullName,
                    role: 'user',
                }
            })
        })

        return redirect('/login?message=' + encodeURIComponent('Registrasi berhasil! Silakan login.') + '&type=success')
    } catch (err: any) {
        if (err.message === 'NEXT_REDIRECT' || err.digest?.startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error('Registration Error:', err)
        return redirect(`/register?message=${encodeURIComponent('Gagal mendaftar. Silakan coba lagi.')}&type=error`)
    }
}

export async function updateProfile(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const nip = formData.get('nip') as string
    const pangkat_gol = formData.get('pangkat_gol') as string
    const jabatan = formData.get('jabatan') as string
    const unit_kerja = formData.get('unit_kerja') as string
    const subject = formData.get('subject') as string
    const avatar_url = formData.get('avatar_url') as string

    try {
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                name,
                nip,
                pangkatGol: pangkat_gol,
                jabatan,
                unitKerja: unit_kerja,
                subject,
                avatarUrl: avatar_url,
                updatedAt: new Date()
            }
        })
    } catch (error) {
        console.error('Update Profile Error:', error)
        return redirect('/profile?message=' + encodeURIComponent('Gagal memperbarui profil.') + '&type=error')
    }

    revalidatePath('/profile')
    return redirect('/profile?message=' + encodeURIComponent('Profil berhasil diperbarui!') + '&type=success')
}

export async function updatePreferences(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const report_notifications = formData.get('report_notifications') === 'on'
    const theme = formData.get('theme') as string

    try {
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                reportNotifications: report_notifications,
                theme,
                updatedAt: new Date()
            }
        })
    } catch (error) {
        console.error('Update Preferences Error:', error)
        return redirect('/profile/preferences?message=' + encodeURIComponent('Gagal memperbarui preferensi.') + '&type=error')
    }

    revalidatePath('/profile')
    return redirect('/profile?message=' + encodeURIComponent('Preferensi berhasil disimpan!') + '&type=success')
}

export async function changePassword(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
        return redirect('/profile/change-password?message=' + encodeURIComponent('Konfirmasi kata sandi tidak cocok.') + '&type=error')
    }

    if (password.length < 6) {
        return redirect('/profile/change-password?message=' + encodeURIComponent('Kata sandi minimal 6 karakter.') + '&type=error')
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        })
    } catch (error) {
        console.error('Change Password Error:', error)
        return redirect('/profile/change-password?message=' + encodeURIComponent('Gagal mengubah kata sandi.') + '&type=error')
    }

    return redirect('/profile?message=' + encodeURIComponent('Kata sandi berhasil diperbarui!') + '&type=success')
}

export async function updateAvatarOnly(avatar_url: string) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) throw new Error('Unauthorized')

    try {
        await prisma.profile.update({
            where: { id: user.id },
            data: {
                avatarUrl: avatar_url,
                updatedAt: new Date()
            }
        })
    } catch (error) {
        console.error('Update Avatar Error:', error)
        throw error
    }

    revalidatePath('/profile')
    revalidatePath('/')
}

export async function logout() {
    await signOut({ redirectTo: '/login' })
}
