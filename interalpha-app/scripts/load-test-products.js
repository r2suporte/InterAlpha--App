#!/usr/bin/env node

/**
 * Load Testing Script for Products Management System
 * Tests system performance under various load conditions
 */

const { performance } = require('perf_hooks');

// Use native fetch if available (Node 18+) or require node-fetch
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (error) {
  console.warn('⚠️  fetch not available - load testing will be limited');
  fetch = () => Promise.reject(new Error('fetch not available'));
}

class ProductsLoadTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: []
    };
  }

  async runLoadTest(options = {}) {
    const {
      concurrentUsers = 10,
      requestsPerUser = 50,
      testDuration = 60000, // 1 minute
      endpoints = ['list', 'create', 'update', 'delete']
    } = options;

    console.log('🚀 Starting Products Load Test...');
    console.log(`Concurrent Users: ${concurrentUsers}`);
    console.log(`Requests per User: ${requestsPerUser}`);
    console.log(`Test Duration: ${testDuration}ms`);
    console.log(`Testing Endpoints: ${endpoints.join(', ')}`);

    const startTime = performance.now();
    const promises = [];

    // Create concurrent user sessions
    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(this.simulateUser(i, requestsPerUser, endpoints));
    }

    // Wait for all users to complete or timeout
    await Promise.allSettled(promises);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    this.calculateResults(totalDuration);
    this.printResults();
    
    return this.results;
  }

  async simulateUser(userId, requestCount, endpoints) {
    console.log(`👤 User ${userId} starting simulation...`);

    for (let i = 0; i < requestCount; i++) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      try {
        await this.executeRequest(endpoint, userId, i);
        await this.randomDelay(100, 500); // Simulate user think time
      } catch (error) {
        console.error(`❌ User ${userId} request ${i} failed:`, error.message);
        this.results.failedRequests++;
      }
    }

    console.log(`✅ User ${userId} completed simulation`);
  }

  async executeRequest(endpoint, userId, requestIndex) {
    const startTime = performance.now();
    let response;

    try {
      switch (endpoint) {
        case 'list':
          response = await this.testListProducts();
          break;
        case 'create':
          response = await this.testCreateProduct(userId, requestIndex);
          break;
        case 'update':
          response = await this.testUpdateProduct(userId, requestIndex);
          break;
        case 'delete':
          response = await this.testDeleteProduct(userId, requestIndex);
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.recordResponse(responseTime, response.ok);

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.recordResponse(responseTime, false);
      throw error;
    }
  }

  async testListProducts() {
    const response = await fetch(`${this.baseUrl}/api/produtos?page=1&limit=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock auth for testing
      }
    });

    if (!response.ok) {
      throw new Error(`List products failed: ${response.status}`);
    }

    return response;
  }

  async testCreateProduct(userId, requestIndex) {
    const productData = {
      partNumber: `LOAD-TEST-${userId}-${requestIndex}-${Date.now()}`,
      description: `Load test product ${userId}-${requestIndex}`,
      costPrice: Math.random() * 100 + 10,
      salePrice: Math.random() * 200 + 50
    };

    const response = await fetch(`${this.baseUrl}/api/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      throw new Error(`Create product failed: ${response.status}`);
    }

    return response;
  }

  async testUpdateProduct(userId, requestIndex) {
    // For load testing, we'll update a mock product
    const productId = `mock-product-${userId}`;
    const updateData = {
      description: `Updated product ${userId}-${requestIndex}`,
      salePrice: Math.random() * 200 + 50
    };

    const response = await fetch(`${this.baseUrl}/api/produtos/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(updateData)
    });

    // For load testing, we accept 404s as normal (product doesn't exist)
    if (!response.ok && response.status !== 404) {
      throw new Error(`Update product failed: ${response.status}`);
    }

    return response;
  }

  async testDeleteProduct(userId, requestIndex) {
    // For load testing, we'll try to delete a mock product
    const productId = `mock-product-${userId}-${requestIndex}`;

    const response = await fetch(`${this.baseUrl}/api/produtos/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    // For load testing, we accept 404s as normal (product doesn't exist)
    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete product failed: ${response.status}`);
    }

    return response;
  }

  recordResponse(responseTime, success) {
    this.results.totalRequests++;
    this.results.responseTimes.push(responseTime);

    if (success) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;
    }

    if (responseTime > this.results.maxResponseTime) {
      this.results.maxResponseTime = responseTime;
    }

    if (responseTime < this.results.minResponseTime) {
      this.results.minResponseTime = responseTime;
    }
  }

  calculateResults(totalDuration) {
    if (this.results.responseTimes.length > 0) {
      this.results.averageResponseTime = 
        this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    }

    // Calculate percentiles
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    this.results.p50 = this.getPercentile(sortedTimes, 50);
    this.results.p90 = this.getPercentile(sortedTimes, 90);
    this.results.p95 = this.getPercentile(sortedTimes, 95);
    this.results.p99 = this.getPercentile(sortedTimes, 99);

    this.results.requestsPerSecond = (this.results.totalRequests / totalDuration) * 1000;
    this.results.successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
  }

  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  printResults() {
    console.log('\n📊 Load Test Results:');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful Requests: ${this.results.successfulRequests}`);
    console.log(`Failed Requests: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${this.results.successRate.toFixed(2)}%`);
    console.log(`Requests/Second: ${this.results.requestsPerSecond.toFixed(2)}`);
    console.log('\n⏱️  Response Times (ms):');
    console.log(`Average: ${this.results.averageResponseTime.toFixed(2)}`);
    console.log(`Min: ${this.results.minResponseTime.toFixed(2)}`);
    console.log(`Max: ${this.results.maxResponseTime.toFixed(2)}`);
    console.log(`P50: ${this.results.p50.toFixed(2)}`);
    console.log(`P90: ${this.results.p90.toFixed(2)}`);
    console.log(`P95: ${this.results.p95.toFixed(2)}`);
    console.log(`P99: ${this.results.p99.toFixed(2)}`);

    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (this.results.successRate >= 99) {
      console.log('✅ Reliability: Excellent');
    } else if (this.results.successRate >= 95) {
      console.log('⚠️  Reliability: Good');
    } else {
      console.log('❌ Reliability: Poor - Needs attention');
    }

    if (this.results.p95 <= 500) {
      console.log('✅ Response Time: Excellent');
    } else if (this.results.p95 <= 1000) {
      console.log('⚠️  Response Time: Acceptable');
    } else {
      console.log('❌ Response Time: Poor - Optimization needed');
    }

    if (this.results.requestsPerSecond >= 100) {
      console.log('✅ Throughput: Excellent');
    } else if (this.results.requestsPerSecond >= 50) {
      console.log('⚠️  Throughput: Good');
    } else {
      console.log('❌ Throughput: Poor - Scaling needed');
    }
  }

  async randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Stress test scenarios
const scenarios = {
  light: {
    concurrentUsers: 5,
    requestsPerUser: 20,
    testDuration: 30000
  },
  moderate: {
    concurrentUsers: 20,
    requestsPerUser: 50,
    testDuration: 60000
  },
  heavy: {
    concurrentUsers: 50,
    requestsPerUser: 100,
    testDuration: 120000
  },
  stress: {
    concurrentUsers: 100,
    requestsPerUser: 200,
    testDuration: 300000
  }
};

async function runAllTests() {
  const tester = new ProductsLoadTester();
  
  console.log('🧪 Running Products Management Load Tests...\n');

  for (const [scenarioName, config] of Object.entries(scenarios)) {
    console.log(`\n🎬 Running ${scenarioName.toUpperCase()} load test scenario...`);
    
    try {
      await tester.runLoadTest(config);
      
      // Reset results for next test
      tester.results = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        responseTimes: []
      };
      
      // Wait between tests
      console.log('\n⏳ Waiting 10 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      console.error(`❌ ${scenarioName} test failed:`, error);
    }
  }

  console.log('\n🏁 All load tests completed!');
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenario = args[0] || 'moderate';
  
  if (scenario === 'all') {
    runAllTests().catch(console.error);
  } else if (scenarios[scenario]) {
    const tester = new ProductsLoadTester();
    tester.runLoadTest(scenarios[scenario]).catch(console.error);
  } else {
    console.log('Usage: node load-test-products.js [scenario]');
    console.log('Available scenarios:', Object.keys(scenarios).join(', '), 'all');
  }
}

module.exports = { ProductsLoadTester };