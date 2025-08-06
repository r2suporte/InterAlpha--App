import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsService } from '@/services/analytics/analytics-service';
import { getReportExportService } from '@/services/analytics/report-export-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format: exportFormat, filters, title } = body;

    if (!exportFormat || !filters) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: format, filters' },
        { status: 400 }
      );
    }

    const analyticsService = getAnalyticsService();
    const exportService = getReportExportService();

    // Gerar dados do relatório
    const [kpis, paymentMethodsChart, orderStatusChart, monthlyRevenueChart] = await Promise.all([
      analyticsService.calculateKPIs(filters),
      analyticsService.generateChartData('payment-methods', filters),
      analyticsService.generateChartData('order-status', filters),
      analyticsService.generateChartData('monthly-revenue', filters),
    ]);

    const reportData = {
      title: title || 'Relatório de Analytics - InterAlpha',
      period: `${format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`,
      kpis,
      charts: {
        paymentMethods: paymentMethodsChart,
        orderStatus: orderStatusChart,
        monthlyRevenue: monthlyRevenueChart,
      },
      filters,
      generatedAt: new Date(),
    };

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (exportFormat) {
      case 'pdf':
        buffer = await exportService.exportToPDF(reportData);
        contentType = 'application/pdf';
        filename = `relatorio-analytics-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
        break;

      case 'excel':
        buffer = await exportService.exportToExcel(reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `relatorio-analytics-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;
        break;

      case 'csv-kpis':
        buffer = await exportService.exportToCSV(reportData, 'kpis');
        contentType = 'text/csv';
        filename = `kpis-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
        break;

      case 'csv-payments':
        buffer = await exportService.exportToCSV(reportData, 'payments');
        contentType = 'text/csv';
        filename = `pagamentos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
        break;

      case 'csv-orders':
        buffer = await exportService.exportToCSV(reportData, 'orders');
        contentType = 'text/csv';
        filename = `ordens-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Formato de exportação não suportado' },
          { status: 400 }
        );
    }

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erro na exportação de relatório:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para gerar relatório completo com todos os formatos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const title = searchParams.get('title');

    // Definir período padrão (últimos 30 dias)
    const defaultEnd = new Date();
    const defaultStart = new Date(defaultEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filters = {
      dateRange: {
        start: startDate ? new Date(startDate) : defaultStart,
        end: endDate ? new Date(endDate) : defaultEnd,
      },
    };

    const analyticsService = getAnalyticsService();
    const exportService = getReportExportService();

    // Gerar dados do relatório
    const [kpis, paymentMethodsChart, orderStatusChart, monthlyRevenueChart] = await Promise.all([
      analyticsService.calculateKPIs(filters),
      analyticsService.generateChartData('payment-methods', filters),
      analyticsService.generateChartData('order-status', filters),
      analyticsService.generateChartData('monthly-revenue', filters),
    ]);

    const reportData = {
      title: title || 'Relatório Completo de Analytics - InterAlpha',
      period: `${format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}`,
      kpis,
      charts: {
        paymentMethods: paymentMethodsChart,
        orderStatus: orderStatusChart,
        monthlyRevenue: monthlyRevenueChart,
      },
      filters,
      generatedAt: new Date(),
    };

    // Gerar todos os formatos
    const reports = await exportService.generateCompleteReport(reportData);

    // Retornar informações sobre os relatórios gerados
    return NextResponse.json({
      message: 'Relatórios gerados com sucesso',
      files: {
        pdf: {
          size: reports.pdf.length,
          filename: `relatorio-completo-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`,
        },
        excel: {
          size: reports.excel.length,
          filename: `relatorio-completo-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`,
        },
        csvKpis: {
          size: reports.csvKpis.length,
          filename: `kpis-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`,
        },
        csvPayments: {
          size: reports.csvPayments.length,
          filename: `pagamentos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`,
        },
        csvOrders: {
          size: reports.csvOrders.length,
          filename: `ordens-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`,
        },
      },
      reportData: {
        title: reportData.title,
        period: reportData.period,
        generatedAt: reportData.generatedAt,
        kpis: reportData.kpis,
      },
    });

  } catch (error) {
    console.error('Erro na geração de relatório completo:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}