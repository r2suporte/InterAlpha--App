'use client';

import React from 'react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    Package,
    Shield,
    Sparkles,
    DollarSign,
    Plus,
    CheckCircle,
    Trash2,
} from 'lucide-react';
import { ServiceOrderData, ServicePart } from '@/lib/types/service-order';
import { COMMON_PARTS } from '@/lib/constants/service-order';

interface PartsStepProps {
    formData: ServiceOrderData;
    setFormData: React.Dispatch<React.SetStateAction<ServiceOrderData>>;
}

export function PartsStep({ formData, setFormData }: PartsStepProps) {
    const addPart = (name: string, price: number) => {
        const existingPart = formData.parts.find((p) => p.name === name);
        if (existingPart) {
            updatePartQuantity(existingPart.id, existingPart.quantity + 1);
        } else {
            const newPart: ServicePart = {
                id: Date.now().toString(),
                name,
                quantity: 1,
                price,
            };
            setFormData((prev) => ({ ...prev, parts: [...prev.parts, newPart] }));
        }
    };

    const removePart = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            parts: prev.parts.filter((p) => p.id !== id),
        }));
    };

    const updatePartQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removePart(id);
        } else {
            setFormData((prev) => ({
                ...prev,
                parts: prev.parts.map((p) => (p.id === id ? { ...p, quantity } : p)),
            }));
        }
    };

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-yellow-50 via-white to-amber-50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 pb-8 text-white">
                <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                        <Package className="h-8 w-8" />
                    </div>
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                    Peças e Orçamento
                </CardTitle>
                <CardDescription className="text-center text-lg text-yellow-100">
                    Componentes necessários para o reparo
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
                <Alert className="rounded-xl border-blue-200 bg-blue-50">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                        <strong>Importante:</strong> As peças serão confirmadas após
                        diagnóstico técnico detalhado. Os valores são estimativas baseadas
                        no mercado atual.
                    </AlertDescription>
                </Alert>

                {/* Peças Comuns */}
                <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Peças Mais Utilizadas
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {COMMON_PARTS.map((part) => {
                            const Icon = part.icon;
                            const isSelected = formData.parts.some(
                                (p) => p.name === part.name
                            );
                            return (
                                <div
                                    key={part.name}
                                    className={`group cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-lg ${isSelected
                                        ? 'border-green-400 bg-green-50 shadow-md'
                                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                                        } `}
                                    onClick={() => addPart(part.name, part.price)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`rounded-lg p-2 transition-colors ${isSelected
                                                ? 'bg-green-200'
                                                : 'bg-yellow-100 group-hover:bg-yellow-200'
                                                } `}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${isSelected ? 'text-green-600' : 'text-yellow-600'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800">
                                                {part.name}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                R$ {part.price.toFixed(2)}
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Plus className="h-5 w-5 text-yellow-600 opacity-0 transition-opacity group-hover:opacity-100" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Peças Selecionadas */}
                {formData.parts.length > 0 && (
                    <div className="space-y-6">
                        <Separator />
                        <h3 className="text-lg font-bold text-gray-800">
                            Peças Selecionadas ({formData.parts.length})
                        </h3>
                        <div className="space-y-3">
                            {formData.parts.map((part) => (
                                <Card
                                    key={part.id}
                                    className="rounded-xl border border-green-200 bg-green-50/50 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800">
                                                {part.name}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                R$ {part.price.toFixed(2)} cada
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        updatePartQuantity(part.id, part.quantity - 1)
                                                    }
                                                    className="h-8 w-8 rounded-full p-0"
                                                >
                                                    -
                                                </Button>
                                                <span className="w-8 text-center font-medium">
                                                    {part.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        updatePartQuantity(part.id, part.quantity + 1)
                                                    }
                                                    className="h-8 w-8 rounded-full p-0"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">
                                                    R$ {(part.quantity * part.price).toFixed(2)}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removePart(part.id)}
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Card className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-green-100">Total Estimado</span>
                                    <div className="text-2xl font-bold">
                                        R${' '}
                                        {formData.parts
                                            .reduce(
                                                (total, part) => total + part.quantity * part.price,
                                                0
                                            )
                                            .toFixed(2)}
                                    </div>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-200" />
                            </div>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
