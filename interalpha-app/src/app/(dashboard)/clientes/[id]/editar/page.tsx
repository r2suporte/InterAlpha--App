import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import ClienteForm from '@/components/clientes/ClienteForm'

interface EditarClientePageProps {
  params: Promise<{ id: string }>
}

async function getCliente(id: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        documento: true,
        tipoDocumento: true,
        cep: true,
        endereco: true,
        cidade: true,
        estado: true,
        observacoes: true,
      },
    })

    return cliente
  } catch (error) {
    return null
  }
}

export default async function EditarClientePage({ params }: EditarClientePageProps) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/clientes/${id}`}>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-gray-600 mt-2">
            Atualize as informações do cliente
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-6">
        <ClienteForm cliente={cliente} isEditing={true} />
      </div>
    </div>
  )
}