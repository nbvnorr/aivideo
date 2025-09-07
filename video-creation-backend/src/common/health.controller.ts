import { Controller, Get } from '@nestjs/common';
import { LoggerService } from './logger.service';
import * as os from 'os';
import * as fs from 'fs';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: LoggerService) {}

  @Get()
  async getHealthStatus() {
    const healthChecks = await Promise.allSettled([
      this.checkSystemHealth(),
      this.checkDatabaseHealth(),
      this.checkExternalServices(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ]);

    const results = healthChecks.map((check, index) => {
      const checkNames = ['system', 'database', 'external_services', 'disk_space', 'memory'];
      return {
        check: checkNames[index],
        status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        details: check.status === 'fulfilled' ? check.value : check.reason,
      };
    });

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

    // Log health check results
    results.forEach(result => {
      this.logger.logSystemHealth(result.check, result.status as any, result.details);
    });

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  @Get('detailed')
  async getDetailedHealth() {
    const basicHealth = await this.getHealthStatus();
    
    const detailedInfo = {
      ...basicHealth,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    return detailedInfo;
  }

  @Get('metrics')
  async getMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      timestamp: new Date().toISOString(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      system: {
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
      },
    };
  }

  @Get('logs/stats')
  async getLogStatistics() {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const stats = this.logger.getLogStatistics(last24Hours);
    
    return {
      period: '24 hours',
      startTime: last24Hours.toISOString(),
      endTime: new Date().toISOString(),
      ...stats,
    };
  }

  private async checkSystemHealth(): Promise<any> {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Check if system is under stress
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const isMemoryHealthy = memoryUsagePercent < 90;
    const isUptimeHealthy = uptime > 60; // At least 1 minute uptime

    return {
      healthy: isMemoryHealthy && isUptimeHealthy,
      uptime,
      memoryUsagePercent: Math.round(memoryUsagePercent),
      cpuUsage,
    };
  }

  private async checkDatabaseHealth(): Promise<any> {
    try {
      // In a real implementation, you would check actual database connections
      // For now, we'll simulate database health checks
      
      const postgresHealthy = await this.checkPostgresConnection();
      const mongoHealthy = await this.checkMongoConnection();

      return {
        healthy: postgresHealthy && mongoHealthy,
        postgres: postgresHealthy,
        mongodb: mongoHealthy,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  private async checkExternalServices(): Promise<any> {
    try {
      // Check external service connectivity
      const services = {
        openai: await this.checkServiceConnectivity('https://api.openai.com'),
        elevenlabs: await this.checkServiceConnectivity('https://api.elevenlabs.io'),
        youtube: await this.checkServiceConnectivity('https://www.googleapis.com'),
        instagram: await this.checkServiceConnectivity('https://graph.facebook.com'),
      };

      const allHealthy = Object.values(services).every(status => status);

      return {
        healthy: allHealthy,
        services,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  private async checkDiskSpace(): Promise<any> {
    try {
      const stats = fs.statSync('/tmp');
      const freeSpace = fs.statSync('/tmp'); // Simplified check
      
      // In a real implementation, you would check actual disk space
      const diskUsagePercent = 50; // Mock value
      const isHealthy = diskUsagePercent < 90;

      return {
        healthy: isHealthy,
        diskUsagePercent,
        availableSpace: '10GB', // Mock value
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  private async checkMemoryUsage(): Promise<any> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const isHealthy = memoryUsagePercent < 85;

    return {
      healthy: isHealthy,
      totalMemory,
      freeMemory,
      usedMemory,
      memoryUsagePercent: Math.round(memoryUsagePercent),
    };
  }

  private async checkPostgresConnection(): Promise<boolean> {
    try {
      // Mock PostgreSQL health check
      // In a real implementation, you would use TypeORM connection
      return true;
    } catch (error) {
      this.logger.error('PostgreSQL health check failed', error.stack, 'Health');
      return false;
    }
  }

  private async checkMongoConnection(): Promise<boolean> {
    try {
      // Mock MongoDB health check
      // In a real implementation, you would use Mongoose connection
      return true;
    } catch (error) {
      this.logger.error('MongoDB health check failed', error.stack, 'Health');
      return false;
    }
  }

  private async checkServiceConnectivity(url: string): Promise<boolean> {
    try {
      // Mock external service connectivity check
      // In a real implementation, you would make actual HTTP requests
      return Math.random() > 0.1; // 90% success rate for demo
    } catch (error) {
      this.logger.error(`Service connectivity check failed for ${url}`, error.stack, 'Health');
      return false;
    }
  }
}

