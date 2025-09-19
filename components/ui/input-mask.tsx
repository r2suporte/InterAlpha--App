import React, { forwardRef, useCallback } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface InputMaskProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, value, onChange, className, ...props }, ref) => {
    const applyMask = useCallback((inputValue: string, maskPattern: string): string => {
      const cleanValue = inputValue.replace(/\D/g, '')
      const expectedDigits = maskPattern.replace(/\D/g, '').length
      
      // Limitar o valor limpo ao número de dígitos esperados pela máscara
      const limitedValue = cleanValue.slice(0, expectedDigits)
      
      let maskedValue = ''
      let valueIndex = 0
      
      for (let i = 0; i < maskPattern.length && valueIndex < limitedValue.length; i++) {
        if (maskPattern[i] === '9') {
          maskedValue += limitedValue[valueIndex]
          valueIndex++
        } else {
          maskedValue += maskPattern[i]
        }
      }
      
      return maskedValue
    }, [])

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value
      const maskedValue = applyMask(inputValue, mask)
      
      // Cria um novo evento com o valor mascarado
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: maskedValue
        }
      } as React.ChangeEvent<HTMLInputElement>
      
      onChange(syntheticEvent)
    }, [mask, onChange, applyMask])

    return (
      <Input
        ref={ref}
        {...props}
        value={value}
        onChange={handleChange}
        className={cn(className)}
      />
    )
  }
)

InputMask.displayName = 'InputMask'

export { InputMask }