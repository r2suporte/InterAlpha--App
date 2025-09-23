import { TrendingDownIcon, TrendingUpIcon, FileText, Users, Wrench, DollarSign } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">
                Ordens de Serviço
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              <TrendingUpIcon className="size-3 mr-1" />
              +8.2%
            </Badge>
          </div>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-bold tabular-nums text-blue-900 dark:text-blue-100">
            247
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium text-blue-800 dark:text-blue-200">
            +18 este mês <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-blue-600/70 dark:text-blue-400/70">
            Total de ordens abertas
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardDescription className="text-emerald-700 dark:text-emerald-300 font-medium">
                Clientes Ativos
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
              <TrendingUpIcon className="size-3 mr-1" />
              +12.5%
            </Badge>
          </div>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
            1,234
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium text-emerald-800 dark:text-emerald-200">
            +142 novos clientes <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-emerald-600/70 dark:text-emerald-400/70">
            Base de clientes crescendo
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-400/10">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardDescription className="text-amber-700 dark:text-amber-300 font-medium">
                Em Andamento
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300">
              <TrendingDownIcon className="size-3 mr-1" />
              -5.2%
            </Badge>
          </div>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
            89
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium text-amber-800 dark:text-amber-200">
            Tempo médio: 3.2 dias <Wrench className="size-4" />
          </div>
          <div className="text-amber-600/70 dark:text-amber-400/70">
            Serviços sendo executados
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 dark:bg-violet-400/10">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <CardDescription className="text-violet-700 dark:text-violet-300 font-medium">
                Receita Mensal
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-violet-200 text-violet-700 dark:border-violet-700 dark:text-violet-300">
              <TrendingUpIcon className="size-3 mr-1" />
              +15.8%
            </Badge>
          </div>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-bold tabular-nums text-violet-900 dark:text-violet-100">
            R$ 45.2K
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
          <div className="line-clamp-1 flex gap-2 font-medium text-violet-800 dark:text-violet-200">
            Meta: R$ 50K <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-violet-600/70 dark:text-violet-400/70">
            90% da meta mensal
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
