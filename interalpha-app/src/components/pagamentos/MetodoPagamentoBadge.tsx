interface MetodoPagamentoBadgeProps {
  metodo: string
}

const metodoConfig = {
  DINHEIRO: {
    label: 'Dinheiro',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  PIX: {
    label: 'PIX',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  CARTAO_CREDITO: {
    label: 'Cartão de Crédito',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  CARTAO_DEBITO: {
    label: 'Cartão de Débito',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  TRANSFERENCIA: {
    label: 'Transferência',
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  BOLETO: {
    label: 'Boleto',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
}

export default function MetodoPagamentoBadge({ metodo }: MetodoPagamentoBadgeProps) {
  const config = metodoConfig[metodo as keyof typeof metodoConfig] || metodoConfig.DINHEIRO

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  )
}