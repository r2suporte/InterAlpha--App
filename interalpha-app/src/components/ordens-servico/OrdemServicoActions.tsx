'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface OrdemServicoActionsProps {
  ordemId: string
}

export default function OrdemServicoActions({ ordemId }: OrdemServicoActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/ordens-servico/${ordemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir ordem de serviço')
      }

      // Recarregar a página para atualizar a lista
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir ordem:', error)
      alert('Erro ao excluir ordem de serviço')
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {showMenu && (
        <>
          {/* Overlay para fechar o menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
            <Link
              href={`/ordens-servico/${ordemId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowMenu(false)}
            >
              <Eye className="h-4 w-4" />
              Ver detalhes
            </Link>
            
            <Link
              href={`/ordens-servico/${ordemId}/editar`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setShowMenu(false)}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}