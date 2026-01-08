'use client';

import { useEffect, useState } from 'react';

export interface Cliente {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    cpf_cnpj?: string;
    numero_cliente?: string;
}

export function useClients() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all clients (high limit for dropdown)
            // In a real scenario with thousands of clients, we should use an async select with search.
            // For now, listing recent 100 is a safe start, or searching.
            const response = await fetch('/api/clientes?limit=100');

            if (!response.ok) {
                throw new Error('Erro ao buscar clientes');
            }

            const data = await response.json();
            setClients(data.clientes || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            console.error('Erro ao buscar clientes:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        clients,
        loading,
        error,
        refetch: fetchClients,
    };
}
