'use client';

import { useClerk } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(() => router.push('/sign-in'));
    } catch (err) {
      console.error('Erro inesperado:', err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  );
}
