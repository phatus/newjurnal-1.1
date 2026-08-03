import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isLoginPage = nextUrl.pathname === '/login'
            const isRegisterPage = nextUrl.pathname === '/register'
            const isConfirmPage = nextUrl.pathname === '/confirm-email'
            const isAuthCallback = nextUrl.pathname.startsWith('/auth')
            const isOnboarding = nextUrl.pathname.startsWith('/onboarding')
            const isApi = nextUrl.pathname.startsWith('/api')

            // Not logged in -> redirect to login (except public pages)
            if (!isLoggedIn && !isLoginPage && !isRegisterPage && !isConfirmPage && !isAuthCallback && !isApi) {
                return false; // Redirects to signIn page (/login)
            }

            // Already logged in -> redirect away from login/register
            if (isLoggedIn && (isLoginPage || isRegisterPage)) {
                return Response.redirect(new URL('/', nextUrl));
            }

            // Logged in but no school -> redirect to onboarding
            if (isLoggedIn && !isOnboarding && !isAuthCallback && !isLoginPage && !isRegisterPage && !isApi) {
                const schoolId = (auth.user as any).schoolId;
                if (!schoolId) {
                    return Response.redirect(new URL('/onboarding', nextUrl));
                }
            }

            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.schoolId = (user as any).schoolId;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).schoolId = token.schoolId as string | null;
            }
            return session;
        }
    },
    providers: [],
} satisfies NextAuthConfig;
