'use client'

import { useEffect, useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

interface ChartData {
  date: string
  auditLogs: number
  accessLogs: number
  securityEvents: number
}

interface AuditStatsChartProps {
  period: string
}

export function AuditStatsChart({ period }: AuditStatsChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [period])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/audit/stats?period=${period}&includeDetails=true`)
      const result = await response.json()
      
      if (result.success) {
        // Simular dados para o gráfico (substituir pela implementação real)
        const mockData = generateMockData(period)
        setData(mockData)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (period: string): ChartData[] => {
    const days = period === '24h' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 90
    const data: ChartData[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      data.push({
        date: period === '24h' 
          ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        auditLogs: Math.floor(Math.random() * 100) + 20,
        accessLogs: Math.floor(Math.random() * 50) + 10,
        securityEvents: Math.floor(Math.random() * 10)
      })
    }
    
    return data
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando gráfico...</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Data
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm">
                          {entry.name}: {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="auditLogs"
          stroke="#8884d8"
          strokeWidth={2}
          name="Logs de Auditoria"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="accessLogs"
          stroke="#82ca9d"
          strokeWidth={2}
          name="Logs de Acesso"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="securityEvents"
          stroke="#ff7c7c"
          strokeWidth={2}
          name="Eventos de Segurança"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}