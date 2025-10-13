'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  Wrench,
  XCircle,
} from 'lucide-react';

import { PageLoading } from '@/components/ui/loading';
import { useLoadingState } from '@/components/ui/loading-states';
import { useToast } from '@/components/ui/toast-system';

interface OrdemServico {
  id: string;
  numero_os: string;
  status: string;
  descricao: string;
  valor: number;
  data_inicio: string;
  data_fim: string | null;
  created_at: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
  };
  equipamento?: {
    marca: string;
    modelo: string;
    numero_serie: string;
  };
}

interface Aprovacao {
  id: string;
  tipo: string;
  descricao: string;
  valor: number | null;
  status: string;
  observacoes_cliente: string | null;
  aprovado_em: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  login: string;
}

export default function OrdemServicoDetalhes() {
  const [ordemServico, setOrdemServico] = useState<OrdemServico | null>(null);
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const { error: showError, success } = useToast();
  const [error, setError] = useState('');
  const [processando, setProcessando] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      carregarDados();
    }
  }, [params.id]);

  const carregarDados = async () => {
    try {
      startLoading();

      // Verificar autenticação
      const authResponse = await fetch('/api/auth/cliente/me');
      if (!authResponse.ok) {
        router.push('/portal/cliente/login');
        return;
      }

      const authData = await authResponse.json();
      setCliente(authData.cliente);

      // Carregar dados da ordem de serviço
      const response = await fetch(`/api/portal/cliente/ordem/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        setOrdemServico(data.ordem_servico);
        setAprovacoes(data.aprovacoes || []);
      } else if (response.status === 404) {
        const errorMessage = 'Ordem de serviço não encontrada';
        setError(errorMessage);
        showError('Erro', errorMessage);
      } else if (response.status === 403) {
        const errorMessage =
          'Você não tem permissão para acessar esta ordem de serviço';
        setError(errorMessage);
        showError('Acesso negado', errorMessage);
      } else {
        const errorMessage = 'Erro ao carregar dados';
        setError(errorMessage);
        showError('Erro', errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Erro ao carregar dados';
      setError(errorMessage);
      showError('Erro', errorMessage);
    } finally {
      stopLoading();
    }
  };

  const handleAprovacao = async (
    aprovacaoId: string,
    acao: 'aprovar' | 'rejeitar',
    observacoes?: string
  ) => {
    try {
      setProcessando(aprovacaoId);

      const response = await fetch(
        `/api/portal/cliente/aprovacao/${aprovacaoId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            acao,
            observacoes,
          }),
        }
      );

      if (response.ok) {
        // Recarregar dados para atualizar status
        await carregarDados();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao processar aprovação');
      }
    } catch (error) {
      setError('Erro ao processar aprovação');
    } finally {
      setProcessando(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'concluida':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'aprovado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'expirado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      case 'expirado':
        return 'Expirado';
      default:
        return status;
    }
  };

  const formatTipoAprovacao = (tipo: string) => {
    switch (tipo) {
      case 'orcamento':
        return 'Orçamento';
      case 'servico_adicional':
        return 'Serviço Adicional';
      case 'forma_pagamento':
        return 'Forma de Pagamento';
      case 'prazo_entrega':
        return 'Prazo de Entrega';
      default:
        return tipo;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAprovacaoExpirada = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <PageLoading text="Carregando ordem de serviço..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <p className="mb-4 text-lg text-red-600 dark:text-red-400">{error}</p>
          <Link
            href="/portal/cliente/dashboard"
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!ordemServico) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-2xl font-bold text-blue-600 dark:text-blue-400"
              >
                InterAlpha
              </Link>
              <span className="ml-4 text-gray-500 dark:text-gray-400">|</span>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                Portal do Cliente
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Olá, {cliente?.nome}
              </span>
              <Link
                href="/portal/cliente/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/portal/cliente/dashboard"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </div>

          {/* Cabeçalho da OS */}
          <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Ordem de Serviço #{ordemServico.numero_os}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Criada em {formatDate(ordemServico.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(ordemServico.status)}`}
                >
                  {formatStatus(ordemServico.status)}
                </span>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Valor
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(ordemServico.valor)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Data de Início
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(ordemServico.data_inicio)}
                    </p>
                  </div>
                </div>

                {ordemServico.data_fim && (
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Data de Conclusão
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(ordemServico.data_fim)}
                      </p>
                    </div>
                  </div>
                )}

                {ordemServico.equipamento && (
                  <div className="flex items-center">
                    <Wrench className="mr-2 h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Equipamento
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {ordemServico.equipamento.marca}{' '}
                        {ordemServico.equipamento.modelo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição do Serviço */}
          <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Descrição do Serviço
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {ordemServico.descricao}
              </p>
            </div>
          </div>

          {/* Aprovações Pendentes */}
          {aprovacoes.length > 0 && (
            <div className="mb-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Aprovações
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Itens que requerem sua aprovação
                </p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {aprovacoes.map(aprovacao => (
                  <div key={aprovacao.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center">
                          <h3 className="mr-3 text-lg font-medium text-gray-900 dark:text-white">
                            {formatTipoAprovacao(aprovacao.tipo)}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(aprovacao.status)}`}
                          >
                            {formatStatus(aprovacao.status)}
                          </span>
                        </div>

                        <p className="mb-3 text-gray-700 dark:text-gray-300">
                          {aprovacao.descricao}
                        </p>

                        {aprovacao.valor && (
                          <p className="mb-3 text-lg font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(aprovacao.valor)}
                          </p>
                        )}

                        {aprovacao.expires_at && (
                          <p
                            className={`mb-3 text-sm ${isAprovacaoExpirada(aprovacao.expires_at) ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {isAprovacaoExpirada(aprovacao.expires_at)
                              ? 'Expirado em'
                              : 'Expira em'}
                            : {formatDate(aprovacao.expires_at)}
                          </p>
                        )}

                        {aprovacao.observacoes_cliente && (
                          <div className="mb-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                              Suas observações:
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              {aprovacao.observacoes_cliente}
                            </p>
                          </div>
                        )}

                        {aprovacao.aprovado_em && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {aprovacao.status === 'aprovado'
                              ? 'Aprovado'
                              : 'Rejeitado'}{' '}
                            em {formatDate(aprovacao.aprovado_em)}
                          </p>
                        )}
                      </div>

                      {aprovacao.status === 'pendente' &&
                        !isAprovacaoExpirada(aprovacao.expires_at) && (
                          <div className="ml-6 flex flex-col space-y-2">
                            <button
                              onClick={() =>
                                handleAprovacao(aprovacao.id, 'aprovar')
                              }
                              disabled={processando === aprovacao.id}
                              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processando === aprovacao.id ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Aprovar
                            </button>
                            <button
                              onClick={() =>
                                handleAprovacao(aprovacao.id, 'rejeitar')
                              }
                              disabled={processando === aprovacao.id}
                              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {processando === aprovacao.id ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
                              Rejeitar
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações de Contato */}
          <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Informações de Contato
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex items-center">
                  <User className="mr-3 h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nome
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ordemServico.cliente.nome}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ordemServico.cliente.email}
                    </p>
                  </div>
                </div>

                {ordemServico.cliente.telefone && (
                  <div className="flex items-center">
                    <Phone className="mr-3 h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Telefone
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ordemServico.cliente.telefone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
