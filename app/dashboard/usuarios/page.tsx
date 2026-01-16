'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    UserPlus,
    Shield,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'technician',
        active: true
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users?search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const handleSave = async () => {
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                fetchUsers();
                resetForm();
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao salvar usuário');
            }
        } catch (error) {
            console.error('Save error', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error('Delete error', error);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'technician',
            active: true
        });
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't show password
            role: user.role,
            active: user.active
        });
        setIsDialogOpen(true);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Administrador</span>;
            case 'technician': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Técnico</span>;
            case 'manager': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">Gerente</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{role}</span>;
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-gray-500">Cadastre e gerencie técnicos e administradores do sistema</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-blue-600">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Usuário
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar por nome ou email..."
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
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Função</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">
                                        {user.active ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                <CheckCircle className="h-3 w-3" /> Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                                <XCircle className="h-3 w-3" /> Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(user)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(user.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <input
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {!editingUser && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Senha</label>
                                <input
                                    type="password"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        )}
                        {editingUser && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nova Senha (Opcional)</label>
                                <input
                                    type="password"
                                    placeholder="Deixe em branco para manter a atual"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Função</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="technician">Técnico</option>
                                    <option value="supervisor_tecnico">Supervisor Técnico</option>
                                    <option value="admin">Administrador</option>
                                    <option value="manager">Gerente</option>
                                    <option value="receptionist">Recepcionista</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                    value={formData.active ? 'true' : 'false'}
                                    onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                                >
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
