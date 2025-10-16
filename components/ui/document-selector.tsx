'use client';

import React, { useEffect, useState } from 'react';

import {
  AlertCircle,
  Building,
  CheckCircle,
  FileText,
  User,
} from 'lucide-react';

import {
  type TipoPessoa,
  determinarTipoPessoa,
  getMascaraCpfCnpj,
  getMascaraPorTipo,
  validarCpfCnpj,
} from '@/lib/validators';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { InputMask } from './input-mask';
import { Label } from './label';

interface DocumentSelectorProps {
  value: string;
  onChange: (value: string, tipoPessoa: TipoPessoa) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function DocumentSelector({
  value,
  onChange,
  id,
  placeholder = 'Selecione o tipo de documento',
  required = false,
  className,
}: DocumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | null>(
    () => {
      // Inicializar o tipo baseado no valor inicial, se houver
      if (value) {
        const cleanValue = value.replace(/\D/g, '');
        // Só determinar automaticamente se o documento estiver completo
        if (cleanValue.length === 11) {
          return 'cpf';
        }
        if (cleanValue.length === 14) {
          return 'cnpj';
        }
      }
      return null;
    }
  );
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Helper function to get validation class
  const getValidationClass = (show: boolean, valid: boolean | null): string => {
    if (!show) return '';
    if (valid === true) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    if (valid === false) return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    return '';
  };

  // Função para validar o documento
  const validateDocument = (
    docValue: string,
    docType: 'cpf' | 'cnpj' | null
  ) => {
    if (!docValue || !docType) {
      setIsValid(null);
      setShowValidation(false);
      return;
    }

    const cleanValue = docValue.replace(/\D/g, '');
    const tipoPessoa = docType === 'cpf' ? 'fisica' : 'juridica';

    // Só mostrar validação se o documento tiver pelo menos alguns dígitos
    if (cleanValue.length >= 3) {
      setShowValidation(true);
      const valid = validarCpfCnpj(cleanValue, tipoPessoa);
      setIsValid(valid);
    } else {
      setShowValidation(false);
      setIsValid(null);
    }
  };

  // Sincronizar com valor externo
  useEffect(() => {
    // Só atualizar se o valor externo for diferente do valor local
    if (value !== inputValue) {
      setInputValue(value);
    }

    // Resetar tipo se valor for limpo externamente
    if (!value && documentType) {
      setDocumentType(null);
      setIsValid(null);
      setShowValidation(false);
    } else if (value && documentType) {
      validateDocument(value, documentType);
    }
  }, [value]);

  const handleDocumentTypeSelect = (type: 'cpf' | 'cnpj') => {
    setDocumentType(type);
    setInputValue('');
    setIsValid(null);
    setShowValidation(false);
    setIsOpen(false);
    // Limpar o valor quando trocar o tipo
    onChange('', type === 'cpf' ? 'fisica' : 'juridica');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Atualizar estado local
    setInputValue(newValue);

    // Validar em tempo real se há tipo selecionado
    if (documentType) {
      validateDocument(newValue, documentType);
    }

    // Notificar o componente pai
    onChange(newValue, documentType === 'cpf' ? 'fisica' : 'juridica');
  };

  const handleClearDocument = () => {
    setDocumentType(null);
    setInputValue('');
    setIsValid(null);
    setShowValidation(false);
    onChange('', 'fisica');
  };

  const getPlaceholderText = () => {
    if (documentType === 'cpf') return '000.000.000-00';
    if (documentType === 'cnpj') return '00.000.000/0000-00';
    return placeholder;
  };

  const getDocumentLabel = () => {
    if (documentType === 'cpf') return 'CPF';
    if (documentType === 'cnpj') return 'CNPJ';
    return 'CPF/CNPJ';
  };

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <Label htmlFor={id}>
          {getDocumentLabel()} {required && '*'}
        </Label>
        {documentType && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDocument}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Trocar tipo
          </Button>
        )}
      </div>

      {documentType ? (
        <div className="relative">
          <InputMask
            mask={getMascaraPorTipo(documentType)}
            value={inputValue}
            onChange={handleInputChange}
            id={id}
            placeholder={getPlaceholderText()}
            required={required}
            className={`w-full pr-10 ${getValidationClass(
              showValidation,
              isValid
            )}`}
          />
          {showValidation && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
          {showValidation && !isValid && (
            <p className="mt-1 text-sm text-red-600">
              {documentType === 'cpf' ? 'CPF inválido' : 'CNPJ inválido'}
            </p>
          )}
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start text-left font-normal"
              id={id}
            >
              <FileText className="mr-2 h-4 w-4" />
              {placeholder}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Tipo de Documento</DialogTitle>
              <DialogDescription>
                Escolha o tipo de documento que você deseja cadastrar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleDocumentTypeSelect('cpf')}
              >
                <User className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">CPF</div>
                  <div className="text-sm text-muted-foreground">
                    Pessoa Física
                  </div>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleDocumentTypeSelect('cnpj')}
              >
                <Building className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">CNPJ</div>
                  <div className="text-sm text-muted-foreground">
                    Pessoa Jurídica
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
