import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                    include: {
                        profile: true,
                    }
                })

                if (!user) {
                    return null
                }

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.profile?.name || user.email,
                        role: user.profile?.role || 'user',
                        schoolId: user.profile?.schoolId || null,
                    }
                }

                return null
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.schoolId = (user as any).schoolId;
            }
            if (trigger === "update" && session?.user) {
                if (session.user.schoolId !== undefined) token.schoolId = session.user.schoolId;
                if (session.user.role !== undefined) token.role = session.user.role;
            }
            // Auto-sync schoolId from database if not present in token
            if (token.id && !token.schoolId) {
                try {
                    const profile = await prisma.profile.findUnique({
                        where: { id: token.id as string },
                        select: { schoolId: true, role: true }
                    });
                    if (profile?.schoolId) {
                        token.schoolId = profile.schoolId;
                        if (profile.role) token.role = profile.role;
                    }
                } catch (e) {
                    console.error("Failed to sync profile in jwt callback:", e);
                }
            }
            return token;
        },
    }
})
