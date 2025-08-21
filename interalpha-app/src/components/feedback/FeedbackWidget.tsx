'use client'

/**
 * Widget de feedback para coleta de opinião dos usuários
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Star, 
  Send, 
  X, 
  ThumbsUp, 
  ThumbsDown,
  Bug,
  Lightbulb,
  Zap
} from 'lucide-react'
import { feedbackService } from '@/services/feedback-service'
import { toast } from 'sonner'

interface FeedbackWidgetProps {
  page?: string
  feature?: string
  className?: string
}

type FeedbackType = 'bug' | 'suggestion' | 'compliment' | 'general'
type Rating = 1 | 2 | 3 | 4 | 5

export function FeedbackWidget({ 
  page = 'unknown', 
  feature = 'general',
  className = '' 
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'rating' | 'type' | 'details' | 'success'>('rating')
  const [rating, setRating] = useState<Rating | null>(null)
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Auto-detectar página atual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPage = window.location.pathname
      // Atualizar contexto baseado na URL
    }
  }, [])

  const feedbackTypes = [
    {
      type: 'bug' as FeedbackType,
      label: 'Reportar Bug',
      icon: Bug,
      color: 'bg-red-100 text-red-700 hover:bg-red-200',
      description: 'Algo não está funcionando como esperado'
    },
    {
      type: 'suggestion' as FeedbackType,
      label: 'Sugestão',
      icon: Lightbulb,
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      description: 'Ideia para melhorar o sistema'
    },
    {
      type: 'compliment' as FeedbackType,
      label: 'Elogio',
      icon: ThumbsUp,
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
      description: 'Algo que você gostou'
    },
    {
      type: 'general' as FeedbackType,
      label: 'Geral',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      description: 'Feedback geral sobre o sistema'
    }
  ]

  const handleRatingSelect = (selectedRating: Rating) => {
    setRating(selectedRating)
    setStep('type')
  }

  const handleTypeSelect = (type: FeedbackType) => {
    setFeedbackType(type)
    setStep('details')
  }

  const handleSubmit = async () => {
    if (!rating || !feedbackType || !message.trim()) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    setIsSubmitting(true)

    try {
      await feedbackService.submitFeedback({
        rating,
        type: feedbackType,
        message: message.trim(),
        page,
        feature,
        userEmail: userEmail.trim() || undefined,
        userAgent: navigator.userAgent,
        timestamp: new Date(),
        metadata: {
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      })

      setStep('success')
      toast.success('Feedback enviado com sucesso!')
      
      // Reset após 3 segundos
      setTimeout(() => {
        handleClose()
      }, 3000)

    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
      toast.error('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('rating')
    setRating(null)
    setFeedbackType(null)
    setMessage('')
    setUserEmail('')
  }

  const renderRatingStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">
          Como você avalia sua experiência?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sua opinião nos ajuda a melhorar o sistema
        </p>
      </div>
      
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingSelect(star as Rating)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-8 h-8 ${
                rating && star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        {rating && (
          <span>
            {rating === 1 && 'Muito ruim'}
            {rating === 2 && 'Ruim'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bom'}
            {rating === 5 && 'Excelente'}
          </span>
        )}
      </div>
    </div>
  )

  const renderTypeStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">
          Que tipo de feedback você gostaria de dar?
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {feedbackTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.type}
              onClick={() => handleTypeSelect(type.type)}
              className={`p-3 rounded-lg border text-left transition-colors ${type.color}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm opacity-75">{type.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      <Button
        variant="ghost"
        onClick={() => setStep('rating')}
        className="w-full"
      >
        Voltar
      </Button>
    </div>
  )

  const renderDetailsStep = () => {
    const selectedType = feedbackTypes.find(t => t.type === feedbackType)
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {selectedType && <selectedType.icon className="w-5 h-5" />}
            <h3 className="font-semibold text-lg">
              {selectedType?.label}
            </h3>
          </div>
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  rating && star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Conte-nos mais detalhes *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                feedbackType === 'bug' 
                  ? 'Descreva o problema que você encontrou...'
                  : feedbackType === 'suggestion'
                  ? 'Qual sua sugestão de melhoria?'
                  : feedbackType === 'compliment'
                  ? 'O que você gostou?'
                  : 'Compartilhe seu feedback...'
              }
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Para que possamos entrar em contato se necessário
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            onClick={() => setStep('type')}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    )
  }

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <ThumbsUp className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-2">
          Obrigado pelo seu feedback!
        </h3>
        <p className="text-sm text-muted-foreground">
          Sua opinião é muito importante para nós. Analisaremos seu feedback e trabalharemos para melhorar o sistema.
        </p>
      </div>
      
      {userEmail && (
        <div className="text-xs text-muted-foreground">
          Entraremos em contato em {userEmail} se necessário
        </div>
      )}
    </div>
  )

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
          size="icon"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Feedback</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {page !== 'unknown' && (
            <Badge variant="secondary" className="w-fit text-xs">
              {page} {feature !== 'general' && `• ${feature}`}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent>
          {step === 'rating' && renderRatingStep()}
          {step === 'type' && renderTypeStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'success' && renderSuccessStep()}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para usar o widget de feedback
export function useFeedbackWidget(page?: string, feature?: string) {
  const [isVisible, setIsVisible] = useState(true)

  const showFeedback = () => setIsVisible(true)
  const hideFeedback = () => setIsVisible(false)

  return {
    FeedbackWidget: () => isVisible ? (
      <FeedbackWidget page={page} feature={feature} />
    ) : null,
    showFeedback,
    hideFeedback,
    isVisible
  }
}