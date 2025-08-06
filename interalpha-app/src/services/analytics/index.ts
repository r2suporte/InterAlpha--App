// Exportações principais do serviço de analytics

// Serviços
export { AnalyticsService, getAnalyticsService } from './analytics-service';
export { ReportExportService, getReportExportService } from './report-export-service';

// Tipos
export type {
  KPIData,
  TrendData,
  ChartData,
  DateRange,
  AnalyticsFilters,
} from './analytics-service';

export type {
  ReportData,
} from './report-export-service';

// Componentes
export { KPICard } from '@/components/analytics/KPICard';
export { PieChart } from '@/components/analytics/PieChart';
export { LineChart } from '@/components/analytics/LineChart';
export { BarChart } from '@/components/analytics/BarChart';
export { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';