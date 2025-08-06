interface StatusBadgeProps {
  status: string
}

const statusConfig = {
  PENDENTE: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  CONCLUIDA: {
    label: 'Concluída',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELADA: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDENTE

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}