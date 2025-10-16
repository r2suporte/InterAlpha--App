/**
 * Serviço de Geração de PDF para Ordem de Serviço
 * Gera PDF da OS formatado e pronto para assinatura do cliente
 */

import { jsPDF } from 'jspdf';

import { formatarMoeda } from '@/types/financeiro';
import {
  LABELS_PRIORIDADE,
  LABELS_STATUS_OS,
  LABELS_TIPO_SERVICO,
  type OrdemServico,
} from '@/types/ordens-servico';

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.currentY = this.margin;
  }

  /**
   * Gera PDF completo da Ordem de Serviço
   */
  async generateOrdemServicoPDF(ordem: OrdemServico): Promise<Buffer> {
    try {
      // Reset position
      this.currentY = this.margin;

      // Cabeçalho da empresa
      this.addHeader();

      // Título do documento
      this.addTitle(ordem);

      // Informações do cliente e equipamento
      this.addClienteInfo(ordem);
      this.addEquipamentoInfo(ordem);

      // Detalhes do serviço
      this.addServicoInfo(ordem);

      // Valores
      this.addValores(ordem);

      // Termos e condições
      this.addTermosCondicoes();

      // Assinatura
      this.addAssinatura(ordem);

      // Rodapé
      this.addFooter();

      // Converter para Buffer
      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw new Error('Falha ao gerar PDF da Ordem de Serviço');
    }
  }

  /**
   * Cabeçalho da empresa
   */
  private addHeader(): void {
    // Logo/Nome da empresa
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235); // Blue-600
    this.doc.text(
      'InterAlpha Assistência Técnica',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 7;

    // Subtítulo
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(107, 114, 128); // Gray-500
    this.doc.text(
      'Especializada em Produtos Apple',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 5;

    // Informações de contato
    this.doc.setFontSize(8);
    this.doc.text(
      'Rua Exemplo, 123 - Centro - São Paulo/SP - CEP: 01234-567',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 4;

    this.doc.text(
      'Tel: (11) 1234-5678 | Email: contato@interalpha.com.br',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    // Linha separadora
    this.currentY += 5;
    this.doc.setDrawColor(37, 99, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);

    this.currentY += 10;
  }

  /**
   * Título do documento com número da OS
   */
  private addTitle(ordem: OrdemServico): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('ORDEM DE SERVIÇO', this.pageWidth / 2, this.currentY, {
      align: 'center',
    });

    this.currentY += 8;

    // Número da OS e Status
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Nº ${ordem.numero_os} | ${LABELS_STATUS_OS[ordem.status]}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 10;
  }

  /**
   * Informações do cliente
   */
  private addClienteInfo(ordem: OrdemServico): void {
    const cliente = ordem.cliente || ordem.cliente_portal;

    if (!cliente) return;

    this.addSection('Dados do Cliente');

    // Construir endereço de forma segura
    let endereco = 'N/A';
    if ('endereco' in cliente && cliente.endereco) {
      const end = cliente.endereco as any;
      endereco = `${end.logradouro || ''}, ${end.numero || ''} - ${end.bairro || ''} - ${end.cidade || ''}/${end.estado || ''}`;
    }

    const infoCliente = [
      ['Nome:', cliente.nome || 'N/A'],
      ['Email:', cliente.email || 'N/A'],
      ['Telefone:', cliente.telefone || 'N/A'],
      ['Endereço:', endereco],
    ];

    this.addInfoTable(infoCliente);
    this.currentY += 5;
  }

  /**
   * Informações do equipamento
   */
  private addEquipamentoInfo(ordem: OrdemServico): void {
    this.addSection('Dados do Equipamento');

    const {equipamento} = ordem;

    const infoEquipamento = [
      ['Tipo:', equipamento?.tipo || 'N/A'],
      ['Modelo:', equipamento?.modelo || 'N/A'],
      ['Serial Number:', equipamento?.serial_number || ordem.serial_number || 'N/A'],
      ['Problema Reportado:', ordem.problema_reportado || ordem.descricao || 'N/A'],
    ];

    this.addInfoTable(infoEquipamento);
    this.currentY += 5;
  }

  /**
   * Detalhes do serviço
   */
  private addServicoInfo(ordem: OrdemServico): void {
    this.addSection('Detalhes do Serviço');

    const infoServico = [
      ['Tipo de Serviço:', LABELS_TIPO_SERVICO[ordem.tipo_servico] || 'N/A'],
      ['Prioridade:', LABELS_PRIORIDADE[ordem.prioridade] || 'N/A'],
      ['Descrição Técnica:', ordem.descricao || 'N/A'],
      [
        'Data de Entrada:',
        ordem.created_at
          ? new Date(ordem.created_at).toLocaleDateString('pt-BR')
          : 'N/A',
      ],
      [
        'Previsão de Entrega:',
        ordem.data_previsao_conclusao
          ? new Date(ordem.data_previsao_conclusao).toLocaleDateString('pt-BR')
          : 'A definir',
      ],
    ];

    this.addInfoTable(infoServico);
    this.currentY += 5;
  }

  /**
   * Valores do serviço
   */
  private addValores(ordem: OrdemServico): void {
    this.addSection('Valores');

    const valorServico = ordem.valor_servico || 0;
    const valorPecas = ordem.valor_pecas || 0;
    const valorTotal = valorServico + valorPecas;

    const infoValores = [
      ['Valor do Serviço:', formatarMoeda(valorServico)],
      ['Valor das Peças:', formatarMoeda(valorPecas)],
      ['Valor Total:', formatarMoeda(valorTotal)],
    ];

    this.addInfoTable(infoValores);
    this.currentY += 5;
  }

  /**
   * Termos e condições
   */
  private addTermosCondicoes(): void {
    this.addSection('Termos e Condições');

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);

    const termos = [
      '1. O prazo de entrega informado é uma estimativa e pode variar conforme a complexidade do reparo.',
      '2. Peças substituídas ficam disponíveis para retirada pelo cliente por até 30 dias.',
      '3. A garantia do serviço é de 90 dias para mão de obra e conforme fabricante para peças.',
      '4. Em caso de desistência do reparo, será cobrada taxa de análise técnica.',
      '5. Equipamentos não retirados após 90 dias serão considerados abandonados.',
    ];

    const lineHeight = 5;
    const maxWidth = this.pageWidth - 2 * this.margin;

    termos.forEach((termo) => {
      const splitText = this.doc.splitTextToSize(termo, maxWidth);
      this.doc.text(splitText, this.margin, this.currentY);
      this.currentY += splitText.length * lineHeight;
    });

    this.currentY += 5;
  }

  /**
   * Área de assinatura
   */
  private addAssinatura(ordem: OrdemServico): void {
    // Verificar se há espaço suficiente, caso contrário adicionar nova página
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.currentY += 10;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      'DECLARO TER LIDO E CONCORDADO COM OS TERMOS ACIMA',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 15;

    // Linha de assinatura
    const lineWidth = 80;
    const lineX = (this.pageWidth - lineWidth) / 2;

    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(lineX, this.currentY, lineX + lineWidth, this.currentY);

    this.currentY += 5;

    // Nome do cliente
    const cliente = ordem.cliente || ordem.cliente_portal;
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      cliente?.nome || 'Nome do Cliente',
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 4;

    // Data e local
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    this.doc.text(
      `São Paulo, ${dataAtual}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
  }

  /**
   * Rodapé do documento
   */
  private addFooter(): void {
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(107, 114, 128);

    const footerY = this.pageHeight - 10;

    this.doc.text(
      `Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`,
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  /**
   * Adiciona título de seção
   */
  private addSection(title: string): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(37, 99, 235);
    this.doc.text(title, this.margin, this.currentY);

    this.currentY += 7;
  }

  /**
   * Adiciona tabela de informações
   */
  private addInfoTable(data: string[][]): void {
    this.doc.setFontSize(9);
    this.doc.setTextColor(0, 0, 0);

    const colWidth = (this.pageWidth - 2 * this.margin) / 2;
    const lineHeight = 6;

    data.forEach(([label, value]) => {
      // Label (negrito)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin, this.currentY);

      // Valor (normal)
      this.doc.setFont('helvetica', 'normal');
      const splitValue = this.doc.splitTextToSize(
        value,
        colWidth - 5
      );
      this.doc.text(splitValue, this.margin + colWidth, this.currentY);

      this.currentY += Math.max(lineHeight, splitValue.length * lineHeight);
    });
  }

  /**
   * Gera nome do arquivo PDF
   */
  static generateFileName(ordem: OrdemServico): string {
    const cliente = ordem.cliente || ordem.cliente_portal;
    const clienteNome =
      cliente?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
    const numeroOS = ordem.numero_os.replace(/[^a-zA-Z0-9]/g, '_');
    const data = new Date().toISOString().split('T')[0];

    return `OS_${numeroOS}_${clienteNome}_${data}.pdf`;
  }
}

export default PDFGenerator;
