'use server';

import db from '@/lib/prisma';
import { ServiceOrderData } from '@/lib/types/service-order';
import { revalidatePath } from 'next/cache';

export async function createServiceOrder(
    data: ServiceOrderData,
    clienteId: string
) {
    try {
        // Basic validation
        if (!clienteId) {
            return { success: false, error: 'Cliente não identificado' };
        }

        // Generate OS number (simple timestamp-based for now, or fetch latest)
        // A better approach in production is a sequence or count query
        const count = await db.ordemServico.count();
        const year = new Date().getFullYear();
        const numeroOs = `OS-${year}-${(count + 1).toString().padStart(4, '0')}`;

        console.log('Creating Service Order:', numeroOs);

        const os = await db.ordemServico.create({
            data: {
                clienteId,
                numeroOs,
                titulo: `${data.deviceType} ${data.deviceModel}`,
                descricao: `Defeito: ${data.reportedDefect}\nDescrição: ${data.defectDescription}\nSérie: ${data.serialNumber}`,

                // Detailed fields (ensure schema was updated)
                tipoDispositivo: data.deviceType,
                modeloDispositivo: data.deviceModel,
                numeroSerie: data.serialNumber,
                defeitoRelatado: data.reportedDefect,
                danosAparentes: data.damages,
                solucao: data.solution,

                status: 'aguardando_diagnostico',
                prioridade: data.priority || 'media',
                observacoes: data.observations,

                // Create parts relation
                pecas: {
                    create: data.parts.map((p) => ({
                        nome: p.name,
                        quantidade: p.quantity,
                        precoUnitario: p.price,
                        precoTotal: p.quantity * p.price,
                    })),
                },
            },
            include: {
                pecas: true,
            },
        });

        revalidatePath('/dashboard/ordens-servico');
        revalidatePath(`/dashboard/clientes/${clienteId}`);

        return {
            success: true,
            data: {
                id: os.id,
                numero_os: os.numeroOs,
                created_at: os.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error('Error creating service order:', error);
        return {
            success: false,
            error: 'Erro ao criar ordem de serviço. Tente novamente.',
        };
    }
}

export async function getServiceOrderById(id: string) {
    try {
        const os = await db.ordemServico.findUnique({
            where: { id },
            include: {
                cliente: true,
                pecas: true,
            },
        });

        if (!os) {
            return { success: false, error: 'Ordem de serviço não encontrada' };
        }

        // Map to ServiceOrderData
        const formData: ServiceOrderData = {
            deviceType: os.tipoDispositivo || '',
            deviceModel: os.modeloDispositivo || '',
            serialNumber: os.numeroSerie || '',
            reportedDefect: os.defeitoRelatado || '',
            damages: os.danosAparentes || '',
            defectDescription: os.descricao?.replace(/Defeito: .*\nDescrição: /, '').split('\nSérie:')[0] || '', // Basic extraction attempt, better if stored separately
            solution: os.solucao || '',
            parts: os.pecas.map(p => ({
                id: p.id,
                name: p.nome,
                quantity: p.quantidade,
                price: Number(p.precoUnitario),
            })),
            // Client info is handled separately via selectedClient, but we return it here for mapping
            customerName: os.cliente.nome,
            customerEmail: os.cliente.email || '',
            customerPhone: os.cliente.telefone || '',
            customerAddress: os.cliente.endereco || '',
            serviceType: '', // Not strictly in schema? Add if needed
            priority: os.prioridade,
            preferredDate: '', // Not in schema
            observations: os.observacoes || '',
        };

        return {
            success: true,
            data: {
                formData,
                cliente: os.cliente,
            },
        };
    } catch (error) {
        console.error('Error fetching service order:', error);
        return { success: false, error: 'Erro ao buscar ordem de serviço' };
    }
}

export async function updateServiceOrder(
    id: string,
    data: ServiceOrderData
) {
    try {
        if (!id) {
            return { success: false, error: 'ID da ordem de serviço não fornecido' };
        }

        console.log('Updating Service Order:', id);

        const os = await db.ordemServico.update({
            where: { id },
            data: {
                // Update main fields
                titulo: `${data.deviceType} ${data.deviceModel}`,
                descricao: `Defeito: ${data.reportedDefect}\nDescrição: ${data.defectDescription}\nSérie: ${data.serialNumber}`,
                tipoDispositivo: data.deviceType,
                modeloDispositivo: data.deviceModel,
                numeroSerie: data.serialNumber,
                defeitoRelatado: data.reportedDefect,
                danosAparentes: data.damages,
                solucao: data.solution,
                prioridade: data.priority,
                observacoes: data.observations,
                updatedAt: new Date(),

                // Handle parts: Replace all existing with new list
                pecas: {
                    deleteMany: {},
                    create: data.parts.map((p) => ({
                        nome: p.name,
                        quantidade: p.quantity,
                        precoUnitario: p.price,
                        precoTotal: p.quantity * p.price,
                    })),
                },
            },
            include: {
                pecas: true,
            },
        });

        revalidatePath('/dashboard/ordens-servico');
        revalidatePath(`/dashboard/ordens-servico/editar/${id}`);
        if (os.clienteId) {
            revalidatePath(`/dashboard/clientes/${os.clienteId}`);
        }

        return {
            success: true,
            data: {
                id: os.id,
                numero_os: os.numeroOs,
                updated_at: os.updatedAt.toISOString(),
            },
        };
    } catch (error) {
        console.error('Error updating service order:', error);
        return {
            success: false,
            error: 'Erro ao atualizar ordem de serviço. Tente novamente.',
        };
    }
}
