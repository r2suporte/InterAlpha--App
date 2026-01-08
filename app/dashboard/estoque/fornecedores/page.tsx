'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Edit,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Truck,
    Phone,
    Mail,
    MapPin,
    FileText,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ResponsiveContainer,
    ResponsiveText,
    useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/toast-system';

interface Fornecedor {
    id: string;
    nome: string;
    cpf_cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    observacoes?: string;
}

export default function FornecedoresPage() {
    const { isMobile } = useBreakpoint();
    const { success, error } = useToast();
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [dialogAberto, setDialogAberto] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [novoFornecedor, setNovoFornecedor] = useState({
        nome: '',
        cpf_cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        observacoes: '',
    });

    const fetchFornecedores = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (busca) params.append('search', busca);

            const response = await fetch(`/api/estoque/fornecedores?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao carregar fornecedores');

            const data = await response.json();
            setFornecedores(data);
        } catch (err) {
            console.error(err);
            error('Erro', 'Não foi possível carregar os fornecedores.');
        } finally {
            setLoading(false);
        }
    }, [busca, error]);

    useEffect(() => {
        fetchFornecedores();
    }, [fetchFornecedores]);

    const handleSalvarFornecedor = async () => {
        if (!novoFornecedor.nome) {
            error('Erro', 'O nome do fornecedor é obrigatório.');
            return;
        }

        try {
            const url = editingId
                ? `/api/estoque/fornecedores/${editingId}`
                : '/api/estoque/fornecedores';

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoFornecedor),
            });

            if (!response.ok) throw new Error('Falha ao salvar fornecedor');

            success('Sucesso', `Fornecedor ${editingId ? 'atualizado' : 'criado'} com sucesso!`);

            setDialogAberto(false);
            resetForm();
            fetchFornecedores();
        } catch (err) {
            console.error(err);
            error('Erro', 'Erro ao salvar fornecedor.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const response = await fetch(`/api/estoque/fornecedores/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Falha ao excluir fornecedor');
            }

            success('Sucesso', 'Fornecedor excluído com sucesso.');
            fetchFornecedores();
        } catch (err: any) {
            console.error(err);
            error('Erro', err.message || 'Erro ao excluir fornecedor.');
        }
    };

    const handleEdit = (fornecedor: Fornecedor) => {
        setEditingId(fornecedor.id);
        setNovoFornecedor({
            nome: fornecedor.nome,
            cpf_cnpj: fornecedor.cpf_cnpj || '',
            email: fornecedor.email || '',
            telefone: fornecedor.telefone || '',
            endereco: fornecedor.endereco || '',
            observacoes: fornecedor.observacoes || '',
        });
        setDialogAberto(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setNovoFornecedor({
            nome: '',
            cpf_cnpj: '',
            email: '',
            telefone: '',
            endereco: '',
            observacoes: '',
        });
    };

    return (
        <SidebarProvider>
            <EnhancedSidebar />
            <div className="flex w-full flex-1 flex-col bg-background">
                <SiteHeader />
                <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-4">
                        <BackButton href="/dashboard" />
                        <div>
                            <ResponsiveText
                                size={isMobile ? '2xl' : '3xl'}
                                className="font-bold tracking-tight"
                            >
                                Fornecedores
                            </ResponsiveText>
                            <ResponsiveText size="sm" className="text-muted-foreground">
                                Gerencie seus parceiros e fornecedores
                            </ResponsiveText>
                        </div>
                    </div>

                    {/* Ações e Filtros */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div>
                                    <CardTitle>Lista de Fornecedores</CardTitle>
                                    <CardDescription>
                                        {fornecedores.length} fornecedores cadastrados
                                    </CardDescription>
                                </div>
                                <button
                                    onClick={() => {
                                        resetForm();
                                        setDialogAberto(true);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Fornecedor
                                </button>

                                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                                            <DialogDescription>
                                                {editingId ? 'Edite os dados do fornecedor' : 'Cadastre um novo fornecedor'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="nome">Nome *</Label>
                                                <Input
                                                    id="nome"
                                                    placeholder="Nome da empresa ou pessoa"
                                                    value={novoFornecedor.nome}
                                                    onChange={e =>
                                                        setNovoFornecedor({ ...novoFornecedor, nome: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                                                    <Input
                                                        id="cpf_cnpj"
                                                        placeholder="00.000.000/0000-00"
                                                        value={novoFornecedor.cpf_cnpj}
                                                        onChange={e =>
                                                            setNovoFornecedor({ ...novoFornecedor, cpf_cnpj: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="telefone">Telefone</Label>
                                                    <Input
                                                        id="telefone"
                                                        placeholder="(00) 00000-0000"
                                                        value={novoFornecedor.telefone}
                                                        onChange={e =>
                                                            setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="contato@empresa.com"
                                                    value={novoFornecedor.email}
                                                    onChange={e =>
                                                        setNovoFornecedor({ ...novoFornecedor, email: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="endereco">Endereço</Label>
                                                <Input
                                                    id="endereco"
                                                    placeholder="Rua, Número, Bairro, Cidade"
                                                    value={novoFornecedor.endereco}
                                                    onChange={e =>
                                                        setNovoFornecedor({ ...novoFornecedor, endereco: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="observacoes">Observações</Label>
                                                <Input
                                                    id="observacoes"
                                                    placeholder="Informações adicionais"
                                                    value={novoFornecedor.observacoes}
                                                    onChange={e =>
                                                        setNovoFornecedor({ ...novoFornecedor, observacoes: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setDialogAberto(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleSalvarFornecedor}>
                                                    Salvar Fornecedor
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar fornecedores..."
                                        value={busca}
                                        onChange={e => setBusca(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-8 text-center text-muted-foreground">Carregando fornecedores...</div>
                                ) : (
                                    fornecedores.map(fornecedor => (
                                        <div
                                            key={fornecedor.id}
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-medium flex items-center gap-2">
                                                            <Truck className="h-4 w-4 text-primary" />
                                                            {fornecedor.nome}
                                                        </h3>
                                                        <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:gap-4">
                                                            {fornecedor.telefone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {fornecedor.telefone}
                                                                </span>
                                                            )}
                                                            {fornecedor.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {fornecedor.email}
                                                                </span>
                                                            )}
                                                            {fornecedor.endereco && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {fornecedor.endereco}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {fornecedor.cpf_cnpj && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                Documento: {fornecedor.cpf_cnpj}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(fornecedor)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(fornecedor.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))
                                )}
                                {!loading && fornecedores.length === 0 && (
                                    <div className="py-8 text-center">
                                        <p className="text-muted-foreground">
                                            Nenhum fornecedor encontrado
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </ResponsiveContainer>
            </div>
        </SidebarProvider>
    );
}
