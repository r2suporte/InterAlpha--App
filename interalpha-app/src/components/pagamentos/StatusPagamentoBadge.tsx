interface StatusPagamentoBadgeProps {
  status: string
}

const statusConfig = {
  PENDENTE: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  PAGO: {
    label: 'Pago',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  ESTORNADO: {
    label: 'Estornado',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
}

export default function StatusPagamentoBadge({ status }: StatusPagamentoBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDENTE

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}