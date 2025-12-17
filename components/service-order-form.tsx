'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Save,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Cliente,
  ServiceOrderData,
  OrdemServicoCriada
} from '@/lib/types/service-order';
import { FORM_STEPS } from '@/lib/constants/service-order';

import { ClientStep } from './service-order/steps/client-step';
import { DeviceStep } from './service-order/steps/device-step';
import { DiagnosisStep } from './service-order/steps/diagnosis-step';
import { PartsStep } from './service-order/steps/parts-step';

interface ServiceOrderFormProps {
  ordemId?: string | null;
  onSuccess?: () => void;
}

export function ServiceOrderForm({
  ordemId,
  onSuccess,
}: ServiceOrderFormProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [ordemCriada, setOrdemCriada] = useState<OrdemServicoCriada | null>(
    null
  );

  const [formData, setFormData] = useState<ServiceOrderData>({
    deviceType: '',
    deviceModel: '',
    serialNumber: '',
    reportedDefect: '',
    damages: '',
    defectDescription: '',
    solution: '',
    parts: [],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    serviceType: '',
    priority: '',
    preferredDate: '',
    observations: '',
  });

  // Use ordemId if provided
  useEffect(() => {
    const fetchOrder = async () => {
      if (!ordemId) return;

      try {
        const { getServiceOrderById } = await import('@/app/actions/service-order');
        const result = await getServiceOrderById(ordemId);

        if (result.success && result.data) {
          // Populate client
          setSelectedClient(result.data.cliente as Cliente); // Ensure type compatibility

          // Populate form data
          setFormData(result.data.formData);

          console.log('Order loaded:', result.data);
        } else {
          console.error('Failed to load order:', result.error);
          alert(`Erro ao carregar dados da OS: ${result.error}`);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    fetchOrder();
  }, [ordemId]);

  const handleInputChange = (field: keyof ServiceOrderData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro específico
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNextStep = () => {
    // Validate current step
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!selectedClient && !showManualForm) {
        stepErrors.client = 'Selecione um cliente ou cadastre um novo';
      }
      if (showManualForm) {
        if (!formData.customerName || formData.customerName.length < 2)
          stepErrors.customerName = 'Nome deve ter pelo menos 2 caracteres';
        if (!formData.customerPhone || formData.customerPhone.length < 10)
          stepErrors.customerPhone = 'Telefone inválido';
      }
    } else if (currentStep === 2) {
      if (!formData.deviceType)
        stepErrors.deviceType = 'Selecione o tipo de dispositivo';
      if (!formData.deviceModel || formData.deviceModel.length < 2)
        stepErrors.deviceModel = 'Modelo obrigatório';
      if (!formData.serialNumber || formData.serialNumber.length < 5)
        stepErrors.serialNumber = 'Número de série inválido';
    } else if (currentStep === 3) {
      if (!formData.reportedDefect)
        stepErrors.reportedDefect = 'Selecione o defeito relatado';
      if (!formData.defectDescription || formData.defectDescription.length < 10)
        stepErrors.defectDescription = 'Descrição detalhada é obrigatória (min 10 chars)';
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const { createServiceOrder, updateServiceOrder } = await import('@/app/actions/service-order');

      let result;
      let isUpdate = false;

      if (ordemId) {
        // Update existing order
        isUpdate = true;
        result = await updateServiceOrder(ordemId, formData);
      } else {
        // Create new order
        if (!selectedClient?.id) {
          alert('Por favor, selecione um cliente.');
          setIsSubmitting(false);
          return;
        }
        result = await createServiceOrder(formData, selectedClient.id);
      }

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      const osData = result.data;

      if (!isUpdate) {
        // If created, show success card
        const novaOS = osData as OrdemServicoCriada;
        setOrdemCriada({
          id: novaOS.id,
          numero_os: novaOS.numero_os,
          created_at: novaOS.created_at,
        });
        alert(`Ordem de serviço criada com sucesso!\nNúmero da OS: ${novaOS.numero_os}`);
      } else {
        // If updated, just notify and maybe redirect or keep editing
        alert('Ordem de serviço atualizada com sucesso!');
        // Optional: redirect or refresh? For now, keep on page.
      }

      if (!isUpdate) {
        // Only reset form if it was a creation. For update, we might want to keep data or reload it.
        // Reset do formulário
        setFormData({
          deviceType: '',
          deviceModel: '',
          serialNumber: '',
          reportedDefect: '',
          damages: '',
          defectDescription: '',
          solution: '',
          parts: [],
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          serviceType: '',
          priority: '',
          preferredDate: '',
          observations: '',
        });
        setSelectedClient(null);
        setCurrentStep(1);
      } else {
        // For update, maybe just go back to step 1 or stay?
        // Let's stay on step 4 or go to step 1 but keep data? 
        // Going to step 1 seems safer to review.
        setCurrentStep(1);
      }

      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert(
        error instanceof Error ? error.message : 'Erro ao criar ordem de serviço'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render OS Creation Success
  if (ordemCriada) {
    return (
      <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-6 rounded-full bg-green-100 p-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h2 className="mb-2 text-3xl font-bold text-gray-800">Sucesso!</h2>
          <p className="mb-8 text-xl text-gray-600">
            Ordem de Serviço criada:
            <span className="ml-2 font-mono font-bold text-gray-900">
              {ordemCriada.numero_os}
            </span>
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setOrdemCriada(null);
              }}
              className="h-12 w-full rounded-xl bg-green-600 px-8 text-lg font-semibold hover:bg-green-700 sm:w-auto"
            >
              Criar Nova OS
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOrdemCriada(null);
              }}
              className="h-12 w-full rounded-xl border-green-200 text-green-700 hover:bg-green-50 sm:w-auto"
            >
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientStep
            formData={formData}
            selectedClient={selectedClient}
            showManualForm={showManualForm}
            errors={errors}
            onClientSelect={setSelectedClient}
            onNewClient={() => {
              setSelectedClient(null);
              setShowManualForm((prev) => !prev);
            }}
            onManualFormToggle={setShowManualForm}
            handleInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <DeviceStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <DiagnosisStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
          />
        );
      case 4:
        return <PartsStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4">
      {/* Stepper Header */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-gray-100" />
        <div
          className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-in-out"
          style={{
            width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%`,
          }}
        />
        <div className="flex justify-between">
          {FORM_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            const getStepClasses = () => {
              if (isActive) return 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200';
              if (isCompleted) return 'border-green-500 bg-green-500 text-white';
              return 'border-gray-200 bg-white text-gray-400';
            };

            const getTextClasses = () => {
              if (isActive) return 'text-blue-600';
              if (isCompleted) return 'text-green-600';
              return 'text-gray-400';
            };

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-2 bg-white px-2 transition-colors duration-300`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${getStepClasses()} `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${getTextClasses()} `}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px] transition-all duration-300 ease-in-out">
        {renderStep()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-lg">
        <Button
          variant="ghost"
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="h-12 rounded-xl px-8 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Voltar
        </Button>

        <div className="flex items-center gap-4">
          <div className="hidden text-sm font-medium text-gray-500 sm:block">
            Passo {currentStep} de 4
          </div>
          <Button
            onClick={handleNextStep}
            disabled={isSubmitting}
            className={`h-12 min-w-[140px] rounded-xl px-8 text-lg font-semibold shadow-lg transition-all hover:-translate-y-0.5 ${currentStep === 4
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-200'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-blue-200'
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner className="h-5 w-5 animate-spin" />
                <span>Salvat...</span>
              </div>
            ) : (
              currentStep === 4 ? (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  <span>{ordemId ? 'Atualizar OS' : 'Finalizar OS'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Próximo</span>
                  <ChevronRight className="h-5 w-5" />
                </div>
              )
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
