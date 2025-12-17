'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ClientSearch } from '@/components/client-search';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { Cliente, ServiceOrderData } from '@/lib/types/service-order';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ClientStepProps {
    formData: ServiceOrderData;
    selectedClient: Cliente | null;
    showManualForm: boolean;
    errors: Record<string, string>;
    onClientSelect: (client: Cliente) => void;
    onNewClient: () => void;
    onManualFormToggle: (show: boolean) => void;
    handleInputChange: (field: keyof ServiceOrderData, value: string) => void;
}

export function ClientStep({
    formData,
    selectedClient,
    showManualForm,
    errors,
    onClientSelect,
    onNewClient,
    onManualFormToggle,
    handleInputChange,
}: ClientStepProps) {
    const renderFormField = (
        field: keyof ServiceOrderData,
        label: string,
        type: string = 'text',
        placeholder?: string
    ) => {
        const fieldValidation = errors[field];
        const value = formData[field] as string;

        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {label}
                    {fieldValidation && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                </Label>

                <Input
                    type={type}
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={placeholder}
                    className={`h-12 rounded-xl border-2 transition-colors ${fieldValidation
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-blue-500'
                        }`}
                />

                {fieldValidation && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {fieldValidation}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-8 text-white">
                <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                        <User className="h-8 w-8" />
                    </div>
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                    Informações do Cliente
                </CardTitle>
                <CardDescription className="text-center text-lg text-blue-100">
                    Busque um cliente existente ou cadastre um novo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
                {!selectedClient && !showManualForm && (
                    <div className="space-y-4">
                        <ClientSearch
                            onClientSelect={onClientSelect}
                            onCreateNew={onNewClient}
                        />
                        {errors.client && (
                            <div className="text-sm font-medium text-red-500">
                                {errors.client}
                            </div>
                        )}
                    </div>
                )}

                {selectedClient && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                            <div>
                                <h3 className="font-semibold text-green-800">
                                    Cliente Selecionado
                                </h3>
                                <p className="text-green-600">
                                    {selectedClient.nome} - {selectedClient.numero_cliente}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onNewClient}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                                Alterar Cliente
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium text-gray-600">
                                    Nome
                                </Label>
                                <p className="text-gray-900">{selectedClient.nome}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">
                                    Telefone
                                </Label>
                                <p className="text-gray-900">{selectedClient.telefone}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">
                                    Email
                                </Label>
                                <p className="text-gray-900">{selectedClient.email}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">
                                    Endereço
                                </Label>
                                <p className="text-gray-900">{selectedClient.endereco}</p>
                            </div>
                        </div>
                    </div>
                )}

                {showManualForm && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Cadastrar Novo Cliente</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onManualFormToggle(false)}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                                Buscar Cliente
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {renderFormField(
                                'customerName',
                                'Nome Completo',
                                'text',
                                'Ex: João Silva Santos'
                            )}
                            {renderFormField(
                                'customerPhone',
                                'Telefone',
                                'tel',
                                '(11) 99999-9999'
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {renderFormField(
                                'customerEmail',
                                'Email',
                                'email',
                                'joao@email.com'
                            )}
                            {renderFormField(
                                'customerAddress',
                                'Endereço Completo',
                                'text',
                                'Rua, número, bairro, cidade'
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
