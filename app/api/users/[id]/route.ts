import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';

// PUT - Atualizar usuário
async function updateUser(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;
        const data = await request.json();
        const { name, email, role, active } = data;

        const updateData: any = {
            name,
            email,
            role,
            isActive: active // Mapping active -> isActive
        };

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            id: updatedUser.id,
            name: updatedUser.name,
            role: updatedUser.role,
            active: updatedUser.isActive
        });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Remover usuário
async function deleteUser(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params;

        // Hard delete
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const PUT = withAuthenticatedApiLogging(updateUser);
export const DELETE = withAuthenticatedApiLogging(deleteUser);
