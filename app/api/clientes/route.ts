import { NextRequest, NextResponse } from 'next/server';

import { withUserCache } from '@/lib/middleware/cache-middleware';
import {
  withAuthenticatedApiLogging,
} from '@/lib/middleware/logging-middleware';
import {
  withAuthenticatedApiMetrics,
} from '@/lib/middleware/metrics-middleware';
import { authorizeApiRequest } from '@/lib/auth/api-authorization';
import { CACHE_TTL } from '@/lib/services/cache-service';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const CLIENTES_READ_ROLES = [
  'admin',
  'diretor',
  'gerente_adm',
  'gerente_financeiro',
  'supervisor_tecnico',
  'technician',
  'atendente',
] as const;

const CLIENTES_WRITE_ROLES = [
  'admin',
  'diretor',
  'gerente_adm',
  'supervisor_tecnico',
  'atendente',
] as const;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const SORT_FIELD_MAP: Record<string, keyof Prisma.ClienteOrderByWithRelationInput> = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  nome: 'nome',
  email: 'email',
};

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

function mapClienteToResponse<
  T extends {
    cpfCnpj: string | null;
    numeroCliente: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(cliente: T) {
  return {
    ...cliente,
    cpf_cnpj: cliente.cpfCnpj,
    numero_cliente: cliente.numeroCliente,
    created_at: cliente.createdAt,
    updated_at: cliente.updatedAt,
  };
}

// GET - Listar clientes (com cache)
async function getClientes(request: NextRequest) {
  try {
    const auth = await authorizeApiRequest(request, [...CLIENTES_READ_ROLES]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);

    const page = parsePositiveInteger(searchParams.get('page'), DEFAULT_PAGE);
    const limit = parsePositiveInteger(searchParams.get('limit'), DEFAULT_LIMIT);
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const safeLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    // Construir filtro de busca
    const where: Prisma.ClienteWhereInput = search
      ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cpfCnpj: { contains: search, mode: 'insensitive' } },
          { numeroCliente: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {};

    const mappedSortField = SORT_FIELD_MAP[sortField] || 'createdAt';

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        take: safeLimit,
        skip,
        orderBy: {
          [mappedSortField]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cpfCnpj: true,
          endereco: true,
          createdAt: true,
          updatedAt: true,
          numeroCliente: true,
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    const clientesMapped = clientes.map(mapClienteToResponse);

    return NextResponse.json({
      clientes: clientesMapped,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
async function createCliente(request: NextRequest) {
  try {
    const auth = await authorizeApiRequest(request, [...CLIENTES_WRITE_ROLES]);
    if (!auth.authorized) return auth.response;

    const { nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep } =
      await request.json();

    // Validação dos campos obrigatórios
    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validação de CPF/CNPJ se fornecido
    const cpfCnpjLimpo = cpf_cnpj ? cpf_cnpj.replace(/\D/g, '') : null;
    if (cpf_cnpj && cpfCnpjLimpo) {
      if (cpfCnpjLimpo.length !== 11 && cpfCnpjLimpo.length !== 14) {
        return NextResponse.json(
          { error: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos' },
          { status: 400 }
        );
      }
    }

    // Verificar email
    const clienteExistente = await prisma.cliente.findFirst({
      where: { email },
    });

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Já existe um cliente cadastrado com este email' },
        { status: 409 }
      );
    }

    // Verificar CPF/CNPJ
    if (cpfCnpjLimpo) {
      const clienteCpfCnpj = await prisma.cliente.findFirst({
        where: { cpfCnpj: cpfCnpjLimpo },
      });

      if (clienteCpfCnpj) {
        return NextResponse.json(
          { error: 'Já existe um cliente cadastrado com este CPF/CNPJ' },
          { status: 409 }
        );
      }
    }

    // Gerar numero_cliente
    const currentYear = new Date().getFullYear();
    const lastCliente = await prisma.cliente.findFirst({
      where: {
        numeroCliente: {
          startsWith: `CL${currentYear}`,
        },
      },
      orderBy: {
        numeroCliente: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastCliente?.numeroCliente) {
      const lastNumber = Number.parseInt(lastCliente.numeroCliente.substring(6), 10);
      if (!Number.isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const numeroCliente = `CL${currentYear}${nextNumber.toString().padStart(6, '0')}`;

    // Criar cliente
    const novoCliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        telefone: telefone?.trim() || null,
        cpfCnpj: cpfCnpjLimpo || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        cep: cep?.replace(/\D/g, '') || null,
        numeroCliente,
      },
    });

    const responseData = mapClienteToResponse(novoCliente);

    return NextResponse.json(
      {
        success: true,
        message: 'Cliente criado com sucesso',
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na criação do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente existente
async function updateCliente(request: NextRequest) {
  try {
    const auth = await authorizeApiRequest(request, [...CLIENTES_WRITE_ROLES]);
    if (!auth.authorized) return auth.response;

    const {
      id,
      nome,
      email,
      telefone,
      cpf_cnpj,
      endereco,
      cidade,
      estado,
      cep,
    } = await request.json();

    if (!id || !nome || !email) {
      return NextResponse.json(
        { error: 'ID, nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar email duplicado (outro ID)
    const clienteEmail = await prisma.cliente.findFirst({
      where: {
        email,
        id: { not: id },
      },
    });

    if (clienteEmail) {
      return NextResponse.json(
        { error: 'Email já está em uso por outro cliente' },
        { status: 409 }
      );
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        telefone: telefone?.trim() || null,
        cpfCnpj: cpf_cnpj ? cpf_cnpj.replace(/\D/g, '') : null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
        cep: cep?.replace(/\D/g, '') || null,
      },
    });

    const responseData = mapClienteToResponse(clienteAtualizado);

    return NextResponse.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: responseData,
    });
  } catch (error) {
    console.error('Erro na atualização do cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover cliente
async function deleteCliente(request: NextRequest) {
  try {
    const auth = await authorizeApiRequest(request, ['admin', 'diretor', 'gerente_adm']);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const clienteExistente = await prisma.cliente.findUnique({ where: { id } });

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    await prisma.cliente.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Cliente excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Exportações com cache, logging e métricas aplicados
export const GET = withUserCache(CACHE_TTL.MEDIUM)(getClientes);
export const POST = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(createCliente)
);
export const PUT = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(updateCliente)
);
export const DELETE = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(deleteCliente)
);
