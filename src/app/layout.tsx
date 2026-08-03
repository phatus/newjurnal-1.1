import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/ClientLayout";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "newjurnalku - Jurnal Mengajar & Catatan Kinerja",
  description: "Aplikasi pencatatan jurnal mengajar dan laporan kinerja guru.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f59e0b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;

  const dbProfile = user?.id ? await prisma.profile.findUnique({
    where: { id: user.id }
  }) : null;

  const profile = dbProfile ? {
    ...dbProfile,
    avatar_url: dbProfile.avatarUrl,
    unit_kerja: dbProfile.unitKerja,
    pangkat_gol: dbProfile.pangkatGol,
    report_notifications: dbProfile.reportNotifications,
    school_id: dbProfile.schoolId
  } : null;

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-slate-50 text-slate-900 antialiased")}>
        <ToastProvider>
          <ClientLayout user={user as any} profile={profile as any}>
            {children}
          </ClientLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
