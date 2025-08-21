import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar ordem de serviço Apple específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const ordem = await prisma.ordemServicoApple.findUnique({
      where: { id },
      include: {
        acoes: {
          orderBy: { dataHora: 'desc' }
        },
        pecasSubstituidas: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!ordem) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Converter para o formato esperado pelo frontend
    const ordemFormatada: OrdemServicoApple = {
      id: ordem.id,
      numero: ordem.numero,
      
      cliente: {
        nome: ordem.clienteNome,
        email: ordem.clienteEmail,
        telefone: ordem.clienteTelefone || '',
        endereco: ordem.clienteEndereco || ''
      },
      
      dispositivo: {
        modelo: ordem.dispositivoModelo,
        numeroSerie: ordem.dispositivoNumeroSerie,
        capacidade: ordem.dispositivoCapacidade || '',
        cor: ordem.dispositivoCor || '',
        imei: ordem.dispositivoImei || '',
        versaoiOS: ordem.dispositivoVersaoiOS || '',
        estadoFisico: ordem.dispositivoEstadoFisico as any,
        acessorios: ordem.dispositivoAcessorios || []
      },
      
      problema: {
        descricao: ordem.problemaDescricao,
        sintomas: ordem.problemaSintomas || [],
        frequencia: ordem.problemaFrequencia as any,
        condicoes: ordem.problemaCondicoes || '',
        tentativasReparo: ordem.problemaTentativasReparo
      },
      
      garantia: {
        tipo: ordem.garantiaTipo as any,
        periodo: ordem.garantiaPeriodo,
        dataInicio: ordem.garantiaDataInicio,
        dataFim: ordem.garantiaDataFim,
        condicoes: ordem.garantiaCondicoes || [],
        coberturas: ordem.garantiaCoberturas || [],
        exclusoes: ordem.garantiaExclusoes || [],
        dataCompraDispositivo: ordem.garantiaDataCompraDispositivo,
        statusGarantiaApple: ordem.garantiaStatusGarantiaApple as any,
        numeroSerieApple: ordem.garantiaNumeroSerieApple,
        servicoInterAlpha: ordem.garantiaServicoInterAlpha as any
      },
      
      acoes: ordem.acoes.map(acao => ({
        id: acao.id,
        descricao: acao.descricao,
        tecnico: acao.tecnico,
        dataHora: acao.dataHora,
        tempo: acao.tempo,
        resultado: acao.resultado as any,
        observacoes: acao.observacoes
      })),
      
      pecasSubstituidas: ordem.pecasSubstituidas.map(peca => ({
        id: peca.id,
        codigo: peca.codigo,
        nome: peca.nome,
        categoria: peca.categoria as any,
        preco: peca.preco,
        fornecedor: peca.fornecedor,
        garantia: peca.garantia,
        numeroSerie: peca.numeroSerie
      })),
      
      maoDeObra: {
        categoria: 'Básica' as any, // TODO: Implementar no banco
        tempoEstimado: 60,
        tempoReal: ordem.acoes.reduce((total, acao) => total + acao.tempo, 0),
        valorHora: 80,
        tecnico: ordem.tecnicoResponsavel,
        complexidade: 1 as any
      },
      
      observacoes: {
        backupNecessario: ordem.observacoesBackupNecessario || false,
        senhaIdApple: ordem.observacoesSenhaIdApple,
        dadosImportantes: ordem.observacoesDadosImportantes || [],
        restricoes: ordem.observacoesRestricoes || [],
        recomendacoes: ordem.observacoesRecomendacoes || [],
        observacoesGerais: ordem.observacoesGerais || ''
      },
      
      valorPecas: ordem.valorPecas,
      valorMaoDeObra: ordem.valorMaoDeObra,
      valorTotal: ordem.valorTotal,
      desconto: ordem.desconto,
      
      status: ordem.status as any,
      prioridade: ordem.prioridade as any,
      
      dataRecebimento: ordem.dataRecebimento,
      dataPrevisao: ordem.dataPrevisao,
      dataConclusao: ordem.dataConclusao,
      dataEntrega: ordem.dataEntrega,
      
      tecnicoResponsavel: ordem.tecnicoResponsavel,
      criadoPor: ordem.criadoPor,
      atualizadoPor: ordem.atualizadoPor,
      createdAt: ordem.createdAt,
      updatedAt: ordem.updatedAt
    }

    return NextResponse.json(ordemFormatada)

  } catch (error) {
    console.error('Erro ao buscar ordem de serviço Apple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar ordem de serviço Apple
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data: Partial<OrdemServicoApple> = await request.json()

    // Verificar se a ordem existe
    const ordemExistente = await prisma.ordemServicoApple.findUnique({
      where: { id }
    })

    if (!ordemExistente) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar ordem de serviço
    const ordem = await prisma.ordemServicoApple.update({
      where: { id },
      data: {
        status: data.status,
        prioridade: data.prioridade,
        
        // Cliente
        clienteNome: data.cliente?.nome,
        clienteEmail: data.cliente?.email,
        clienteTelefone: data.cliente?.telefone,
        clienteEndereco: data.cliente?.endereco,
        
        // Dispositivo
        dispositivoModelo: data.dispositivo?.modelo,
        dispositivoNumeroSerie: data.dispositivo?.numeroSerie,
        dispositivoCapacidade: data.dispositivo?.capacidade,
        dispositivoCor: data.dispositivo?.cor,
        dispositivoImei: data.dispositivo?.imei,
        dispositivoVersaoiOS: data.dispositivo?.versaoiOS,
        dispositivoEstadoFisico: data.dispositivo?.estadoFisico,
        dispositivoAcessorios: data.dispositivo?.acessorios,
        
        // Problema
        problemaDescricao: data.problema?.descricao,
        problemaSintomas: data.problema?.sintomas,
        problemaFrequencia: data.problema?.frequencia,
        problemaCondicoes: data.problema?.condicoes,
        problemaTentativasReparo: data.problema?.tentativasReparo,
        
        // Garantia
        garantiaTipo: data.garantia?.tipo,
        garantiaPeriodo: data.garantia?.periodo,
        garantiaDataInicio: data.garantia?.dataInicio,
        garantiaDataFim: data.garantia?.dataFim,
        garantiaCondicoes: data.garantia?.condicoes,
        garantiaCoberturas: data.garantia?.coberturas,
        garantiaExclusoes: data.garantia?.exclusoes,
        garantiaDataCompraDispositivo: data.garantia?.dataCompraDispositivo,
        garantiaStatusGarantiaApple: data.garantia?.statusGarantiaApple,
        garantiaNumeroSerieApple: data.garantia?.numeroSerieApple,
        garantiaServicoInterAlpha: data.garantia?.servicoInterAlpha,
        
        // Valores
        valorPecas: data.valorPecas,
        valorMaoDeObra: data.valorMaoDeObra,
        valorTotal: data.valorTotal,
        desconto: data.desconto,
        
        // Observações
        observacoesBackupNecessario: data.observacoes?.backupNecessario,
        observacoesSenhaIdApple: data.observacoes?.senhaIdApple,
        observacoesDadosImportantes: data.observacoes?.dadosImportantes,
        observacoesRestricoes: data.observacoes?.restricoes,
        observacoesRecomendacoes: data.observacoes?.recomendacoes,
        observacoesGerais: data.observacoes?.observacoesGerais,
        
        // Datas
        dataPrevisao: data.dataPrevisao,
        dataConclusao: data.dataConclusao,
        dataEntrega: data.dataEntrega,
        
        // Controle
        tecnicoResponsavel: data.tecnicoResponsavel,
        atualizadoPor: userId,
        updatedAt: new Date()
      },
      include: {
        acoes: true,
        pecasSubstituidas: true
      }
    })

    return NextResponse.json(ordem)

  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço Apple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir ordem de serviço Apple
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se a ordem existe
    const ordemExistente = await prisma.ordemServicoApple.findUnique({
      where: { id }
    })

    if (!ordemExistente) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Excluir ordem de serviço (cascade irá excluir ações e peças relacionadas)
    await prisma.ordemServicoApple.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Ordem de serviço excluída com sucesso' })

  } catch (error) {
    console.error('Erro ao excluir ordem de serviço Apple:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}