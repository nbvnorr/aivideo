const axios = require('axios');
const { performance } = require('perf_hooks');

class PerformanceTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.authToken = null;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: [],
      errors: [],
    };
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/register`, {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
      });

      this.authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null) {
    const startTime = performance.now();
    
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.recordSuccess(responseTime);
      return { success: true, data: response.data, responseTime };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.recordFailure(error, responseTime);
      return { success: false, error: error.message, responseTime };
    }
  }

  recordSuccess(responseTime) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    this.results.responseTimes.push(responseTime);
    this.updateResponseTimeStats(responseTime);
  }

  recordFailure(error, responseTime) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    this.results.responseTimes.push(responseTime);
    this.results.errors.push({
      message: error.message,
      responseTime,
      timestamp: new Date().toISOString(),
    });
    this.updateResponseTimeStats(responseTime);
  }

  updateResponseTimeStats(responseTime) {
    this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
    this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
    
    const sum = this.results.responseTimes.reduce((a, b) => a + b, 0);
    this.results.averageResponseTime = sum / this.results.responseTimes.length;
  }

  async runLoadTest(concurrentUsers = 10, requestsPerUser = 20) {
    console.log(`🚀 Starting load test with ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);
    
    if (!await this.authenticate()) {
      return;
    }

    const userPromises = [];

    for (let user = 0; user < concurrentUsers; user++) {
      const userPromise = this.simulateUser(user, requestsPerUser);
      userPromises.push(userPromise);
    }

    const startTime = performance.now();
    await Promise.all(userPromises);
    const endTime = performance.now();

    const totalTime = endTime - startTime;
    const requestsPerSecond = (this.results.totalRequests / totalTime) * 1000;

    console.log('\n📊 Load Test Results:');
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful Requests: ${this.results.successfulRequests}`);
    console.log(`Failed Requests: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Requests per Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.results.maxResponseTime.toFixed(2)}ms`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error.message} (${error.responseTime.toFixed(2)}ms)`);
      });
      if (this.results.errors.length > 5) {
        console.log(`... and ${this.results.errors.length - 5} more errors`);
      }
    }

    return this.results;
  }

  async simulateUser(userId, requestCount) {
    const endpoints = [
      { method: 'GET', path: '/videos' },
      { method: 'POST', path: '/videos', data: { title: `Test Video ${userId}`, script: 'Test script' } },
      { method: 'GET', path: '/ai/topics/trending' },
      { method: 'POST', path: '/ai/script/generate', data: { topic: 'AI Technology', duration: 60 } },
      { method: 'POST', path: '/ai/hashtags/generate', data: { topic: 'Technology' } },
      { method: 'GET', path: '/media/templates' },
      { method: 'GET', path: '/social/schedule' },
      { method: 'GET', path: '/health' },
    ];

    for (let i = 0; i < requestCount; i++) {
      const endpoint = endpoints[i % endpoints.length];
      await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
      
      // Add small delay to simulate real user behavior
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  }

  async runStressTest(maxUsers = 50, rampUpTime = 30000) {
    console.log(`🔥 Starting stress test - ramping up to ${maxUsers} users over ${rampUpTime/1000} seconds`);
    
    if (!await this.authenticate()) {
      return;
    }

    const userInterval = rampUpTime / maxUsers;
    const activeUsers = [];

    for (let user = 0; user < maxUsers; user++) {
      setTimeout(() => {
        const userPromise = this.simulateUser(user, 50);
        activeUsers.push(userPromise);
        console.log(`👤 User ${user + 1} started (${activeUsers.length} active users)`);
      }, user * userInterval);
    }

    // Wait for ramp-up to complete
    await new Promise(resolve => setTimeout(resolve, rampUpTime + 10000));

    console.log('\n📊 Stress Test Results:');
    this.printResults();
  }

  async runSpikeTest() {
    console.log('⚡ Starting spike test - sudden load increase');
    
    if (!await this.authenticate()) {
      return;
    }

    // Normal load
    console.log('📈 Phase 1: Normal load (5 users)');
    await this.runConcurrentUsers(5, 10);

    // Spike
    console.log('📈 Phase 2: Spike load (50 users)');
    await this.runConcurrentUsers(50, 20);

    // Back to normal
    console.log('📈 Phase 3: Back to normal (5 users)');
    await this.runConcurrentUsers(5, 10);

    console.log('\n📊 Spike Test Results:');
    this.printResults();
  }

  async runConcurrentUsers(userCount, requestsPerUser) {
    const promises = [];
    for (let i = 0; i < userCount; i++) {
      promises.push(this.simulateUser(i, requestsPerUser));
    }
    await Promise.all(promises);
  }

  async runEnduranceTest(duration = 300000) { // 5 minutes
    console.log(`⏱️ Starting endurance test - ${duration/1000} seconds with constant load`);
    
    if (!await this.authenticate()) {
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + duration;
    const userPromises = [];

    while (Date.now() < endTime) {
      // Maintain 10 concurrent users
      if (userPromises.length < 10) {
        const userPromise = this.simulateUser(userPromises.length, 100);
        userPromises.push(userPromise);
        
        userPromise.finally(() => {
          const index = userPromises.indexOf(userPromise);
          if (index > -1) {
            userPromises.splice(index, 1);
          }
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Wait for remaining users to complete
    await Promise.all(userPromises);

    console.log('\n📊 Endurance Test Results:');
    this.printResults();
  }

  printResults() {
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Avg Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.minResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${this.results.maxResponseTime.toFixed(2)}ms`);
  }

  async runAPIResponseTimeTest() {
    console.log('⏱️ Testing API response times for different endpoints');
    
    if (!await this.authenticate()) {
      return;
    }

    const endpoints = [
      { name: 'Health Check', method: 'GET', path: '/health' },
      { name: 'Get Videos', method: 'GET', path: '/videos' },
      { name: 'Create Video', method: 'POST', path: '/videos', data: { title: 'Test', script: 'Test' } },
      { name: 'AI Topics', method: 'GET', path: '/ai/topics/trending' },
      { name: 'AI Script Generation', method: 'POST', path: '/ai/script/generate', data: { topic: 'Test' } },
      { name: 'Get Templates', method: 'GET', path: '/media/templates' },
    ];

    console.log('\n📊 API Response Time Results:');
    console.log('Endpoint'.padEnd(25) + 'Avg (ms)'.padEnd(12) + 'Min (ms)'.padEnd(12) + 'Max (ms)');
    console.log('-'.repeat(60));

    for (const endpoint of endpoints) {
      const times = [];
      
      // Test each endpoint 10 times
      for (let i = 0; i < 10; i++) {
        const result = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
        times.push(result.responseTime);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      console.log(
        endpoint.name.padEnd(25) + 
        avg.toFixed(2).padEnd(12) + 
        min.toFixed(2).padEnd(12) + 
        max.toFixed(2)
      );
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'load';
  const baseUrl = args[1] || 'http://localhost:3000';

  const tester = new PerformanceTest(baseUrl);

  switch (testType) {
    case 'load':
      await tester.runLoadTest(10, 20);
      break;
    case 'stress':
      await tester.runStressTest(50, 30000);
      break;
    case 'spike':
      await tester.runSpikeTest();
      break;
    case 'endurance':
      await tester.runEnduranceTest(300000); // 5 minutes
      break;
    case 'response-time':
      await tester.runAPIResponseTimeTest();
      break;
    default:
      console.log('Usage: node performance-test.js [load|stress|spike|endurance|response-time] [base-url]');
      console.log('Example: node performance-test.js load http://localhost:3000');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTest;

