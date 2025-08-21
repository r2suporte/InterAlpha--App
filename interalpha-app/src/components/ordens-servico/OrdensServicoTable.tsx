'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Wrench, Loader2 } from 'lucide-react'
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
import OrdemServicoActions from '@/components/ordens-servico/OrdemServicoActions'
import StatusBadge from '@/components/ordens-servico/StatusBadge'
import PrioridadeBadge from '@/components/ordens-servico/PrioridadeBadge'

interface OrdensServicoTableProps {
  query?: string
  status?: string
}

interface OrdemServico {
  id: string
  titulo: string
  status: string
  prioridade: string
  valor?: number
  dataInicio?: string
  cliente?: {
    id: string
    nome: string
  }
}

export default function OrdensServicoTable({ query, status }: OrdensServicoTableProps) {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrdensServico() {
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

        const response = await fetch(`/api/ordens-servico?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar ordens: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setOrdensServico(result.data || [])
        } else {
          throw new Error(result.error || 'Erro desconhecido')
        }
      } catch (err) {
        console.error('Erro ao buscar ordens de serviço:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar ordens')
        setOrdensServico([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrdensServico()
  }, [query, status])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando ordens de serviço...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Wrench className="mx-auto h-12 w-12 text-red-400 mb-4" />
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

  if (ordensServico.length === 0) {
    return (
      <div className="text-center py-12">
        <Wrench className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query || status ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem de serviço cadastrada'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query || status 
            ? 'Tente buscar com outros termos ou filtros.' 
            : 'Comece criando uma nova ordem de serviço.'
          }
        </p>
        {!query && !status && (
          <div className="mt-6">
            <Link href="/ordens-servico/nova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova O.S.
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
          <TableHead>Título</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Data Início</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordensServico.map((ordem: any) => (
          <TableRow key={ordem.id}>
            <TableCell className="font-medium">
              <Link 
                href={`/ordens-servico/${ordem.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {ordem.titulo}
              </Link>
            </TableCell>
            <TableCell>
              <Link 
                href={`/clientes/${ordem.cliente?.id || '#'}`}
                className="text-gray-900 hover:text-blue-600"
              >
                {ordem.cliente?.nome || 'Cliente não encontrado'}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge status={ordem.status} />
            </TableCell>
            <TableCell>
              <PrioridadeBadge prioridade={ordem.prioridade} />
            </TableCell>
            <TableCell>
              {ordem.valor ? `R$ ${Number(ordem.valor).toFixed(2)}` : '-'}
            </TableCell>
            <TableCell>
              {ordem.dataInicio 
                ? new Date(ordem.dataInicio).toLocaleDateString('pt-BR')
                : '-'
              }
            </TableCell>
            <TableCell>
              <OrdemServicoActions ordemId={ordem.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}