'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface CreateUserForm {
  email: string;
  name: string;
  role: string;
  phone: string;
}

const ROLE_LABELS = {
  admin: 'Administrador',
  diretor: 'Diretor',
  gerente_adm: 'Gerente Administrativo',
  gerente_financeiro: 'Gerente Financeiro',
  supervisor_tecnico: 'Supervisor Técnico',
  technician: 'Técnico',
  atendente: 'Atendente',
  user: 'Usuário',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    name: '',
    role: 'user',
    phone: '',
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Buscar dados do usuário na tabela users
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (
        !userData ||
        !['admin', 'diretor', 'gerente_adm', 'gerente_financeiro'].includes(
          userData.role
        )
      ) {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      router.push('/auth/login');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setMessage({
        type: 'success',
        text: `Usuário criado com sucesso! Senha temporária: ${data.user.tempPassword}`,
      });

      setForm({ email: '', name: '', role: 'user', phone: '' });
      setShowForm(false);
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setCreating(false);
    }
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];

    const baseRoles = [
      'user',
      'technician',
      'atendente',
      'supervisor_tecnico',
      'gerente_adm',
      'gerente_financeiro',
    ];

    // Admin pode criar qualquer role
    if (currentUser.role === 'admin') {
      return [...baseRoles, 'diretor', 'admin'];
    }

    // Diretor pode criar qualquer role exceto admin
    if (currentUser.role === 'diretor') {
      return [...baseRoles, 'diretor'];
    }

    // Gerentes podem criar apenas roles básicas
    return baseRoles;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciamento de Usuários
              </h1>
              <button
                onClick={() => setShowForm(!showForm)}
                className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                {showForm ? 'Cancelar' : 'Novo Usuário'}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`border-b px-6 py-4 ${
                message.type === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {showForm && (
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Criar Novo Usuário
              </h2>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@interalpha.com.br"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Função *
                  </label>
                  <select
                    required
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-md bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
