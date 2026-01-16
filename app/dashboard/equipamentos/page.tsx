'use client';

import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Search,
    Filter,
    Eye,
    MoreVertical,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Equipamento {
    id: string;
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    imei?: string;
    cliente: {
        id: string;
        nome: string;
    };
    updatedAt: string;
}

export default function EquipamentosPage() {
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchEquipamentos();
    }, [search]);

    const fetchEquipamentos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/equipamentos?search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setEquipamentos(data);
            }
        } catch (error) {
            console.error('Failed to fetch equipamentos', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                        Gerenciamento de Equipamentos
                    </h1>
                    <p className="text-gray-500">Visualize e gerencie todos os dispositivos cadastrados</p>
                </div>
                {/*
        <Button className="bg-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Novo Equipamento
        </Button>
        // Currently we create equipments via OS or Client page, but could add here too.
        */}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar por modelo, serial, IMEI ou cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            <th className="px-6 py-3">Dispositivo</th>
                            <th className="px-6 py-3">Identificação (S/N / IMEI)</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Última Atualização</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : equipamentos.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum equipamento encontrado.</td></tr>
                        ) : (
                            equipamentos.map(eq => (
                                <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{eq.tipo} {eq.modelo}</div>
                                        <div className="text-xs text-gray-500">{eq.marca || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit mb-1">
                                            SN: {eq.numeroSerie || 'N/A'}
                                        </div>
                                        {eq.imei && (
                                            <div className="font-mono text-xs bg-gray-50 px-2 py-1 rounded w-fit text-gray-500">
                                                IMEI: {eq.imei}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 hover:underline">
                                        <Link href={`/dashboard/clientes/${eq.cliente.id}`}>
                                            {eq.cliente.nome}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(eq.updatedAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/equipamentos/${eq.id}`}>
                                                <Eye className="h-4 w-4 mr-1" /> Detalhes
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
