"use client";

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="relative hidden items-center md:flex">
      <Search className="absolute left-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
      <Input
        placeholder="Buscar ordens, clientes..."
        className="w-80 border-slate-200/60 bg-slate-50/80 pl-10 backdrop-blur-sm focus:border-blue-500 dark:border-slate-700/60 dark:bg-slate-900/80 dark:focus:border-blue-400"
      />
    </div>
  );
}
