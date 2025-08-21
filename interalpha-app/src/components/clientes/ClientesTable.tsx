'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Loader2, Plus } from 'lucide-react'
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
import ClientesActions from '@/components/clientes/ClientesActions'

interface ClientesTableProps {
  query?: string
}

interface Cliente {
  id: string
  numeroSequencial: number
  nome: string
  email: string
  telefone: string
  documento: string
  tipoDocumento: 'CPF' | 'CNPJ'
  cidade: string
  estado: string
  _count: {
    ordensServico: number
  }
}

export default function ClientesTable({ query }: ClientesTableProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClientes() {
      try {
        setIsLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        
        if (query) {
          params.set('search', query)
        }

        const response = await fetch(`/api/clientes?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          throw new Error(`Erro ao carregar clientes: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setClientes(result.data || [])
        } else {
          throw new Error(result.error || 'Erro desconhecido')
        }
      } catch (err) {
        console.error('Erro ao buscar clientes:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar clientes')
        setClientes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientes()
  }, [query])

  const formatPhone = (phone: string) => {
    if (!phone) return '-'
    // Aplicar máscara (11) 99999-9999
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  const formatDocument = (document: string, type: 'CPF' | 'CNPJ') => {
    if (!document) return '-'
    const numbers = document.replace(/\D/g, '')
    
    if (type === 'CPF' && numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (type === 'CNPJ' && numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    
    return document
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <Users className="mx-auto h-12 w-12 text-red-400 mb-4" />
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

  if (clientes.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {query 
            ? 'Tente buscar com outros termos.' 
            : 'Comece criando um novo cliente.'
          }
        </p>
        {!query && (
          <div className="mt-6">
            <Link href="/clientes/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
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
          <TableHead>ID</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead>O.S.</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-mono text-sm">
              #{cliente.numeroSequencial.toString().padStart(6, '0')}
            </TableCell>
            <TableCell className="font-medium">
              <Link 
                href={`/clientes/${cliente.id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {cliente.nome}
              </Link>
            </TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>
              {formatPhone(cliente.telefone)}
            </TableCell>
            <TableCell>
              {formatDocument(cliente.documento, cliente.tipoDocumento)}
            </TableCell>
            <TableCell>{cliente.cidade || '-'}</TableCell>
            <TableCell>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {cliente._count.ordensServico}
              </span>
            </TableCell>
            <TableCell>
              <ClientesActions clienteId={cliente.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}