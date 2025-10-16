import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { KPIData, ChartData, AnalyticsFilters } from './analytics-service';

export interface ReportData {
  title: string;
  period: string;
  kpis: KPIData;
  charts: {
    paymentMethods: ChartData[];
    orderStatus: ChartData[];
    monthlyRevenue: ChartData[];
  };
  filters: AnalyticsFilters;
  generatedAt: Date;
}

export class ReportExportService {
  
  // Exportar relatório em PDF
  async exportToPDF(data: ReportData): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Configurar fonte
    doc.setFont('helvetica');

    // Título
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(data.title, margin, yPosition);
    yPosition += 15;

    // Período
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${data.period}`, margin, yPosition);
    yPosition += 10;

    doc.text(`Gerado em: ${format(data.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, yPosition);
    yPosition += 20;

    // KPIs
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Indicadores Principais', margin, yPosition);
    yPosition += 15;

    const kpiData = [
      ['Receita Total', this.formatCurrency(data.kpis.revenue)],
      ['Ordens Ativas', data.kpis.activeOrders.toString()],
      ['Ordens Concluídas', data.kpis.completedOrders.toString()],
      ['Taxa de Conversão', `${data.kpis.conversionRate.toFixed(1)}%`],
      ['Ticket Médio', this.formatCurrency(data.kpis.averageTicket)],
      ['Total de Clientes', data.kpis.totalClients.toString()],
      ['Novos Clientes', data.kpis.newClients.toString()],
      ['Pagamentos Pendentes', data.kpis.pendingPayments.toString()],
      ['Pagamentos em Atraso', data.kpis.overduePayments.toString()],
    ];

    doc.setFontSize(10);
    kpiData.forEach(([label, value]) => {
      doc.text(`${label}:`, margin, yPosition);
      doc.text(value, margin + 80, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Métodos de Pagamento
    if (data.charts.paymentMethods.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Métodos de Pagamento', margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      data.charts.paymentMethods.forEach(item => {
        doc.text(`${item.name}:`, margin, yPosition);
        doc.text(`${this.formatCurrency(item.value)} (${item.percentage?.toFixed(1)}%)`, margin + 80, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Status das Ordens
    if (data.charts.orderStatus.length > 0) {
      doc.setFontSize(14);
      doc.text('Status das Ordens', margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      data.charts.orderStatus.forEach(item => {
        doc.text(`${item.name}:`, margin, yPosition);
        doc.text(`${item.value} ordens (${item.percentage?.toFixed(1)}%)`, margin + 80, yPosition);
        yPosition += 8;
      });
    }

    // Nova página se necessário
    if (yPosition > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Receita Mensal
    if (data.charts.monthlyRevenue.length > 0) {
      doc.setFontSize(14);
      doc.text('Receita Mensal', margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      data.charts.monthlyRevenue.forEach(item => {
        doc.text(`${item.name}:`, margin, yPosition);
        doc.text(this.formatCurrency(item.value), margin + 80, yPosition);
        yPosition += 8;
      });
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `InterAlpha - Relatório de Analytics - Página ${i} de ${pageCount}`,
        margin,
        doc.internal.pageSize.height - 10
      );
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  // Exportar relatório em Excel
  async exportToExcel(data: ReportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InterAlpha';
    workbook.created = new Date();

    // Aba 1: KPIs
    const kpisSheet = workbook.addWorksheet('KPIs');
    kpisSheet.columns = [
      { header: 'Indicador', key: 'indicator', width: 25 },
      { header: 'Valor', key: 'value', width: 20 }
    ];

    const kpisData = [
      { indicator: 'Receita Total', value: data.kpis.revenue },
      { indicator: 'Ordens Ativas', value: data.kpis.activeOrders },
      { indicator: 'Ordens Concluídas', value: data.kpis.completedOrders },
      { indicator: 'Taxa de Conversão (%)', value: data.kpis.conversionRate },
      { indicator: 'Satisfação do Cliente (%)', value: data.kpis.customerSatisfaction },
      { indicator: 'Ticket Médio', value: data.kpis.averageTicket },
      { indicator: 'Total de Clientes', value: data.kpis.totalClients },
      { indicator: 'Novos Clientes', value: data.kpis.newClients },
      { indicator: 'Pagamentos Pendentes', value: data.kpis.pendingPayments },
      { indicator: 'Pagamentos em Atraso', value: data.kpis.overduePayments },
    ];

    kpisSheet.addRows(kpisData);
    kpisSheet.getRow(1).font = { bold: true };

    // Aba 2: Métodos de Pagamento
    if (data.charts.paymentMethods.length > 0) {
      const paymentMethodsSheet = workbook.addWorksheet('Métodos de Pagamento');
      paymentMethodsSheet.columns = [
        { header: 'Método', key: 'method', width: 20 },
        { header: 'Valor', key: 'value', width: 15 },
        { header: 'Percentual', key: 'percentage', width: 15 }
      ];

      const paymentMethodsData = data.charts.paymentMethods.map(item => ({
        method: item.name,
        value: item.value,
        percentage: `${item.percentage?.toFixed(2) || '0'  }%`
      }));

      paymentMethodsSheet.addRows(paymentMethodsData);
      paymentMethodsSheet.getRow(1).font = { bold: true };
    }

    // Aba 3: Status das Ordens
    if (data.charts.orderStatus.length > 0) {
      const orderStatusSheet = workbook.addWorksheet('Status das Ordens');
      orderStatusSheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Quantidade', key: 'quantity', width: 15 },
        { header: 'Percentual', key: 'percentage', width: 15 }
      ];

      const orderStatusData = data.charts.orderStatus.map(item => ({
        status: item.name,
        quantity: item.value,
        percentage: `${item.percentage?.toFixed(2) || '0'  }%`
      }));

      orderStatusSheet.addRows(orderStatusData);
      orderStatusSheet.getRow(1).font = { bold: true };
    }

    // Aba 4: Receita Mensal
    if (data.charts.monthlyRevenue.length > 0) {
      const monthlyRevenueSheet = workbook.addWorksheet('Receita Mensal');
      monthlyRevenueSheet.columns = [
        { header: 'Mês', key: 'month', width: 15 },
        { header: 'Receita', key: 'revenue', width: 20 }
      ];

      const monthlyRevenueData = data.charts.monthlyRevenue.map(item => ({
        month: item.name,
        revenue: item.value
      }));

      monthlyRevenueSheet.addRows(monthlyRevenueData);
      monthlyRevenueSheet.getRow(1).font = { bold: true };
    }

    // Aba 5: Informações do Relatório
    const infoSheet = workbook.addWorksheet('Informações');
    infoSheet.columns = [
      { header: 'Campo', key: 'field', width: 25 },
      { header: 'Valor', key: 'value', width: 30 }
    ];

    const infoData = [
      { field: 'Relatório', value: data.title },
      { field: 'Período', value: data.period },
      { field: 'Gerado em', value: format(data.generatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR }) },
      { field: 'Filtros Aplicados', value: '' },
      { field: 'Data Início', value: format(data.filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR }) },
      { field: 'Data Fim', value: format(data.filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR }) },
      ...(data.filters.clientId ? [{ field: 'Cliente ID', value: data.filters.clientId }] : []),
      ...(data.filters.serviceType ? [{ field: 'Tipo de Serviço', value: data.filters.serviceType }] : []),
      ...(data.filters.status ? [{ field: 'Status', value: data.filters.status }] : []),
      ...(data.filters.paymentMethod ? [{ field: 'Método de Pagamento', value: data.filters.paymentMethod }] : []),
    ];

    infoSheet.addRows(infoData);
    infoSheet.getRow(1).font = { bold: true };

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Exportar dados brutos em CSV
  async exportToCSV(data: ReportData, type: 'kpis' | 'payments' | 'orders'): Promise<Buffer> {
    let csvData: string[][] = [];

    switch (type) {
      case 'kpis':
        csvData = [
          ['Indicador', 'Valor'],
          ['Receita Total', data.kpis.revenue.toString()],
          ['Ordens Ativas', data.kpis.activeOrders.toString()],
          ['Ordens Concluídas', data.kpis.completedOrders.toString()],
          ['Taxa de Conversão (%)', data.kpis.conversionRate.toString()],
          ['Satisfação do Cliente (%)', data.kpis.customerSatisfaction.toString()],
          ['Ticket Médio', data.kpis.averageTicket.toString()],
          ['Total de Clientes', data.kpis.totalClients.toString()],
          ['Novos Clientes', data.kpis.newClients.toString()],
          ['Pagamentos Pendentes', data.kpis.pendingPayments.toString()],
          ['Pagamentos em Atraso', data.kpis.overduePayments.toString()],
        ];
        break;

      case 'payments':
        csvData = [
          ['Método', 'Valor', 'Percentual'],
          ...data.charts.paymentMethods.map(item => [
            item.name,
            item.value.toString(),
            `${item.percentage?.toFixed(2) || '0'  }%`
          ])
        ];
        break;

      case 'orders':
        csvData = [
          ['Status', 'Quantidade', 'Percentual'],
          ...data.charts.orderStatus.map(item => [
            item.name,
            item.value.toString(),
            `${item.percentage?.toFixed(2) || '0'  }%`
          ])
        ];
        break;
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return Buffer.from(csvContent, 'utf-8');
  }

  // Gerar relatório completo com todos os formatos
  async generateCompleteReport(data: ReportData): Promise<{
    pdf: Buffer;
    excel: Buffer;
    csvKpis: Buffer;
    csvPayments: Buffer;
    csvOrders: Buffer;
  }> {
    const [pdf, excel, csvKpis, csvPayments, csvOrders] = await Promise.all([
      this.exportToPDF(data),
      this.exportToExcel(data),
      this.exportToCSV(data, 'kpis'),
      this.exportToCSV(data, 'payments'),
      this.exportToCSV(data, 'orders'),
    ]);

    return {
      pdf,
      excel,
      csvKpis,
      csvPayments,
      csvOrders,
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

// Singleton instance
let reportExportServiceInstance: ReportExportService | null = null;

export function getReportExportService(): ReportExportService {
  if (!reportExportServiceInstance) {
    reportExportServiceInstance = new ReportExportService();
  }
  return reportExportServiceInstance;
}