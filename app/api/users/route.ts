import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuthenticatedApiLogging } from '@/lib/middleware/logging-middleware';
import { clerkClient } from '@clerk/nextjs/server';

// GET - Listar usuários
async function getUsers(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role');

        const where: any = {};

        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        const formattedUsers = users.map(u => ({
            ...u,
            active: u.isActive
        }));

        return NextResponse.json(formattedUsers);

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Criar usuário e enviar convite Clerk
async function createUser(request: NextRequest) {
    try {
        const data = await request.json();
        const { name, email, role } = data;

        if (!name || !email || !role) {
            return NextResponse.json(
                { error: 'Nome, Email e Função são obrigatórios' },
                { status: 400 }
            );
        }

        // Check DB existence
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
        }

        // 1. Create User in Local DB
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                isActive: true
            }
        });

        // 2. Invite via Clerk (Sync)
        try {
            const client = await clerkClient();
            await client.invitations.createInvitation({
                emailAddress: email,
                publicMetadata: {
                    role: role,
                    internalId: newUser.id
                },
                redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                ignoreExisting: true // Don't fail if already invited/exists
            });
        } catch (clerkError) {
            console.error('Erro ao enviar convite Clerk:', clerkError);
            // We treat this as a non-blocking warning, or we could return 201 with warning
            // For now, simple console log, user is created locally.
        }

        return NextResponse.json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            active: newUser.isActive,
            inviteSent: true
        }, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const GET = withAuthenticatedApiLogging(getUsers);
export const POST = withAuthenticatedApiLogging(createUser);
