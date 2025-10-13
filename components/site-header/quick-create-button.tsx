"use client";

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickCreateButton() {
  const router = useRouter();
  const handleNewOS = () => {
    router.push('/dashboard/ordem-servico');
  };

  return (
    <Button
      size="sm"
      className="hidden bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm hover:from-blue-700 hover:to-blue-800 lg:flex"
      onClick={handleNewOS}
    >
      <Plus className="mr-2 h-4 w-4" />
      Nova OS
    </Button>
  );
}
