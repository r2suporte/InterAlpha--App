"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import InputMask from "react-input-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cpf, cnpj } from "cpf-cnpj-validator";

// Schema de validação
const clientFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }, "Telefone deve ter entre 10 e 11 dígitos"),
  documento: z.string().refine((val) => {
    const digits = val.replace(/\D/g, '');
    return cpf.isValid(digits) || cnpj.isValid(digits);
  }, "CPF ou CNPJ inválido"),
  tipoDocumento: z.enum(["CPF", "CNPJ"]),
  cep: z.string().refine((val) => {
    if (!val) return true; // Optional field
    const digits = val.replace(/\D/g, '');
    return digits.length === 8;
  }, "CEP deve ter 8 dígitos").optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, "Estado deve ter 2 caracteres").optional(),
  observacoes: z.string().optional()
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ClientForm({ initialData, onSubmit, isLoading = false }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      ...initialData,
      tipoDocumento: "CPF"
    }
  });

  const documento = watch("documento");

  // Define o tipo de documento baseado no formato e atualiza o campo
  useEffect(() => {
    if (documento) {
      setValue("tipoDocumento", documento.length === 11 ? "CPF" : "CNPJ")
    }
  }, [documento, setValue]);

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      setError(null);
      await onSubmit(data);
      setSuccess("Cliente salvo com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cliente");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-skeleton">
        <Skeleton className="h-10 w-full" data-testid="skeleton" />
        <Skeleton className="h-10 w-full" data-testid="skeleton" />
        <Skeleton className="h-10 w-full" data-testid="skeleton" />
        <Skeleton className="h-10 w-3/4" data-testid="skeleton" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          {...register("nome")}
          error={errors.nome?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone *</Label>
        <Controller
          name="telefone"
          control={control}
          render={({ field: { onChange, value } }) => (
            <InputMask
              mask="(99) 99999-9999"
              value={value || ""}
              onChange={onChange}
            >
              {(inputProps: any) => (
                <Input
                  id="telefone"
                  {...inputProps}
                  error={errors.telefone?.message}
                />
              )}
            </InputMask>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="documento">CPF/CNPJ *</Label>
        <Controller
          name="documento"
          control={control}
          render={({ field: { onChange, value } }) => (
            <InputMask
              mask={value?.length > 11 ? "99.999.999/9999-99" : "999.999.999-99"}
              value={value || ""}
              onChange={onChange}
            >
              {(inputProps: any) => (
                <Input
                  id="documento"
                  {...inputProps}
                  error={errors.documento?.message}
                />
              )}
            </InputMask>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <Controller
          name="cep"
          control={control}
          render={({ field: { onChange, value } }) => (
            <InputMask
              mask="99999-999"
              value={value || ""}
              onChange={onChange}
            >
              {(inputProps: any) => (
                <Input
                  id="cep"
                  {...inputProps}
                  error={errors.cep?.message}
                />
              )}
            </InputMask>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          {...register("endereco")}
          error={errors.endereco?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            {...register("cidade")}
            error={errors.cidade?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            {...register("estado")}
            error={errors.estado?.message}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          className="w-full min-h-[100px] p-2 border rounded-md"
          {...register("observacoes")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Salvando..." : "Salvar Cliente"}
      </Button>
    </form>
  );
}
