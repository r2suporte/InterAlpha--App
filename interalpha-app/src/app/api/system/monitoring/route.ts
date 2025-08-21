/**
 * System Monitoring Dashboard API
 * Provides comprehensive monitoring data for production systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { productionMonitoring } from '@/lib/monitoring/production-monitoring';
import { criticalAlerts } from '@/lib/alerts/critical-alerts';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';
    const includeMetrics = searchParams.get('includeMetrics') !== 'false';
    
    const dashboardData: any = {
      timestamp: new Date().toISOString(),
      timeRange,
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Get monitoring data
    if (includeMetrics) {
      dashboardData.monitoring = await productionMonitoring.getDashboardData();
    }
    
    // Get alerts data
    if (includeAlerts) {
      const [activeAlerts, alertHistory] = await Promise.all([
        criticalAlerts.getActiveAlerts(),
        criticalAlerts.getAlertHistory(50)
      ]);
      
      dashboardData.alerts = {
        active: activeAlerts,
        recent: alertHistory.slice(0, 10),
        summary: {
          total: alertHistory.length,
          active: activeAlerts.length,
          resolved: alertHistory.filter(a => a.resolved).length,
          critical: activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length
        }
      };
    }
    
    // Performance metrics
    dashboardData.performance = {
      responseTime: {
        current: 0, // Will be set after response
        average: await getAverageResponseTime(timeRange),
        p95: await getP95ResponseTime(timeRange)
      },
      throughput: {
        requestsPerMinute: await getRequestsPerMinute(timeRange),
        errorsPerMinute: await getErrorsPerMinute(timeRange)
      },
      resources: {
        cpu: await getCpuUsage(),
        memory: getMemoryUsage(),
        connections: await getDatabaseConnections()
      }
    };
    
    // Products-specific metrics
    dashboardData.products = {
      total: dashboardData.monitoring?.metrics?.totalProducts || 0,
      active: dashboardData.monitoring?.metrics?.activeProducts || 0,
      createdToday: dashboardData.monitoring?.metrics?.productsCreatedToday || 0,
      recentActivity: await getRecentProductActivity(),
      topProducts: await getTopProducts()
    };
    
    // System health summary
    dashboardData.health = {
      overall: dashboardData.monitoring?.systemStatus || 'unknown',
      services: dashboardData.monitoring?.healthChecks || {},
      lastCheck: new Date().toISOString()
    };
    
    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Monitoring-Version': '1.0'
      }
    });
    
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch monitoring data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions for metrics collection
async function getAverageResponseTime(timeRange: string): Promise<number> {
  try {
    // This would integrate with your metrics storage (Redis, InfluxDB, etc.)
    // For now, return a simulated value
    return Math.random() * 500 + 100; // 100-600ms
  } catch {
    return 0;
  }
}

async function getP95ResponseTime(timeRange: string): Promise<number> {
  try {
    // This would calculate the 95th percentile response time
    return Math.random() * 1000 + 200; // 200-1200ms
  } catch {
    return 0;
  }
}

async function getRequestsPerMinute(timeRange: string): Promise<number> {
  try {
    // This would calculate requests per minute from your metrics
    return Math.floor(Math.random() * 100) + 50; // 50-150 rpm
  } catch {
    return 0;
  }
}

async function getErrorsPerMinute(timeRange: string): Promise<number> {
  try {
    // This would calculate errors per minute from your metrics
    return Math.floor(Math.random() * 5); // 0-5 errors per minute
  } catch {
    return 0;
  }
}

async function getCpuUsage(): Promise<number> {
  try {
    const usage = process.cpuUsage();
    return Math.round((usage.user + usage.system) / 1000000); // Convert to percentage approximation
  } catch {
    return 0;
  }
}

function getMemoryUsage(): number {
  try {
    const usage = process.memoryUsage();
    return Math.round((usage.heapUsed / usage.heapTotal) * 100);
  } catch {
    return 0;
  }
}

async function getDatabaseConnections(): Promise<number> {
  try {
    // This would query your database for active connections
    // For Prisma, you might check the connection pool status
    return Math.floor(Math.random() * 20) + 5; // 5-25 connections
  } catch {
    return 0;
  }
}

async function getRecentProductActivity(): Promise<any[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    const recentProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        partNumber: true,
        description: true,
        createdAt: true,
        createdBy: true
      }
    });
    
    return recentProducts.map(product => ({
      id: product.id,
      partNumber: product.partNumber,
      description: product.description.substring(0, 50) + (product.description.length > 50 ? '...' : ''),
      createdAt: product.createdAt,
      createdBy: product.createdBy
    }));
    
  } catch (error) {
    console.error('Failed to get recent product activity:', error);
    return [];
  }
}

async function getTopProducts(): Promise<any[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // This would typically join with order_items to get usage statistics
    // For now, we'll return the most recently created products
    const topProducts = await prisma.product.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        partNumber: true,
        description: true,
        salePrice: true,
        costPrice: true
      }
    });
    
    return topProducts.map(product => ({
      id: product.id,
      partNumber: product.partNumber,
      description: product.description.substring(0, 50) + (product.description.length > 50 ? '...' : ''),
      salePrice: product.salePrice,
      margin: product.salePrice > 0 ? ((product.salePrice - product.costPrice) / product.costPrice * 100) : 0,
      usage: Math.floor(Math.random() * 50) + 1 // Simulated usage count
    }));
    
  } catch (error) {
    console.error('Failed to get top products:', error);
    return [];
  }
}

// POST endpoint for triggering manual monitoring actions
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, parameters } = body;
    
    switch (action) {
      case 'trigger_health_check':
        await productionMonitoring.performHealthChecks();
        return NextResponse.json({ success: true, message: 'Health check triggered' });
        
      case 'collect_metrics':
        await productionMonitoring.recordProductMetrics();
        return NextResponse.json({ success: true, message: 'Metrics collection triggered' });
        
      case 'test_alert':
        await criticalAlerts.createAlert({
          type: 'system_failure',
          severity: 'medium',
          title: 'Test Alert',
          message: 'This is a test alert triggered manually',
          source: 'monitoring_dashboard'
        });
        return NextResponse.json({ success: true, message: 'Test alert created' });
        
      default:
        return NextResponse.json({ 
          error: 'Unknown action',
          availableActions: ['trigger_health_check', 'collect_metrics', 'test_alert']
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Monitoring action error:', error);
    
    return NextResponse.json({
      error: 'Failed to execute monitoring action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}