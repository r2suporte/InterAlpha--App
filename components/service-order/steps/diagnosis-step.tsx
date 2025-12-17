'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, CheckCircle, AlertCircle } from 'lucide-react';
import { ServiceOrderData } from '@/lib/types/service-order';

interface DiagnosisStepProps {
    formData: ServiceOrderData;
    errors: Record<string, string>;
    handleInputChange: (field: keyof ServiceOrderData, value: string) => void;
}

export function DiagnosisStep({
    formData,
    errors,
    handleInputChange,
}: DiagnosisStepProps) {
    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-orange-50 via-white to-red-50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 pb-8 text-white">
                <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                        <Wrench className="h-8 w-8" />
                    </div>
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                    Diagnóstico Técnico
                </CardTitle>
                <CardDescription className="text-center text-lg text-orange-100">
                    Análise detalhada do problema encontrado
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Problema Relatado
                        </Label>
                        <Select
                            value={formData.reportedDefect}
                            onValueChange={(val) => handleInputChange('reportedDefect', val)}
                        >
                            <SelectTrigger
                                className={`h-12 rounded-xl border-2 transition-colors ${errors.reportedDefect
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-gray-200 focus:border-blue-500'
                                    }`}
                            >
                                <SelectValue placeholder="Selecione o problema" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    'Tela quebrada',
                                    'Não liga',
                                    'Bateria viciada',
                                    'Problema de software',
                                    'Dano por líquido',
                                    'Botões não funcionam',
                                    'Alto-falante',
                                    'Microfone',
                                    'Câmera',
                                    'Outro',
                                ].map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.reportedDefect && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.reportedDefect}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Condição Geral
                        </Label>
                        <Select
                            value={formData.damages}
                            onValueChange={(val) => handleInputChange('damages', val)}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 transition-colors focus:border-blue-500">
                                <SelectValue placeholder="Avalie a condição" />
                            </SelectTrigger>
                            <SelectContent>
                                {['Excelente', 'Boa', 'Regular', 'Ruim', 'Péssima'].map(
                                    (option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Descrição Detalhada
                            {errors.defectDescription && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </Label>
                        <Textarea
                            value={formData.defectDescription}
                            onChange={(e) =>
                                handleInputChange('defectDescription', e.target.value)
                            }
                            placeholder="Descreva detalhadamente o problema, quando começou, circunstâncias..."
                            className={`min-h-[100px] resize-none rounded-xl border-2 transition-colors ${errors.defectDescription
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-200 focus:border-blue-500'
                                }`}
                        />
                        {errors.defectDescription && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.defectDescription}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Solução Aplicada
                        </Label>
                        <Textarea
                            value={formData.solution}
                            onChange={(e) => handleInputChange('solution', e.target.value)}
                            placeholder="Descreva a solução técnica aplicada para resolver o problema..."
                            className="min-h-[100px] resize-none rounded-xl border-2 border-gray-200 transition-colors focus:border-blue-500"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
