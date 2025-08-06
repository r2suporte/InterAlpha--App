interface PrioridadeBadgeProps {
  prioridade: string
}

const prioridadeConfig = {
  BAIXA: {
    label: 'Baixa',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  MEDIA: {
    label: 'Média',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ALTA: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  URGENTE: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export default function PrioridadeBadge({ prioridade }: PrioridadeBadgeProps) {
  const config = prioridadeConfig[prioridade as keyof typeof prioridadeConfig] || prioridadeConfig.MEDIA

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}