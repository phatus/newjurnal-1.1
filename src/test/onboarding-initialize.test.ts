import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeSchoolData } from '@/app/onboarding/actions';

// Mock Prisma
const { mockFindMany, mockCreateMany } = vi.hoisted(() => ({
    mockFindMany: vi.fn(),
    mockCreateMany: vi.fn()
}));

vi.mock('@/lib/db', () => ({
    default: {
        reportCategory: { findMany: mockFindMany, createMany: mockCreateMany },
        classRoom: { findMany: mockFindMany, createMany: mockCreateMany },
        implementationBasis: { findMany: mockFindMany, createMany: mockCreateMany },
    },
}));

const TEMPLATE_SCHOOL_ID = 'e62b1c6b-f2d7-4591-97be-492f794df156';

describe('initializeSchoolData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should run full initialization flow', async () => {
        mockFindMany.mockResolvedValueOnce([{ name: 'Cat', rhkLabel: 'RHK', isTeaching: true }]);
        mockFindMany.mockResolvedValueOnce([{ name: 'Class' }]);
        mockFindMany.mockResolvedValueOnce([{ name: 'Basis' }]);

        mockCreateMany.mockResolvedValue({ count: 1 });

        await initializeSchoolData('school-123', 'user-456');

        expect(console.log).toHaveBeenCalledWith(
            'Initializing master data for school school-123 (Creator: user-456)'
        );
        expect(console.log).toHaveBeenCalledWith(
            'Master data initialization completed successfully.'
        );

        // findMany called 3 times
        expect(mockFindMany).toHaveBeenCalledTimes(3);
        expect(mockFindMany).toHaveBeenNthCalledWith(1, { where: { schoolId: TEMPLATE_SCHOOL_ID } });
        expect(mockFindMany).toHaveBeenNthCalledWith(2, { where: { schoolId: TEMPLATE_SCHOOL_ID } });
        expect(mockFindMany).toHaveBeenNthCalledWith(3, { where: { schoolId: TEMPLATE_SCHOOL_ID } });

        // createMany called 3 times
        expect(mockCreateMany).toHaveBeenCalledTimes(3);
        
        // Check mapping
        expect(mockCreateMany).toHaveBeenNthCalledWith(1, {
            data: [{ name: 'Cat', rhkLabel: 'RHK', isTeaching: true, schoolId: 'school-123', userId: 'user-456' }]
        });
        expect(mockCreateMany).toHaveBeenNthCalledWith(2, {
            data: [{ name: 'Class', schoolId: 'school-123', userId: 'user-456' }]
        });
        expect(mockCreateMany).toHaveBeenNthCalledWith(3, {
            data: [{ name: 'Basis', schoolId: 'school-123', userId: 'user-456' }]
        });
    });

    it('should handle empty data sets (no inserts)', async () => {
        mockFindMany.mockResolvedValue([]);

        await initializeSchoolData('school-123', 'user-456');

        expect(mockFindMany).toHaveBeenCalledTimes(3);
        expect(mockCreateMany).not.toHaveBeenCalled();
    });

    it('should log error and continue when query fails', async () => {
        mockFindMany.mockRejectedValueOnce(new Error('DB error'));

        await initializeSchoolData('school-123', 'user-456');

        expect(console.error).toHaveBeenCalledWith(
            'Failed to initialize school master data:',
            expect.any(Error)
        );
    });

    it('should log error and continue when insert fails', async () => {
        mockFindMany.mockResolvedValue([{ name: 'Cat' }]);
        mockCreateMany.mockRejectedValueOnce(new Error('Insert failed'));

        await initializeSchoolData('school-123', 'user-456');

        expect(console.error).toHaveBeenCalledWith(
            'Failed to initialize school master data:',
            expect.any(Error)
        );
    });

    it('should handle null fields in template data', async () => {
        mockFindMany.mockResolvedValueOnce([{ name: 'Cat', rhkLabel: null, isTeaching: true }]);
        mockFindMany.mockResolvedValue([]); // other queries return empty

        mockCreateMany.mockResolvedValue({ count: 1 });

        await initializeSchoolData('new-school-123', 'user-456');

        expect(mockCreateMany).toHaveBeenCalledTimes(1);
        expect(mockCreateMany).toHaveBeenCalledWith({
            data: [{ name: 'Cat', rhkLabel: null, isTeaching: true, schoolId: 'new-school-123', userId: 'user-456' }]
        });
    });
});

