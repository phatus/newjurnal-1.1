import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
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
})
