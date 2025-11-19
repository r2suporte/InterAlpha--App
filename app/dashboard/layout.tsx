'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoaded, userId } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push('/sign-in');
        }
    }, [isLoaded, userId, router]);

    // Show loading state while checking authentication
    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show nothing (will redirect)
    if (!userId) {
        return null;
    }

    // User is authenticated, show the dashboard
    return <>{children}</>;
}
