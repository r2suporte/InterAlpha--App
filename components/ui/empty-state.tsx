"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  Users, 
  Package, 
  Wrench, 
  Search,
  Plus,
  AlertCircle,
  Inbox,
  Database,
  Filter
} from "lucide-react"

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: {
    container: "py-8",
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm",
    spacing: "space-y-3"
  },
  md: {
    container: "py-12",
    icon: "h-16 w-16", 
    title: "text-xl",
    description: "text-base",
    spacing: "space-y-4"
  },
  lg: {
    container: "py-16",
    icon: "h-20 w-20",
    title: "text-2xl", 
    description: "text-lg",
    spacing: "space-y-6"
  }
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md"
}: EmptyStateProps) {
  const sizeConfig = sizeClasses[size]

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeConfig.container,
      className
    )}>
      <div className={cn("flex flex-col items-center", sizeConfig.spacing)}>
        <div className="rounded-full bg-muted p-4">
          <Icon className={cn("text-muted-foreground", sizeConfig.icon)} />
        </div>
        
        <div className="space-y-2">
          <h3 className={cn("font-semibold text-foreground", sizeConfig.title)}>
            {title}
          </h3>
          {description && (
            <p className={cn("text-muted-foreground max-w-md", sizeConfig.description)}>
              {description}
            </p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {action && (
              <Button 
                onClick={action.onClick}
                variant={action.variant || "default"}
                size={size === "sm" ? "sm" : "default"}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick}
                variant="outline"
                size={size === "sm" ? "sm" : "default"}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes específicos para diferentes contextos
export function NoClientsFound({ onAddClient }: { onAddClient?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum cliente encontrado"
      description="Você ainda não possui clientes cadastrados. Comece adicionando seu primeiro cliente."
      action={onAddClient ? {
        label: "Adicionar Cliente",
        onClick: onAddClient
      } : undefined}
    />
  )
}

export function NoOrdersFound({ onCreateOrder }: { onCreateOrder?: () => void }) {
  return (
    <EmptyState
      icon={Wrench}
      title="Nenhuma ordem de serviço encontrada"
      description="Não há ordens de serviço para exibir. Crie uma nova ordem para começar."
      action={onCreateOrder ? {
        label: "Nova Ordem de Serviço",
        onClick: onCreateOrder
      } : undefined}
    />
  )
}

export function NoPartsFound({ onAddPart }: { onAddPart?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhuma peça encontrada"
      description="Seu estoque está vazio. Adicione peças para começar a gerenciar seu inventário."
      action={onAddPart ? {
        label: "Adicionar Peça",
        onClick: onAddPart
      } : undefined}
    />
  )
}

export function NoSearchResults({ 
  searchTerm, 
  onClearSearch 
}: { 
  searchTerm: string
  onClearSearch?: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${searchTerm}". Tente ajustar sua pesquisa.`}
      action={onClearSearch ? {
        label: "Limpar Pesquisa",
        onClick: onClearSearch,
        variant: "outline"
      } : undefined}
      size="sm"
    />
  )
}

export function NoFilterResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="Nenhum resultado com os filtros aplicados"
      description="Tente ajustar ou remover alguns filtros para ver mais resultados."
      action={onClearFilters ? {
        label: "Limpar Filtros",
        onClick: onClearFilters,
        variant: "outline"
      } : undefined}
      size="sm"
    />
  )
}

export function ErrorState({ 
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Tentar Novamente",
        onClick: onRetry
      } : undefined}
    />
  )
}