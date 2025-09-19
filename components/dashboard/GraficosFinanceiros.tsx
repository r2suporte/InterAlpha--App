"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts"

interface GraficosFinanceirosProps {
  className?: string
}

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

// Dados simulados para os gráficos
const dadosReceita = [
  { mes: 'Jul', receita: 28000, despesas: 15000 },
  { mes: 'Ago', receita: 31000, despesas: 16500 },
  { mes: 'Set', receita: 29500, despesas: 14800 },
  { mes: 'Out', receita: 33000, despesas: 17200 },
  { mes: 'Nov', receita: 36500, despesas: 18000 },
  { mes: 'Dez', receita: 34000, despesas: 16800 },
  { mes: 'Jan', receita: 35000, despesas: 17500 }
]

const dadosFormasPagamento = [
  { nome: 'PIX', valor: 15750, cor: '#10B981' },
  { nome: 'Cartão Crédito', valor: 11200, cor: '#3B82F6' },
  { nome: 'Dinheiro', valor: 6300, cor: '#F59E0B' },
  { nome: 'Cartão Débito', valor: 1750, cor: '#EF4444' }
]

const dadosStatusOrdens = [
  { status: 'Pagas', quantidade: 156, valor: 35000 },
  { status: 'Aguardando Pagamento', quantidade: 12, valor: 28000 },
  { status: 'Orçamento Pendente', quantidade: 7, valor: 15000 },
  { status: 'Canceladas', quantidade: 3, valor: 2500 }
]

const CORES_GRAFICOS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

export function GraficosFinanceiros({ className = '' }: GraficosFinanceirosProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {/* Gráfico de Receita vs Despesas */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Receita vs Despesas
            <Badge variant="outline" className="text-green-600 border-green-200">
              +12.5% este mês
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dadosReceita}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="mes" 
                axisLine={false}
                tickLine={false}
                className="text-sm text-gray-500"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-sm text-gray-500"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), '']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="receita" 
                stackId="1"
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.6}
                name="Receita"
              />
              <Area 
                type="monotone" 
                dataKey="despesas" 
                stackId="2"
                stroke="#EF4444" 
                fill="#EF4444"
                fillOpacity={0.6}
                name="Despesas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Formas de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosFormasPagamento}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="valor"
              >
                {dadosFormasPagamento.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {dadosFormasPagamento.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.cor }}
                  />
                  <span className="text-gray-600">{item.nome}</span>
                </div>
                <span className="font-medium">{formatarMoeda(item.valor)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Status das Ordens */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Status das Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosStatusOrdens}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="status" 
                axisLine={false}
                tickLine={false}
                className="text-sm text-gray-500"
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                className="text-sm text-gray-500"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                className="text-sm text-gray-500"
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'valor' ? formatarMoeda(value) : value,
                  name === 'valor' ? 'Valor Total' : 'Quantidade'
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="quantidade" 
                fill="#3B82F6" 
                name="Quantidade"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
              />
              <Bar 
                dataKey="valor" 
                fill="#10B981" 
                name="Valor (R$)"
                radius={[4, 4, 0, 0]}
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}