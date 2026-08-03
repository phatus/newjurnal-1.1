"use server";

import { auth } from "@/auth";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CategorySchema, MasterDataSchema } from "@/lib/schemas";

// Helper to serialize BigInt to Number
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

export async function getUserCategories() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return [];

    const data = await prisma.reportCategory.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    });

    return data.map(serializeCategory);
}

export async function createCategory(formData: FormData) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    const rawData = Object.fromEntries(formData.entries());
    const validation = CategorySchema.safeParse({
        ...rawData,
        is_teaching: rawData.is_teaching === 'true'
    });

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { name, rhk_label, is_teaching } = validation.data;

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    });

    await prisma.reportCategory.create({
        data: {
            name,
            rhkLabel: rhk_label,
            isTeaching: is_teaching,
            userId: user.id,
            schoolId: profile?.schoolId
        }
    });

    revalidatePath('/master-data/categories');
}

export async function updateCategory(id: number, formData: FormData) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    const rawData = Object.fromEntries(formData.entries());
    const validation = CategorySchema.safeParse({
        ...rawData,
        is_teaching: rawData.is_teaching === 'true'
    });

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { name, rhk_label, is_teaching } = validation.data;

    await prisma.reportCategory.update({
        where: { id: BigInt(id), userId: user.id },
        data: {
            name,
            rhkLabel: rhk_label,
            isTeaching: is_teaching
        }
    });

    revalidatePath('/master-data/categories');
}

export async function deleteCategory(id: number) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    await prisma.reportCategory.delete({
        where: { id: BigInt(id), userId: user.id }
    });

    revalidatePath('/master-data/categories');
}

// --- Class Rooms ---

export async function getUserClassRooms() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return [];

    const data = await prisma.classRoom.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    });

    return data.map(serializeClassRoom);
}

export async function createClassRoom(formData: FormData) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    const rawData = Object.fromEntries(formData.entries());
    const validation = MasterDataSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { name } = validation.data;

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    });

    await prisma.classRoom.create({
        data: {
            name,
            userId: user.id,
            schoolId: profile?.schoolId
        }
    });

    revalidatePath('/master-data/classes');
}

export async function deleteClassRoom(id: number) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    await prisma.classRoom.delete({
        where: { id: BigInt(id), userId: user.id }
    });

    revalidatePath('/master-data/classes');
}

// --- Implementation Bases ---

export async function getUserBases() {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return [];

    const data = await prisma.implementationBasis.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    });

    return data.map(serializeBase);
}

export async function createBase(formData: FormData) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    const rawData = Object.fromEntries(formData.entries());
    const validation = MasterDataSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.issues[0].message);
    }

    const { name } = validation.data;

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { schoolId: true }
    });

    await prisma.implementationBasis.create({
        data: {
            name,
            userId: user.id,
            schoolId: profile?.schoolId
        }
    });

    revalidatePath('/master-data/bases');
}

export async function deleteBase(id: number) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error("Unauthorized");

    await prisma.implementationBasis.delete({
        where: { id: BigInt(id), userId: user.id }
    });

    revalidatePath('/master-data/bases');
}
