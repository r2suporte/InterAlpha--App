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
import { Input } from '@/components/ui/input';
import { Smartphone, Laptop, Tablet, Watch, CheckCircle, AlertCircle } from 'lucide-react';
import { ServiceOrderData } from '@/lib/types/service-order';

interface DeviceStepProps {
    formData: ServiceOrderData;
    errors: Record<string, string>;
    handleInputChange: (field: keyof ServiceOrderData, value: string) => void;
}

export function DeviceStep({
    formData,
    errors,
    handleInputChange,
}: DeviceStepProps) {
    const getDeviceIcon = (tipo: string) => {
        switch (tipo.toLowerCase()) {
            case 'macbook':
            case 'macbook pro':
            case 'macbook air':
            case 'imac':
            case 'mac mini':
            case 'mac studio':
            case 'mac pro':
                return Laptop;
            case 'ipad':
            case 'ipad pro':
            case 'ipad air':
            case 'ipad mini':
                return Tablet;
            case 'apple watch':
                return Watch;
            case 'iphone':
            default:
                return Smartphone;
        }
    };

    const DeviceIcon = getDeviceIcon(formData.deviceType);

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 pb-8 text-white">
                <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                        <DeviceIcon className="h-8 w-8" />
                    </div>
                </div>
                <CardTitle className="text-center text-2xl font-bold">
                    Informações do Dispositivo
                </CardTitle>
                <CardDescription className="text-center text-lg text-purple-100">
                    Detalhes sobre o equipamento que será reparado
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Tipo de Dispositivo
                            {errors.deviceType && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                        </Label>
                        <Select
                            value={formData.deviceType}
                            onValueChange={(val) => handleInputChange('deviceType', val)}
                        >
                            <SelectTrigger
                                className={`h-12 rounded-xl border-2 transition-colors ${errors.deviceType
                                        ? 'border-red-300 focus:border-red-500'
                                        : 'border-gray-200 focus:border-blue-500'
                                    }`}
                            >
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    'iPhone',
                                    'iPad',
                                    'MacBook',
                                    'iMac',
                                    'Apple Watch',
                                    'Mac mini',
                                    'Mac Studio',
                                    'Outro',
                                ].map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.deviceType && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.deviceType}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Modelo
                        </Label>
                        <Input
                            type="text"
                            value={formData.deviceModel}
                            onChange={(e) => handleInputChange('deviceModel', e.target.value)}
                            placeholder="Ex: iPhone 14 Pro Max"
                            className={`h-12 rounded-xl border-2 transition-colors ${errors.deviceModel
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-200 focus:border-blue-500'
                                }`}
                        />
                        {errors.deviceModel && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.deviceModel}
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            Número de Série
                        </Label>
                        <Input
                            type="text"
                            value={formData.serialNumber}
                            onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                            placeholder="Ex: C02XK0AAHV29"
                            className={`h-12 rounded-xl border-2 transition-colors ${errors.serialNumber
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-200 focus:border-blue-500'
                                }`}
                        />
                        {errors.serialNumber && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.serialNumber}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
