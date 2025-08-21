import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'

// GET - Listar ordens de serviço Apple
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      // Adicionar filtro por tipo Apple se necessário
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } },
        { dispositivo: { modelo: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Buscar ordens de serviço
    const [ordens, total] = await Promise.all([
      prisma.ordemServicoApple.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cliente: true,
          dispositivo: true,
          garantia: true,
          acoes: true,
          pecasSubstituidas: true,
          observacoes: true
        }
      }),
      prisma.ordemServicoApple.count({ where })
    ])

    return NextResponse.json({
      ordens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar ordens de serviço Apple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova ordem de serviço Apple
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data: OrdemServicoApple = await request.json()

    // Validações básicas
    if (!data.cliente?.nome || !data.cliente?.email) {
      return NextResponse.json(
        { error: 'Dados do cliente são obrigatórios' },
        { status: 400 }
      )
    }

    if (!data.dispositivo?.modelo || !data.dispositivo?.numeroSerie) {
      return NextResponse.json(
        { error: 'Dados do dispositivo são obrigatórios' },
        { status: 400 }
      )
    }

    // O número será gerado automaticamente baseado no numeroSequencial
    // Não precisamos definir o numero aqui, será gerado após a criação

    // Criar ordem de serviço no banco (sem número inicialmente)
    const ordem = await prisma.ordemServicoApple.create({
      data: {
        numero: '', // Será atualizado após a criação
        status: data.status || 'Recebido',
        prioridade: data.prioridade || 'Normal',
        
        // Cliente
        clienteNome: data.cliente.nome,
        clienteEmail: data.cliente.email,
        clienteTelefone: data.cliente.telefone,
        clienteEndereco: data.cliente.endereco,
        
        // Dispositivo
        dispositivoModelo: data.dispositivo.modelo,
        dispositivoNumeroSerie: data.dispositivo.numeroSerie,
        dispositivoCapacidade: data.dispositivo.capacidade,
        dispositivoCor: data.dispositivo.cor,
        dispositivoImei: data.dispositivo.imei,
        dispositivoVersaoiOS: data.dispositivo.versaoiOS,
        dispositivoEstadoFisico: data.dispositivo.estadoFisico,
        dispositivoAcessorios: data.dispositivo.acessorios,
        
        // Problema
        problemaDescricao: data.problema.descricao,
        problemaSintomas: data.problema.sintomas,
        problemaFrequencia: data.problema.frequencia,
        problemaCondicoes: data.problema.condicoes,
        problemaTentativasReparo: data.problema.tentativasReparo,
        
        // Garantia
        garantiaTipo: data.garantia.tipo,
        garantiaPeriodo: data.garantia.periodo,
        garantiaDataInicio: data.garantia.dataInicio,
        garantiaDataFim: data.garantia.dataFim,
        garantiaCondicoes: data.garantia.condicoes,
        garantiaCoberturas: data.garantia.coberturas,
        garantiaExclusoes: data.garantia.exclusoes,
        garantiaDataCompraDispositivo: data.garantia.dataCompraDispositivo,
        garantiaStatusGarantiaApple: data.garantia.statusGarantiaApple,
        garantiaNumeroSerieApple: data.garantia.numeroSerieApple,
        garantiaServicoInterAlpha: data.garantia.servicoInterAlpha,
        
        // Valores
        valorPecas: data.valorPecas || 0,
        valorMaoDeObra: data.valorMaoDeObra || 0,
        valorTotal: data.valorTotal || 0,
        desconto: data.desconto || 0,
        
        // Observações
        observacoesBackupNecessario: data.observacoes.backupNecessario,
        observacoesSenhaIdApple: data.observacoes.senhaIdApple,
        observacoesDadosImportantes: data.observacoes.dadosImportantes,
        observacoesRestricoes: data.observacoes.restricoes,
        observacoesRecomendacoes: data.observacoes.recomendacoes,
        observacoesGerais: data.observacoes.observacoesGerais,
        
        // Datas
        dataRecebimento: data.dataRecebimento || new Date(),
        dataPrevisao: data.dataPrevisao,
        dataConclusao: data.dataConclusao,
        dataEntrega: data.dataEntrega,
        
        // Controle
        tecnicoResponsavel: data.tecnicoResponsavel || '',
        criadoPor: data.criadoPor || userId,
        atualizadoPor: data.atualizadoPor || userId,
        
        // Ações e peças serão criadas separadamente se fornecidas
        acoes: data.acoes ? {
          create: data.acoes.map(acao => ({
            descricao: acao.descricao,
            tecnico: acao.tecnico,
            dataHora: acao.dataHora,
            tempo: acao.tempo,
            resultado: acao.resultado,
            observacoes: acao.observacoes
          }))
        } : undefined,
        
        pecasSubstituidas: data.pecasSubstituidas ? {
          create: data.pecasSubstituidas.map(peca => ({
            codigo: peca.codigo,
            nome: peca.nome,
            categoria: peca.categoria,
            preco: peca.preco,
            fornecedor: peca.fornecedor,
            garantia: peca.garantia,
            numeroSerie: peca.numeroSerie
          }))
        } : undefined
      },
      include: {
        acoes: true,
        pecasSubstituidas: true
      }
    })

    // Atualizar o número da ordem com base no ID sequencial
    const numeroFormatado = `OS-${ordem.numeroSequencial.toString().padStart(6, '0')}`
    
    const ordemAtualizada = await prisma.ordemServicoApple.update({
      where: { id: ordem.id },
      data: { numero: numeroFormatado },
      include: {
        acoes: true,
        pecasSubstituidas: true
      }
    })

    return NextResponse.json(ordemAtualizada, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar ordem de serviço Apple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}