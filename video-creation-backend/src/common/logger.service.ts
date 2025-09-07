import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  trace?: string;
  metadata?: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logDir = '/tmp/logs';
  private readonly maxLogFiles = 10;
  private readonly maxLogSize = 10 * 1024 * 1024; // 10MB

  constructor() {
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message: any, context?: string) {
    this.writeLog(LogLevel.INFO, message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeLog(LogLevel.ERROR, message, context, trace);
  }

  warn(message: any, context?: string) {
    this.writeLog(LogLevel.WARN, message, context);
  }

  debug(message: any, context?: string) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  verbose(message: any, context?: string) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  private writeLog(level: LogLevel, message: any, context?: string, trace?: string, metadata?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context,
      trace,
      metadata,
    };

    // Write to console
    this.writeToConsole(logEntry);

    // Write to file
    this.writeToFile(logEntry);
  }

  private writeToConsole(logEntry: LogEntry) {
    const colorMap = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
    };

    const resetColor = '\x1b[0m';
    const color = colorMap[logEntry.level] || '';

    const contextStr = logEntry.context ? `[${logEntry.context}] ` : '';
    const logMessage = `${color}[${logEntry.timestamp}] ${logEntry.level.toUpperCase()} ${contextStr}${logEntry.message}${resetColor}`;

    console.log(logMessage);

    if (logEntry.trace) {
      console.log(`${color}${logEntry.trace}${resetColor}`);
    }

    if (logEntry.metadata) {
      console.log(`${color}Metadata: ${JSON.stringify(logEntry.metadata, null, 2)}${resetColor}`);
    }
  }

  private writeToFile(logEntry: LogEntry) {
    try {
      const logFileName = `app-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';

      // Check if log rotation is needed
      if (fs.existsSync(logFilePath)) {
        const stats = fs.statSync(logFilePath);
        if (stats.size > this.maxLogSize) {
          this.rotateLogFile(logFilePath);
        }
      }

      fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private rotateLogFile(logFilePath: string) {
    try {
      const dir = path.dirname(logFilePath);
      const baseName = path.basename(logFilePath, '.log');
      
      // Find existing rotated files
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith(baseName) && file.endsWith('.log'))
        .sort();

      // Remove old files if we have too many
      if (files.length >= this.maxLogFiles) {
        const filesToDelete = files.slice(0, files.length - this.maxLogFiles + 1);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
      }

      // Rotate current file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFileName = `${baseName}-${timestamp}.log`;
      const rotatedFilePath = path.join(dir, rotatedFileName);

      fs.renameSync(logFilePath, rotatedFilePath);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  // Application-specific logging methods
  logApiRequest(method: string, url: string, userId?: number, duration?: number) {
    this.log(`${method} ${url}`, 'API', {
      userId,
      duration,
      type: 'api_request',
    });
  }

  logApiError(method: string, url: string, error: Error, userId?: number) {
    this.error(`${method} ${url} - ${error.message}`, error.stack, 'API', {
      userId,
      type: 'api_error',
    });
  }

  logVideoProcessing(videoId: string, status: string, userId: number, metadata?: any) {
    this.log(`Video ${videoId} status: ${status}`, 'VideoProcessing', {
      videoId,
      userId,
      status,
      type: 'video_processing',
      ...metadata,
    });
  }

  logAIRequest(service: string, operation: string, userId: number, duration?: number, tokens?: number) {
    this.log(`AI ${service} - ${operation}`, 'AI', {
      service,
      operation,
      userId,
      duration,
      tokens,
      type: 'ai_request',
    });
  }

  logSocialMediaPublish(platform: string, videoId: string, userId: number, success: boolean, error?: string) {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Social media publish to ${platform} - ${success ? 'Success' : 'Failed'}`;
    
    this.writeLog(level, message, 'SocialMedia', undefined, {
      platform,
      videoId,
      userId,
      success,
      error,
      type: 'social_publish',
    });
  }

  logUserAction(action: string, userId: number, metadata?: any) {
    this.log(`User action: ${action}`, 'UserAction', {
      action,
      userId,
      type: 'user_action',
      ...metadata,
    });
  }

  logSystemHealth(component: string, status: 'healthy' | 'unhealthy', details?: any) {
    const level = status === 'healthy' ? LogLevel.INFO : LogLevel.WARN;
    this.writeLog(level, `System health check: ${component} - ${status}`, 'Health', undefined, {
      component,
      status,
      details,
      type: 'health_check',
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, context?: string) {
    this.log(`Performance metric: ${metric} = ${value} ${unit}`, 'Performance', {
      metric,
      value,
      unit,
      context,
      type: 'performance_metric',
    });
  }

  // Log analysis methods
  getLogsByLevel(level: LogLevel, startDate?: Date, endDate?: Date): LogEntry[] {
    return this.searchLogs({ level }, startDate, endDate);
  }

  getLogsByContext(context: string, startDate?: Date, endDate?: Date): LogEntry[] {
    return this.searchLogs({ context }, startDate, endDate);
  }

  getLogsByType(type: string, startDate?: Date, endDate?: Date): LogEntry[] {
    return this.searchLogs({ type }, startDate, endDate);
  }

  private searchLogs(criteria: any, startDate?: Date, endDate?: Date): LogEntry[] {
    const logs: LogEntry[] = [];
    
    try {
      const logFiles = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .sort();

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const logEntry: LogEntry = JSON.parse(line);
            const logDate = new Date(logEntry.timestamp);

            // Date filtering
            if (startDate && logDate < startDate) continue;
            if (endDate && logDate > endDate) continue;

            // Criteria filtering
            let matches = true;
            for (const [key, value] of Object.entries(criteria)) {
              if (key === 'type' && logEntry.metadata?.type !== value) {
                matches = false;
                break;
              } else if (logEntry[key] !== value) {
                matches = false;
                break;
              }
            }

            if (matches) {
              logs.push(logEntry);
            }
          } catch (parseError) {
            // Skip invalid log entries
            continue;
          }
        }
      }
    } catch (error) {
      this.error('Failed to search logs', error.stack, 'Logger');
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get system statistics
  getLogStatistics(startDate?: Date, endDate?: Date): {
    totalLogs: number;
    logsByLevel: { [level: string]: number };
    logsByContext: { [context: string]: number };
    errorRate: number;
  } {
    const allLogs = this.searchLogs({}, startDate, endDate);
    
    const stats = {
      totalLogs: allLogs.length,
      logsByLevel: {},
      logsByContext: {},
      errorRate: 0,
    };

    let errorCount = 0;

    allLogs.forEach(log => {
      // Count by level
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
      
      // Count by context
      if (log.context) {
        stats.logsByContext[log.context] = (stats.logsByContext[log.context] || 0) + 1;
      }

      // Count errors
      if (log.level === LogLevel.ERROR) {
        errorCount++;
      }
    });

    stats.errorRate = allLogs.length > 0 ? (errorCount / allLogs.length) * 100 : 0;

    return stats;
  }

  // Clean up old log files
  cleanupOldLogs(daysToKeep: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const logFiles = fs.readdirSync(this.logDir);
      
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.log(`Cleaned up old log file: ${file}`, 'Logger');
        }
      }
    } catch (error) {
      this.error('Failed to cleanup old logs', error.stack, 'Logger');
    }
  }
}

