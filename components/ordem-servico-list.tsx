'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Edit, 
  Eye, 
  FileText, 
  Mail, 
  MessageSquare, 
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface OrdemServico {
  id: string;
  numero_os: string;
  status: string;
  tipo_servico: string;
  valor_servico: number;
  valor_pecas: number;
  data_entrada: string;
  data_prevista_entrega?: string;
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
  };
  equipamento?: {
    tipo: string;
    modelo?: string;
  };
  problema_reportado?: string;
  created_at: string;
}

interface OrdemServicoListProps {
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onCreateNew?: () => void;
}

const statusColors: Record<string, string> = {
  'aguardando_diagnostico': 'bg-yellow-500',
  'em_diagnostico': 'bg-blue-500',
  'aguardando_aprovacao': 'bg-orange-500',
  'aguardando_pecas': 'bg-purple-500',
  'em_reparo': 'bg-cyan-500',
  'concluido': 'bg-green-500',
  'aguardando_retirada': 'bg-teal-500',
  'entregue': 'bg-gray-500',
  'cancelado': 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  'aguardando_diagnostico': 'Aguardando Diagnóstico',
  'em_diagnostico': 'Em Diagnóstico',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aguardando_pecas': 'Aguardando Peças',
  'em_reparo': 'Em Reparo',
  'concluido': 'Concluído',
  'aguardando_retirada': 'Aguardando Retirada',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado',
};

export function OrdemServicoList({ onEdit, onView, onCreateNew }: OrdemServicoListProps) {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'status'>('recent');

  useEffect(() => {
    loadOrdens();
  }, []);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ordens-servico');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar ordens de serviço');
      }

      const data = await response.json();
      setOrdens(data.ordens || []);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrdens = ordens
    .filter((ordem) => {
      // Filtro de busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        ordem.numero_os.toLowerCase().includes(searchLower) ||
        ordem.cliente?.nome?.toLowerCase().includes(searchLower) ||
        ordem.equipamento?.tipo?.toLowerCase().includes(searchLower) ||
        ordem.equipamento?.modelo?.toLowerCase().includes(searchLower);

      // Filtro de status
      const matchesStatus = statusFilter === 'all' || ordem.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: string) => {
    return {
      label: statusLabels[status] || status,
      color: statusColors[status] || 'bg-gray-500',
    };
  };

  const handleSendEmail = async (ordemId: string) => {
    try {
      toast.loading('Enviando email...');
      const response = await fetch(`/api/ordens-servico/${ordemId}/email`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao enviar email');

      toast.success('Email enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar email');
    }
  };

  const handleSendWhatsApp = async (ordemId: string) => {
    try {
      toast.loading('Enviando WhatsApp...');
      const response = await fetch(`/api/ordens-servico/${ordemId}/whatsapp`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao enviar WhatsApp');

      toast.success('WhatsApp enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar WhatsApp');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando ordens de serviço...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-2xl font-bold">
            Ordens de Serviço ({filteredOrdens.length})
          </CardTitle>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Ordem de Serviço
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid gap-4 pt-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por OS, cliente, equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="aguardando_diagnostico">Aguardando Diagnóstico</SelectItem>
              <SelectItem value="em_diagnostico">Em Diagnóstico</SelectItem>
              <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
              <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
              <SelectItem value="em_reparo">Em Reparo</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="aguardando_retirada">Aguardando Retirada</SelectItem>
              <SelectItem value="entregue">Entregue</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigas</SelectItem>
              <SelectItem value="status">Por status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredOrdens.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma ordem de serviço encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Crie sua primeira ordem de serviço clicando no botão acima'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdens.map((ordem) => {
                  const statusInfo = getStatusInfo(ordem.status);
                  const valorTotal = ordem.valor_servico + ordem.valor_pecas;

                  return (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium">{ordem.numero_os}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ordem.cliente?.nome}</div>
                          {ordem.cliente?.telefone && (
                            <div className="text-xs text-muted-foreground">
                              {ordem.cliente.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{ordem.equipamento?.tipo || 'N/A'}</div>
                          {ordem.equipamento?.modelo && (
                            <div className="text-xs text-muted-foreground">
                              {ordem.equipamento.modelo}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(valorTotal)}</TableCell>
                      <TableCell>{formatDate(ordem.data_entrada)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView?.(ordem.id)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit?.(ordem.id)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendEmail(ordem.id)}
                            title="Enviar Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendWhatsApp(ordem.id)}
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
