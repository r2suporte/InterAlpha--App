import { NextRequest, NextResponse } from 'next/server';

import { withUserCache } from '@/lib/middleware/cache-middleware';
import {
  ApiLogger,
  withAuthenticatedApiLogging,
} from '@/lib/middleware/logging-middleware';
import {
  ApiMetricsCollector,
  withAuthenticatedApiMetrics,
} from '@/lib/middleware/metrics-middleware';
import { CACHE_TTL } from '@/lib/services/cache-service';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Listar clientes (com cache)
async function getClientes(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const safeLimit = Math.min(limit, 50);
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

    // Mapear campos de ordenação (snake_case -> camelCase)
    const orderByMap: Record<string, string> = {
      created_at: 'createdAt',
      updated_at: 'updatedAt',
      nome: 'nome',
      email: 'email',
    };

    const mappedSortField = orderByMap[sortField] || sortField;

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

    // Mapear retorno para manter compatibilidade com frontend (snake_case)
    const clientesMapped = clientes.map(c => ({
      ...c,
      cpf_cnpj: c.cpfCnpj,
      numero_cliente: c.numeroCliente,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    }));

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
    const clienteExistente = await prisma.cliente.findUnique({
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
      const lastNumber = parseInt(lastCliente.numeroCliente.substring(6));
      nextNumber = lastNumber + 1;
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

    // Map response to snake_case for compatibility if needed, though pure Prisma return is usually fine
    // But frontend expects numero_cliente
    const responseData = {
      ...novoCliente,
      numero_cliente: novoCliente.numeroCliente,
      cpf_cnpj: novoCliente.cpfCnpj,
      created_at: novoCliente.createdAt,
      updated_at: novoCliente.updatedAt,
    };

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
        email: email,
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

    const responseData = {
      ...clienteAtualizado,
      numero_cliente: clienteAtualizado.numeroCliente,
      cpf_cnpj: clienteAtualizado.cpfCnpj,
      created_at: clienteAtualizado.createdAt,
      updated_at: clienteAtualizado.updatedAt,
    };

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

// Exportações com cache, logging e métricas aplicados
export const GET = withUserCache(CACHE_TTL.MEDIUM)(getClientes);
export const POST = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(createCliente)
);
export const PUT = withAuthenticatedApiMetrics(
  withAuthenticatedApiLogging(updateCliente)
);
