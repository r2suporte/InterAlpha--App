'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  marca: string;
  quantidade: number;
  minimo: number;
  precoCusto: number;
  precoVenda: number;
  localizacao: string;
}

export default function InventoryPage() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    marca: '',
    modelo: '',
    quantidade: 0,
    minimo: 5,
    precoCusto: 0,
    precoVenda: 0,
    localizacao: ''
  });

  useEffect(() => {
    fetchPecas();
  }, [search]);

  const fetchPecas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pecas?search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setPecas(data);
      }
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPeca(null);
    setFormData({
      nome: '',
      codigo: '',
      marca: '',
      modelo: '',
      quantidade: 0,
      minimo: 5,
      precoCusto: 0,
      precoVenda: 0,
      localizacao: ''
    });
  };

  const handleSave = async () => {
    try {
      const url = editingPeca ? `/api/pecas/${editingPeca.id}` : '/api/pecas';
      const method = editingPeca ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchPecas();
        resetForm();
      } else {
        alert('Erro ao salvar.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir peça?')) return;
    await fetch(`/api/pecas/${id}`, { method: 'DELETE' });
    fetchPecas();
  };

  const openValid = (peca: Peca) => {
    setEditingPeca(peca);
    setFormData({
      nome: peca.nome,
      codigo: peca.codigo || '',
      marca: peca.marca || '',
      modelo: '', // missing in list type but okay
      quantidade: peca.quantidade,
      minimo: peca.minimo,
      precoCusto: Number(peca.precoCusto),
      precoVenda: Number(peca.precoVenda),
      localizacao: peca.localizacao || ''
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Estoque de Peças
          </h1>
          <p className="text-gray-500">Gerencie componentes, preços e alertas de estoque</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Nova Peça
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por nome, código ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards (Optional future enhancement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-white rounded-full text-orange-600 shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Estoque Baixo</p>
              <p className="text-2xl font-bold text-gray-900">
                {pecas.filter(p => p.quantidade <= p.minimo).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Código/Marca</th>
              <th className="px-6 py-3">Preço Venda</th>
              <th className="px-6 py-3">Estoque</th>
              <th className="px-6 py-3">Local</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
            ) : pecas.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhuma peça cadastrada.</td></tr>
            ) : (
              pecas.map(peca => {
                const isLow = peca.quantidade <= peca.minimo;
                return (
                  <tr key={peca.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{peca.nome}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="text-xs">{peca.codigo}</div>
                      <div>{peca.marca}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      R$ {Number(peca.precoVenda).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isLow ? 'text-orange-600 font-bold' : 'text-green-600'}`}>
                        {peca.quantidade} un.
                        {isLow && <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="text-xs text-gray-400">Min: {peca.minimo}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{peca.localizacao || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openValid(peca)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(peca.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPeca ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Nome do Item</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Código (SKU)</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.codigo}
                onChange={e => setFormData({ ...formData, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.marca}
                onChange={e => setFormData({ ...formData, marca: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preço Custo</label>
              <input
                type="number" step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.precoCusto}
                onChange={e => setFormData({ ...formData, precoCusto: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço Venda</label>
              <input
                type="number" step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.precoVenda}
                onChange={e => setFormData({ ...formData, precoVenda: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade Atual</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.quantidade}
                onChange={e => setFormData({ ...formData, quantidade: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.minimo}
                onChange={e => setFormData({ ...formData, minimo: Number(e.target.value) })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Localização Física</label>
              <input
                placeholder="Ex: Prateleira A, Gaveta 2"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={formData.localizacao}
                onChange={e => setFormData({ ...formData, localizacao: e.target.value })}
              />
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
