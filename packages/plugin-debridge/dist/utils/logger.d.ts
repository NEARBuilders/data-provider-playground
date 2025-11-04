/**
 * Structured logging utility
 * Provides consistent, queryable log output
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    metadata?: Record<string, unknown>;
}
export declare class Logger {
    private context;
    private minLevel;
    constructor(context: string, minLevel?: LogLevel);
    private shouldLog;
    private formatLog;
    private log;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, metadata?: Record<string, unknown>): void;
    /**
     * Create a child logger with extended context
     */
    child(subContext: string): Logger;
    /**
     * Set minimum log level
     */
    setLevel(level: LogLevel): void;
}
/**
 * Performance timer utility
 */
export declare class PerformanceTimer {
    private startTime;
    private marks;
    constructor();
    /**
     * Mark a checkpoint
     */
    mark(label: string): void;
    /**
     * Get elapsed time since start
     */
    elapsed(): number;
    /**
     * Get time between two marks
     */
    measure(startMark: string, endMark: string): number | undefined;
    /**
     * Get all marks as metadata
     */
    getMetadata(): Record<string, number>;
}
