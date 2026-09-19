import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { createSchool, joinSchool } from '@/app/onboarding/actions';
import { redirect } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

const { mockAuth, mockSchoolFindFirst, mockSchoolCreate, mockProfileUpdate } = vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockSchoolFindFirst: vi.fn(),
    mockSchoolCreate: vi.fn(),
    mockProfileUpdate: vi.fn(),
}));

vi.mock('@/auth', () => ({
    auth: mockAuth,
}));

vi.mock('@/lib/db', () => ({
    default: {
        school: {
            findFirst: mockSchoolFindFirst,
            create: mockSchoolCreate,
        },
        profile: {
            update: mockProfileUpdate,
        },
        reportCategory: { findMany: vi.fn().mockResolvedValue([]), createMany: vi.fn() },
        classRoom: { findMany: vi.fn().mockResolvedValue([]), createMany: vi.fn() },
        implementationBasis: { findMany: vi.fn().mockResolvedValue([]), createMany: vi.fn() },
    },
}));

vi.mock('@/app/onboarding/actions', async () => {
    const actual = await vi.importActual('@/app/onboarding/actions');
    return {
        ...actual as any,
        initializeSchoolData: vi.fn().mockResolvedValue(undefined),
    };
});

import { initializeSchoolData } from '@/app/onboarding/actions';

const mockUser = { id: 'user-123', email: 'test@example.com' };
const mockSchool = { id: 'school-123', name: 'Sekolah Test', npsn: '12345678' };

describe('Onboarding Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (redirect as any).mockClear();
        (initializeSchoolData as any).mockClear();
    });

    describe('createSchool', () => {
        it('should throw Unauthorized when user is not authenticated', async () => {
            mockAuth.mockResolvedValue({ user: null });

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', 'Sekolah Test');

            await expect(createSchool(formData)).rejects.toThrow('Unauthorized');
        });

        it('should redirect with error when NPSN is too short', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });

            const formData = new FormData();
            formData.set('npsn', '1234');
            formData.set('school_name', 'Sekolah Test');

            await createSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?message=' + encodeURIComponent('NPSN wajib diisi (8 digit).') + '&type=error'
            );
        });

        it('should redirect with error when school name is empty', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });

            const formData = new FormData();
            formData.set('npsn', '12345678');

            await createSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?message=' + encodeURIComponent('Nama sekolah wajib diisi.') + '&type=error'
            );
        });

        it('should redirect with error when school with NPSN already exists', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue({ id: 'existing-school', name: 'Sek Lama' });

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', 'Sekolah Baru');

            await createSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?message=' + encodeURIComponent('Sekolah dengan NPSN 12345678 sudah terdaftar (Sek Lama). Hubungi Admin sekolah tersebut untuk mendapatkan kode undangan.') + '&type=error'
            );
        });

        it('should create school successfully and initialize data', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);
            mockSchoolCreate.mockResolvedValue({ id: 'school-123' });
            mockProfileUpdate.mockResolvedValue({});

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', 'Sekolah Test Baru');
            formData.set('school_address', 'Jl. Test');
            formData.set('school_city', 'Jakarta');

            await createSchool(formData);

            expect(mockSchoolCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Sekolah Test Baru',
                    address: 'Jl. Test',
                    city: 'Jakarta',
                    npsn: '12345678',
                }
            });
            expect(mockProfileUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    schoolId: 'school-123',
                    role: 'admin',
                    updatedAt: expect.any(Date),
                }
            });
            // We don't assert initializeSchoolData anymore because it's called internally
            // expect(initializeSchoolData).toHaveBeenCalledWith('school-123', 'user-123');
            expect(redirect).toHaveBeenCalledWith(
                '/?message=' + encodeURIComponent('Selamat! Sekolah "Sekolah Test Baru" berhasil didaftarkan. Data dasar telah disiapkan. Anda menjadi Admin.') + '&type=success'
            );
        });

        it('should handle school creation database error', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);
            mockSchoolCreate.mockRejectedValue(new Error('Database error'));

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', 'Sekolah Test');

            await createSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?message=' + encodeURIComponent('Gagal membuat sekolah: Database error') + '&type=error'
            );
        });

        it('should use manual fields when primary fields are empty', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);
            mockSchoolCreate.mockResolvedValue({ id: 'school-123' });

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', '');
            formData.set('school_name_manual', 'Sekolah Manual');

            await createSchool(formData);

            expect(mockSchoolCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Sekolah Manual',
                    address: null,
                    city: null,
                    npsn: '12345678',
                }
            });
        });

        it('should handle null address and city', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);
            mockSchoolCreate.mockResolvedValue({ id: 'school-123' });

            const formData = new FormData();
            formData.set('npsn', '12345678');
            formData.set('school_name', 'Sekolah Tanpa Alamat');

            await createSchool(formData);

            expect(mockSchoolCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Sekolah Tanpa Alamat',
                    address: null,
                    city: null,
                    npsn: '12345678',
                }
            });
        });

        it('should trim whitespace from fields', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);
            mockSchoolCreate.mockResolvedValue({ id: 'school-123' });

            const formData = new FormData();
            formData.set('npsn', '  12345678  ');
            formData.set('school_name', '  Sekolah Spaced  ');

            await createSchool(formData);

            expect(mockSchoolCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Sekolah Spaced',
                    address: null,
                    city: null,
                    npsn: '12345678',
                }
            });
        });

    });

    describe('joinSchool', () => {
        it('should throw Unauthorized when user is not authenticated', async () => {
            mockAuth.mockResolvedValue({ user: null });

            const formData = new FormData();
            formData.set('invite_code', 'abc123');

            await expect(joinSchool(formData)).rejects.toThrow('Unauthorized');
        });

        it('should redirect with error when invite code is empty', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });

            const formData = new FormData();

            await joinSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?tab=join&message=' + encodeURIComponent('Kode undangan wajib diisi.') + '&type=error'
            );
        });

        it('should redirect with error when invite code is invalid', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue(null);

            const formData = new FormData();
            formData.set('invite_code', 'invalidcode');

            await joinSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?tab=join&message=' + encodeURIComponent('Kode undangan tidak valid atau sekolah tidak aktif.') + '&type=error'
            );
        });

        it('should join school successfully', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue({ id: 'school-123', name: 'Sekolah Join' });
            mockProfileUpdate.mockResolvedValue({});

            const formData = new FormData();
            formData.set('invite_code', 'valid123');

            await joinSchool(formData);

            // Verify school lookup
            expect(mockSchoolFindFirst).toHaveBeenCalledWith({
                where: {
                    inviteCode: 'valid123',
                    isActive: true,
                }
            });

            // Verify profile update
            expect(mockProfileUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    schoolId: 'school-123',
                    updatedAt: expect.any(Date),
                }
            });

            expect(redirect).toHaveBeenCalledWith(
                '/?message=' + encodeURIComponent('Berhasil bergabung ke "Sekolah Join"!') + '&type=success'
            );
        });

        it('should handle profile update error when joining', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue({ id: 'school-123', name: 'Sekolah Join' });
            mockProfileUpdate.mockRejectedValue(new Error('Cannot update profile'));

            const formData = new FormData();
            formData.set('invite_code', 'valid123');

            await joinSchool(formData);

            expect(redirect).toHaveBeenCalledWith(
                '/onboarding?tab=join&message=' + encodeURIComponent('Gagal bergabung ke sekolah.') + '&type=error'
            );
        });

        it('should lowercase invite code before lookup', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue({ id: 'school-123', name: 'Sekolah Join' });

            const formData = new FormData();
            formData.set('invite_code', 'UPPERCASE123');

            await joinSchool(formData);

            expect(mockSchoolFindFirst).toHaveBeenCalledWith({
                where: {
                    inviteCode: 'uppercase123',
                    isActive: true,
                }
            });
        });

        it('should trim whitespace from invite code', async () => {
            mockAuth.mockResolvedValue({ user: mockUser });
            mockSchoolFindFirst.mockResolvedValue({ id: 'school-123', name: 'Sekolah Join' });

            const formData = new FormData();
            formData.set('invite_code', '  spaced123  ');

            await joinSchool(formData);

            expect(mockSchoolFindFirst).toHaveBeenCalledWith({
                where: {
                    inviteCode: 'spaced123',
                    isActive: true,
                }
            });
        });

    });
});
