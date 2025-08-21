'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import PagamentoActions from '@/components/pagamentos/PagamentoActions'
import StatusPagamentoBadge from '@/components/pagamentos/StatusPagamentoBadge'
import MetodoPagamentoBadge from '@/components/pagamentos/MetodoPagamentoBadge'

interface PagamentosTableProps {
  query?: string
  status?: string
  metodo?: string
}

interface Pagamento {
  id: string
  valor: number
  status: string
  metodo: string
  dataVencimento?: string
  dataPagamento?: string
  ordemServico?: {
    id: string
    titulo: string
    cliente?: {
      id: string
      nome: string
    }
  }
}

export default function PagamentosTable({ query, status, metodo }: PagamentosTableProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  useEffect(() => {
    async function fetchPagamentos() {
      try {
        setIsLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        
        if (query) {
          params.set('search', query)
        }
        
        if (status && status !== 'all') {
          params.set('status', status)
        }

        if (metodo && metodo !== 'all') {
          params.set('metodo', metodo)
        }

        const response = await fetch(`/api/pagamentos?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar pagamentos: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setPagamentos(result.data || [])
        } else {
          throw new Error(result.error || 'Erro desconhecido')
        }
      } catch (err) {
        console.error('Erro ao buscar pagamentos:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos')
        setPagamentos([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPagamentos()
  }, [query, status, metodo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando pagamentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <DollarSign className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro ao carregar</h3>
            <p className="mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pagamentos.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query || status || metodo ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento cadastrado'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query || status || metodo 
            ? 'Tente buscar com outros termos ou filtros.' 
            : 'Comece registrando um novo pagamento.'
          }
        </p>
        {!query && !status && !metodo && (
          <div className="mt-6">
            <Link href="/pagamentos/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pagamento
              </Button>
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Ordem de Serviço</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagamentos.map((pagamento) => (
          <TableRow key={pagamento.id}>
            <TableCell className="font-medium">
              {formatCurrency(pagamento.valor)}
            </TableCell>
            <TableCell>
              <StatusPagamentoBadge status={pagamento.status} />
            </TableCell>
            <TableCell>
              <MetodoPagamentoBadge metodo={pagamento.metodo} />
            </TableCell>
            <TableCell>
              {pagamento.ordemServico ? (
                <Link 
                  href={`/ordens-servico/${pagamento.ordemServico.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {pagamento.ordemServico.titulo}
                </Link>
              ) : (
                <span className="text-gray-500">Avulso</span>
              )}
            </TableCell>
            <TableCell>
              {pagamento.ordemServico?.cliente ? (
                <Link 
                  href={`/clientes/${pagamento.ordemServico.cliente.id}`}
                  className="text-gray-900 hover:text-blue-600"
                >
                  {pagamento.ordemServico.cliente.nome}
                </Link>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              {formatDate(pagamento.dataVencimento)}
            </TableCell>
            <TableCell>
              {formatDate(pagamento.dataPagamento)}
            </TableCell>
            <TableCell>
              <PagamentoActions pagamentoId={pagamento.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}