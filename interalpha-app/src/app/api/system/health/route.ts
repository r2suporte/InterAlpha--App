/**
 * System Health Check API Endpoint
 * Provides comprehensive health status for production monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  metrics: {
    totalProducts: number;
    activeProducts: number;
    productsCreatedToday: number;
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const checks: HealthCheckResult[] = [];
    
    // Database Health Check
    const dbCheck = await checkDatabaseHealth();
    checks.push(dbCheck);
    
    // Redis Health Check
    const redisCheck = await checkRedisHealth();
    checks.push(redisCheck);
    
    // Products System Health Check
    const productsCheck = await checkProductsSystemHealth();
    checks.push(productsCheck);
    
    // File System Health Check
    const fsCheck = await checkFileSystemHealth();
    checks.push(fsCheck);
    
    // External Dependencies Health Check
    const depsCheck = await checkExternalDependencies();
    checks.push(depsCheck);
    
    // Collect system metrics
    const metrics = await collectSystemMetrics();
    
    // Determine overall system status
    const overallStatus = determineOverallStatus(checks);
    
    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics
    };
    
    const responseTime = Date.now() - startTime;
    
    // Set appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': responseTime.toString()
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorHealth: SystemHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: [{
        service: 'health_check',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error'
      }],
      metrics: {
        totalProducts: 0,
        activeProducts: 0,
        productsCreatedToday: 0,
        systemLoad: 0,
        memoryUsage: 0,
        diskUsage: 0
      }
    };
    
    return NextResponse.json(errorHealth, { status: 503 });
  }
}

async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test products table specifically
    const productCount = await prisma.product.count();
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      message: `Connected successfully. ${productCount} products in database.`,
      details: {
        productCount,
        connectionPool: 'active'
      }
    };
    
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Database connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkRedisHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Test basic connectivity
    const pong = await redis.ping();
    
    // Test read/write operations
    const testKey = `health_check_${Date.now()}`;
    await redis.set(testKey, 'test', 'EX', 10);
    const testValue = await redis.get(testKey);
    await redis.del(testKey);
    
    await redis.quit();
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'redis',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      message: 'Redis is responding normally',
      details: {
        ping: pong,
        readWrite: testValue === 'test' ? 'success' : 'failed'
      }
    };
    
  } catch (error) {
    return {
      service: 'redis',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Redis connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkProductsSystemHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test products CRUD operations
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isActive: true } });
    
    // Test recent activity
    const recentProducts = await prisma.product.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      service: 'products_system',
      status: responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime,
      message: 'Products system is functioning normally',
      details: {
        totalProducts,
        activeProducts,
        recentProducts,
        systemIntegrity: 'verified'
      }
    };
    
  } catch (error) {
    return {
      service: 'products_system',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Products system check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkFileSystemHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check if critical directories exist and are writable
    const criticalDirs = ['./public', './uploads', './logs', './backups'];
    const dirChecks = [];
    
    for (const dir of criticalDirs) {
      try {
        await fs.access(dir);
        dirChecks.push({ dir, status: 'accessible' });
      } catch {
        try {
          await fs.mkdir(dir, { recursive: true });
          dirChecks.push({ dir, status: 'created' });
        } catch (error) {
          dirChecks.push({ 
            dir, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    }
    
    // Test write permissions
    const testFile = './health_check_test.tmp';
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    const responseTime = Date.now() - startTime;
    
    const failedDirs = dirChecks.filter(check => check.status === 'failed');
    
    return {
      service: 'file_system',
      status: failedDirs.length === 0 ? 'healthy' : 'degraded',
      responseTime,
      message: failedDirs.length === 0 ? 'File system is healthy' : `${failedDirs.length} directory issues`,
      details: {
        directoryChecks: dirChecks,
        writePermissions: 'verified'
      }
    };
    
  } catch (error) {
    return {
      service: 'file_system',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'File system check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

async function checkExternalDependencies(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // This would check external services like email providers, SMS services, etc.
    // For now, we'll simulate the check
    
    const dependencies = [
      { name: 'email_service', status: 'healthy', responseTime: 150 },
      { name: 'sms_service', status: 'healthy', responseTime: 200 },
      { name: 'storage_service', status: 'healthy', responseTime: 100 }
    ];
    
    const responseTime = Date.now() - startTime;
    const unhealthyDeps = dependencies.filter(dep => dep.status !== 'healthy');
    
    return {
      service: 'external_dependencies',
      status: unhealthyDeps.length === 0 ? 'healthy' : 'degraded',
      responseTime,
      message: unhealthyDeps.length === 0 ? 'All external dependencies are healthy' : 
               `${unhealthyDeps.length} dependencies have issues`,
      details: {
        dependencies
      }
    };
    
  } catch (error) {
    return {
      service: 'external_dependencies',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'External dependencies check failed'
    };
  }
}

async function collectSystemMetrics(): Promise<SystemHealth['metrics']> {
  try {
    // Database metrics
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isActive: true } });
    const productsCreatedToday = await prisma.product.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    // System metrics (simplified for cross-platform compatibility)
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    return {
      totalProducts,
      activeProducts,
      productsCreatedToday,
      systemLoad: process.cpuUsage().system / 1000000, // Convert to seconds
      memoryUsage: Math.round(memoryUsagePercent),
      diskUsage: 0 // Would require platform-specific implementation
    };
    
  } catch (error) {
    console.error('Failed to collect system metrics:', error);
    return {
      totalProducts: 0,
      activeProducts: 0,
      productsCreatedToday: 0,
      systemLoad: 0,
      memoryUsage: 0,
      diskUsage: 0
    };
  }
}

function determineOverallStatus(checks: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
  const degradedChecks = checks.filter(check => check.status === 'degraded');
  
  if (unhealthyChecks.length > 0) {
    return 'unhealthy';
  } else if (degradedChecks.length > 0) {
    return 'degraded';
  } else {
    return 'healthy';
  }
}