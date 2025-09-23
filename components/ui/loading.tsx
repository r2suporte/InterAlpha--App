"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "overlay" | "inline"
  text?: string
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-xl"
}

export function Loading({ 
  size = "md", 
  variant = "default", 
  text, 
  className 
}: LoadingProps) {
  const spinnerClasses = cn(
    "animate-spin text-muted-foreground",
    sizeClasses[size],
    className
  )

  const textClasses = cn(
    "text-muted-foreground mt-2",
    textSizeClasses[size]
  )

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className={spinnerClasses} />
          {text && <p className={textClasses}>{text}</p>}
        </div>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className={spinnerClasses} />
        {text && <span className={cn("text-muted-foreground", textSizeClasses[size])}>{text}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-4">
      <Loader2 className={spinnerClasses} />
      {text && <p className={textClasses}>{text}</p>}
    </div>
  )
}

// Componente específico para páginas
export function PageLoading({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text={text} />
    </div>
  )
}

// Componente específico para botões
export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  return <Loader2 className={cn("animate-spin", sizeClasses[size])} />
}