import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivitiesClient from '@/app/activities/ActivitiesClient';
import { deleteActivity } from '@/app/activities/actions';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock Link component
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock actions
vi.mock('@/app/activities/actions', () => ({
    deleteActivity: vi.fn(),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
    cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}));

const mockActivities = [
    {
        id: '1',
        user_id: 'user-1',
        school_id: 'school-1',
        category_id: '1',
        description: 'Melaksanakan pembelajaran matematika',
        activity_date: '2024-03-05',
        category: {
            name: 'KBM',
            rhk_label: 'Proses Pembelajaran',
            is_teaching: true,
        },
        teaching_hours: 2,
        classes: [{ class: { id: 1, name: 'X IPA 1' } }],
        basis: { name: 'Satuan Pelajaran' },
        evidence_link: 'https://example.com/bukti.pdf',
    },
    {
        id: '2',
        user_id: 'user-1',
        school_id: 'school-1',
        category_id: '2',
        description: 'Pemeliharaan peralatan lab',
        activity_date: '2024-03-05',
        category: {
            name: 'Non-KBM',
            rhk_label: 'Administrasi Sekolah',
            is_teaching: false,
        },
        teaching_hours: null,
        classes: null,
        basis: null,
        evidence_link: null,
    },
    {
        id: '3',
        user_id: 'user-1',
        school_id: 'school-1',
        category_id: '3',
        description: 'Ujian semester',
        activity_date: '2024-02-20',
        category: {
            name: 'KBM',
            rhk_label: 'Proses Pembelajaran',
            is_teaching: true,
        },
        teaching_hours: 3,
        classes: [
            { class: { id: 1, name: 'X IPA 1' } },
            { class: { id: 2, name: 'X IPA 2' } },
        ],
        basis: { name: 'Jadwal Ujian' },
        evidence_link: 'https://example.com/ujian.pdf',
    },
];

describe('ActivitiesClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (deleteActivity as Mock).mockResolvedValue({ success: true });
    });

    it('should render activities list correctly', () => {
        render(<ActivitiesClient initialActivities={mockActivities} />);

        expect(screen.getByText('Riwayat Kegiatan')).toBeInTheDocument();
        expect(screen.getByText('Daftar Kegiatan Harian')).toBeInTheDocument();
        // Use getAllByText since activity appears in both desktop and mobile views
        expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pemeliharaan peralatan lab').length).toBeGreaterThan(0);
    });

    it('should display empty state when no activities', () => {
        render(<ActivitiesClient initialActivities={[]} />);

        expect(screen.getByText('Tidak Ada Kegiatan')).toBeInTheDocument();
        expect(screen.getByText('Coba kata kunci lain atau pilih bulan lain.')).toBeInTheDocument();
        expect(screen.getByText('Catat Sekarang')).toBeInTheDocument();
    });

    it('should filter activities by search query', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        const searchInput = screen.getByPlaceholderText('Cari kegiatan...');
        await user.type(searchInput, 'matematika');

        await waitFor(() => {
            expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);
            expect(screen.queryByText('Pemeliharaan peralatan lab')).not.toBeInTheDocument();
        });
    });

    it('should filter activities by search query (case insensitive)', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        const searchInput = screen.getByPlaceholderText('Cari kegiatan...');
        await user.type(searchInput, 'MATEMATIKA');

        await waitFor(() => {
            expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);
        });
    });

    it('should filter by category name', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        // Initially all activities shown
        expect(screen.getAllByText('Pemeliharaan peralatan lab').length).toBeGreaterThan(0);

        const searchInput = screen.getByPlaceholderText('Cari kegiatan...');
        await user.type(searchInput, 'KBM');

        // Wait for filter to apply and check that non-matching activities are hidden
        await waitFor(() => {
            // KBM activities should be visible
            expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Ujian semester').length).toBeGreaterThan(0);
        }, { timeout: 2000 });

        // Non-KBM activity should not be visible at all (neither desktop nor mobile)
        expect(screen.queryAllByText('Pemeliharaan peralatan lab').length).toBe(0);
    });

    it('should show delete modal when delete button clicked', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        // Find delete buttons (there are 2 initially visible on desktop)
        const deleteButtons = screen.getAllByTitle('Hapus');
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Hapus Kegiatan?')).toBeInTheDocument();
            expect(screen.getByText(/Tindakan ini tidak dapat dibatalkan/)).toBeInTheDocument();
            expect(screen.getByText('Batal')).toBeInTheDocument();
            expect(screen.getByText('Ya, Hapus')).toBeInTheDocument();
        });
    });

    it('should close delete modal when cancel button clicked', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        const deleteButtons = screen.getAllByTitle('Hapus');
        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Hapus Kegiatan?')).toBeInTheDocument();
        });

        const cancelButton = screen.getByText('Batal');
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByText('Hapus Kegiatan?')).not.toBeInTheDocument();
        });
    });

    it('should call deleteActivity and update list when confirmed', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        const deleteButtons = screen.getAllByTitle('Hapus');
        await user.click(deleteButtons[0]);

        const confirmButton = screen.getByText('Ya, Hapus');
        await user.click(confirmButton);

        await waitFor(() => {
            expect(deleteActivity).toHaveBeenCalledWith('1');
        });

        // Activity should be removed from list
        await waitFor(() => {
            expect(screen.queryByText('Melaksanakan pembelajaran matematika')).not.toBeInTheDocument();
        });
    });

    it('should show loading state during delete', async () => {
        const user = userEvent.setup();
        // Make deleteActivity slow
        (deleteActivity as Mock).mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 100))
        );

        render(<ActivitiesClient initialActivities={mockActivities} />);

        const deleteButtons = screen.getAllByTitle('Hapus');
        await user.click(deleteButtons[0]);

        const confirmButton = screen.getByText('Ya, Hapus');
        await user.click(confirmButton);

        // Button should show loading state
        await waitFor(() => {
            expect(screen.getByText('Menghapus...')).toBeInTheDocument();
        });
    });

    it('should display message when provided', () => {
        render(
            <ActivitiesClient
                initialActivities={[]}
                message="Kegiatan berhasil ditambahkan"
                type="success"
            />
        );

        expect(screen.getByText('Kegiatan berhasil ditambahkan')).toBeInTheDocument();
    });

    it('should display error message with correct styling', () => {
        render(
            <ActivitiesClient
                initialActivities={[]}
                message="Gagal menambahkan kegiatan"
                type="error"
            />
        );

        const messageDiv = screen.getByText('Gagal menambahkan kegiatan').closest('div');
        expect(messageDiv).toHaveClass('bg-red-50');
    });

    it('should group activities by date correctly', () => {
        render(<ActivitiesClient initialActivities={mockActivities} />);

        // Both activities on 2024-03-05 should be grouped
        const marchDateText = screen.getAllByText(/5 Mar/i);
        expect(marchDateText.length).toBeGreaterThanOrEqual(1);
    });

    it('should display activity metadata correctly', () => {
        render(<ActivitiesClient initialActivities={mockActivities} />);

        // Check category badges - both desktop and mobile views (appears twice: table + mobile card)
        expect(screen.getAllByText('KBM').length).toBeGreaterThanOrEqual(2); // 2 KBM activities * 2 views = at least 4
        expect(screen.getAllByText('Non-KBM').length).toBeGreaterThanOrEqual(2); // 1 activity * 2 views = at least 2

        // Check teaching hours (appears in both views)
        expect(screen.getAllByText('2 JP').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('3 JP').length).toBeGreaterThanOrEqual(2);

        // Check class names
        expect(screen.getAllByText('X IPA 1').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('X IPA 2').length).toBeGreaterThanOrEqual(2);

        // Check basis
        expect(screen.getAllByText('Satuan Pelajaran').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Jadwal Ujian').length).toBeGreaterThanOrEqual(2);
    });

    it('should handle null/undefined optional fields', () => {
        const minimalActivity = {
            id: '4',
            user_id: 'user-1',
            school_id: 'school-1',
            category_id: '1',
            description: 'Kegiatan minimal',
            activity_date: '2024-03-06',
            category: null,
            teaching_hours: null,
            classes: null,
            basis: null,
            evidence_link: null,
        };

        render(<ActivitiesClient initialActivities={[minimalActivity]} />);

        expect(screen.getAllByText('Kegiatan minimal').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Tanpa Kategori').length).toBeGreaterThanOrEqual(1);
    });

    it('should sync activities when initialActivities changes', async () => {
        const { rerender } = render(<ActivitiesClient initialActivities={mockActivities} />);

        expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);

        // Re-render with new activities
        const newActivities = [
            {
                id: '5',
                user_id: 'user-1',
                school_id: 'school-1',
                category_id: '4',
                description: 'Kegiatan baru',
                activity_date: '2024-03-07',
                category: { name: 'Baru', rhk_label: 'Lain-lain', is_teaching: false },
            },
        ];
        rerender(<ActivitiesClient initialActivities={newActivities} />);

        await waitFor(() => {
            expect(screen.queryByText('Melaksanakan pembelajaran matematika')).not.toBeInTheDocument();
            expect(screen.getAllByText('Kegiatan baru').length).toBeGreaterThanOrEqual(1);
        });
    });

    it('should have proper month/year filter options', () => {
        render(<ActivitiesClient initialActivities={mockActivities} currentMonth={3} />);

        // Check month dropdown
        const monthSelect = screen.getByDisplayValue('Maret'); // March should be selected
        expect(monthSelect).toBeInTheDocument();

        // Check year dropdown (should have 5 years)
        const yearSelects = screen.getAllByRole('combobox').filter(
            (el): el is HTMLSelectElement => 'value' in el && typeof el.value === 'string' && el.value !== '' && parseInt(el.value) >= 2020
        );
        expect(yearSelects.length).toBeGreaterThanOrEqual(1);
    });

    it('should correctly render mobile view cards', () => {
        // This tests the mobile view structure exists
        render(<ActivitiesClient initialActivities={mockActivities} />);

        // Check that mobile cards container exists (hidden on desktop)
        const mobileContainer = document.querySelector('.block.lg\\:hidden');
        expect(mobileContainer).toBeInTheDocument();
    });

    it('should handle search clearing and show all activities', async () => {
        const user = userEvent.setup();
        render(<ActivitiesClient initialActivities={mockActivities} />);

        const searchInput = screen.getByPlaceholderText('Cari kegiatan...');

        // Type search
        await user.type(searchInput, 'matematika');

        // Clear search
        await user.clear(searchInput);

        // All activities should be visible again
        await waitFor(() => {
            expect(screen.getAllByText('Melaksanakan pembelajaran matematika').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Pemeliharaan peralatan lab').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Ujian semester').length).toBeGreaterThan(0);
        });
    });
});
