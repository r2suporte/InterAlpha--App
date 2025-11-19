'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-states';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sign-in');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner className="mx-auto h-8 w-8 text-indigo-600" />
        <p className="mt-4 text-gray-600">Redirecionando para o novo login...</p>
      </div>
    </div>
  );
}
