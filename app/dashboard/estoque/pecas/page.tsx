'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Edit,
    MoreVertical,
    Plus,
    Search,
    Trash2,
    Package,
    AlertTriangle,
    DollarSign,
    Tag,
    MapPin,
    Box,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ResponsiveContainer,
    ResponsiveText,
    useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/toast-system';

interface Peca {
    id: string;
    nome: string;
    codigo?: string;
    marca?: string;
    modelo?: string;
    quantidade: number;
    minimo: number;
    preco_custo: number; // Mapped from precoCusto in API response if needed, but Prisma uses mixedCase. API might return camelCase.
    preco_venda: number;
    precoCusto?: number;
    precoVenda?: number;
    localizacao?: string;
    fornecedor_id?: string;
    fornecedorId?: string;
    fornecedor?: {
        nome: string;
    }
}

interface Fornecedor {
    id: string;
    nome: string;
}

export default function PecasPage() {
    const { isMobile } = useBreakpoint();
    const { success, error } = useToast();
    const [pecas, setPecas] = useState<Peca[]>([]);
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [dialogAberto, setDialogAberto] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        marca: '',
        modelo: '',
        quantidade: 0,
        minimo: 1,
        preco_custo: 0,
        preco_venda: 0,
        localizacao: '',
        fornecedor_id: 'none', // Use string 'none' to represent null in Select
    });

    const fetchPecas = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (busca) params.append('search', busca);

            const response = await fetch(`/api/estoque/pecas?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao carregar peças');

            const data = await response.json();
            // Normalize data keys if necessary (Prisma returns camelCase, but our form uses snake_case for some)
            // Actually API response keys depend on how we return them. Prisma returns camelCase.
            // Let's normalize to camelCase for internal use if possible, or handle both.
            setPecas(data);
        } catch (err) {
            console.error(err);
            error('Erro', 'Não foi possível carregar o estoque.');
        } finally {
            setLoading(false);
        }
    }, [busca, error]);

    const fetchFornecedores = useCallback(async () => {
        try {
            const response = await fetch('/api/estoque/fornecedores');
            if (response.ok) {
                const data = await response.json();
                setFornecedores(data);
            }
        } catch (err) {
            console.error("Erro ao buscar fornecedores", err);
        }
    }, []);

    useEffect(() => {
        fetchPecas();
        fetchFornecedores();
    }, [fetchPecas, fetchFornecedores]);

    const handleSalvar = async () => {
        if (!formData.nome) {
            error('Erro', 'O nome da peça é obrigatório.');
            return;
        }

        try {
            const url = editingId
                ? `/api/estoque/pecas/${editingId}`
                : '/api/estoque/pecas';

            const method = editingId ? 'PUT' : 'POST';

            // Prepare payload
            const payload = {
                ...formData,
                fornecedor_id: formData.fornecedor_id === 'none' ? null : formData.fornecedor_id
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Falha ao salvar peça');

            success('Sucesso', `Peça ${editingId ? 'atualizada' : 'criada'} com sucesso!`);

            setDialogAberto(false);
            resetForm();
            fetchPecas();
        } catch (err) {
            console.error(err);
            error('Erro', 'Erro ao salvar peça.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

        try {
            const response = await fetch(`/api/estoque/pecas/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Falha ao excluir peça');

            success('Sucesso', 'Peça excluída com sucesso.');
            fetchPecas();
        } catch (err) {
            console.error(err);
            error('Erro', 'Erro ao excluir peça.');
        }
    };

    const handleEdit = (peca: Peca) => {
        setEditingId(peca.id);
        setFormData({
            nome: peca.nome,
            codigo: peca.codigo || '',
            marca: peca.marca || '',
            modelo: peca.modelo || '',
            quantidade: peca.quantidade,
            minimo: peca.minimo,
            preco_custo: peca.precoCusto ? Number(peca.precoCusto) : 0,
            preco_venda: peca.precoVenda ? Number(peca.precoVenda) : 0,
            localizacao: peca.localizacao || '',
            fornecedor_id: peca.fornecedorId || 'none',
        });
        setDialogAberto(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            nome: '',
            codigo: '',
            marca: '',
            modelo: '',
            quantidade: 0,
            minimo: 1,
            preco_custo: 0,
            preco_venda: 0,
            localizacao: '',
            fornecedor_id: 'none',
        });
    };

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
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
                                Controle de Estoque
                            </ResponsiveText>
                            <ResponsiveText size="sm" className="text-muted-foreground">
                                Gerencie peças, produtos e itens em estoque
                            </ResponsiveText>
                        </div>
                    </div>

                    {/* Cards de Resumo Rápido */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pecas.reduce((acc, p) => acc + p.quantidade, 0)}</div>
                                <p className="text-xs text-muted-foreground">Unidades em estoque</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(pecas.reduce((acc, p) => acc + (Number(p.precoCusto) * p.quantidade), 0))}
                                </div>
                                <p className="text-xs text-muted-foreground">Custo total do inventário</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {pecas.filter(p => p.quantidade <= p.minimo).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Itens abaixo do mínimo</p>
                            </CardContent>
                        </Card>
                    </div>


                    {/* Ações e Filtros */}
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                                <div>
                                    <CardTitle>Inventário</CardTitle>
                                    <CardDescription>
                                        {pecas.length} produtos cadastrados
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
                                    Nova Peça
                                </button>

                                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                                    <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                            <DialogTitle>{editingId ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
                                            <DialogDescription>
                                                {editingId ? 'Edite os dados do produto' : 'Cadastre um novo item ao estoque'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="nome">Nome do Produto *</Label>
                                                    <Input id="nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Tela iPhone 11" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="codigo">Código / SKU</Label>
                                                    <Input id="codigo" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} placeholder="SKU-123" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="marca">Marca</Label>
                                                    <Input id="marca" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} placeholder="Apple, Samsung..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="modelo">Modelo Compatível</Label>
                                                    <Input id="modelo" value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} placeholder="iPhone X, S20..." />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="quantidade">Estoque Atual</Label>
                                                    <Input type="number" id="quantidade" value={formData.quantidade} onChange={e => setFormData({ ...formData, quantidade: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="minimo">Estoque Mínimo</Label>
                                                    <Input type="number" id="minimo" value={formData.minimo} onChange={e => setFormData({ ...formData, minimo: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="custo">Preço Custo (R$)</Label>
                                                    <Input type="number" step="0.01" id="custo" value={formData.preco_custo} onChange={e => setFormData({ ...formData, preco_custo: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="venda">Preço Venda (R$)</Label>
                                                    <Input type="number" step="0.01" id="venda" value={formData.preco_venda} onChange={e => setFormData({ ...formData, preco_venda: Number(e.target.value) })} />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="localizacao">Localização Física</Label>
                                                    <Input id="localizacao" value={formData.localizacao} onChange={e => setFormData({ ...formData, localizacao: e.target.value })} placeholder="Prateleira A2" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="fornecedor">Fornecedor Principal</Label>
                                                    <Select
                                                        value={formData.fornecedor_id}
                                                        onValueChange={(val) => setFormData({ ...formData, fornecedor_id: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Nenhum / Desconhecido</SelectItem>
                                                            {fornecedores.map(f => (
                                                                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setDialogAberto(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleSalvar}>
                                                    Salvar Produto
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
                                        placeholder="Buscar por nome, código, modelo..."
                                        value={busca}
                                        onChange={e => setBusca(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-8 text-center text-muted-foreground">Carregando estoque...</div>
                                ) : (
                                    pecas.map(peca => (
                                        <div
                                            key={peca.id}
                                            className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg">{peca.nome}</h3>
                                                    {peca.quantidade <= peca.minimo && (
                                                        <span className="flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                            <AlertTriangle className="h-3 w-3" /> Baixo Estoque
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                    {peca.codigo && (
                                                        <span className="flex items-center gap-1">
                                                            <Tag className="h-3 w-3" /> SKU: {peca.codigo}
                                                        </span>
                                                    )}
                                                    {peca.modelo && (
                                                        <span className="flex items-center gap-1">
                                                            <Box className="h-3 w-3" /> Mod: {peca.modelo}
                                                        </span>
                                                    )}
                                                    {peca.localizacao && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" /> Loc: {peca.localizacao}
                                                        </span>
                                                    )}
                                                    {peca.fornecedor && (
                                                        <span className="flex items-center gap-1">
                                                            <Truck className="h-3 w-3" /> Forn: {peca.fornecedor.nome}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-6 md:justify-end">
                                                <div className="text-right">
                                                    <div className="text-sm text-muted-foreground">Preço Venda</div>
                                                    <div className="font-bold text-green-600">{formatCurrency(peca.precoVenda)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-muted-foreground">Estoque</div>
                                                    <div className={`font-bold ${peca.quantidade === 0 ? 'text-red-500' : ''}`}>
                                                        {peca.quantidade} un
                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(peca)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => handleDelete(peca.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {!loading && pecas.length === 0 && (
                                    <div className="py-8 text-center">
                                        <p className="text-muted-foreground">
                                            Nenhum produto encontrado no estoque.
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
