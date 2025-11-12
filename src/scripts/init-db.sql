-- ============================================================================
-- SOVD Log Dashboard - Database Schema Initialization
-- ============================================================================
-- This script initializes the MySQL database schema for the SOVD Log Dashboard.
-- It creates the necessary tables and indexes for storing and querying log data.
--
-- Prerequisites:
--   - MySQL 8.0 or higher
--   - A database already created (see instructions below)
--
-- Usage:
--   mysql -u <user> -p <database_name> < init-db.sql
--
-- Example:
--   mysql -u root -p log_dashboard < init-db.sql
-- ============================================================================

-- Ensure we're using the correct database
-- (Make sure to create the database first or replace 'log_dashboard' with your db name)
-- CREATE DATABASE IF NOT EXISTS log_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE log_dashboard;

-- ============================================================================
-- Main Logs Table
-- ============================================================================
-- Stores all application logs with support for structured data (JSON details)
-- and efficient querying by timestamp, level, module, and trace ID.
-- ============================================================================

CREATE TABLE IF NOT EXISTS logs (
  -- Unique identifier for each log entry (UUID v4 as string)
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '唯一日志标识符 (UUID)',
  
  -- Timestamp when the log was generated (with millisecond precision)
  -- Used for sorting, time-based filtering, and time-series aggregation
  timestamp DATETIME(3) NOT NULL COMMENT '日志记录时间 (毫秒精度)',
  
  -- Module/service that generated the log (e.g., AUTH, ORDER, PAYMENT)
  -- Used for filtering logs by source service
  module VARCHAR(50) NOT NULL COMMENT '产生日志的模块 (AUTH, ORDER, etc)',
  
  -- Log level/severity (e.g., INFO, WARNING, ERROR, DEBUG, CRITICAL)
  -- Used for filtering by severity
  level VARCHAR(10) NOT NULL COMMENT '日志级别 (INFO, WARNING, ERROR, etc)',
  
  -- Main log message/description
  message TEXT NOT NULL COMMENT '日志消息主体',
  
  -- Optional trace ID to correlate logs across services
  -- Used for distributed tracing and request tracking
  trace_id VARCHAR(20) COMMENT '关联请求的追踪ID',
  
  -- Structured data as JSON
  -- Can contain stack traces, context variables, request parameters, etc.
  -- NULL if no additional context is provided
  details JSON COMMENT '结构化的日志上下文数据 (JSON格式)',
  
  -- Server-side timestamp when the record was inserted
  -- Used for data lifecycle management and auditing
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '数据写入时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='应用日志表 - 存储所有应用日志数据';

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================
-- These indexes are critical for query performance on large datasets (millions of logs)
-- Each index targets specific query patterns used by the dashboard
-- ============================================================================

-- Timestamp index: For sorting logs by recency and range queries
-- Usage: ORDER BY timestamp DESC, time-range filtering (startTime, endTime)
-- Impact: Dramatically improves pagination queries and time-series aggregation
CREATE INDEX IF NOT EXISTS idx_logs_timestamp 
  ON logs (timestamp DESC) 
  COMMENT 'Performance: Supports timestamp-based sorting and range queries';

-- Level index: For filtering logs by severity
-- Usage: WHERE level IN ('ERROR', 'WARNING')
-- Impact: Accelerates level distribution queries
CREATE INDEX IF NOT EXISTS idx_logs_level 
  ON logs (level) 
  COMMENT 'Performance: Supports filtering by log level';

-- Module index: For filtering logs by source service
-- Usage: WHERE module IN ('AUTH', 'ORDER')
-- Impact: Accelerates module distribution and service-specific queries
CREATE INDEX IF NOT EXISTS idx_logs_module 
  ON logs (module) 
  COMMENT 'Performance: Supports filtering by module/service';

-- Trace ID index: For distributed tracing and request correlation
-- Usage: WHERE trace_id = 'xyz123' (useful for finding related logs)
-- Impact: Enables efficient trace-based log retrieval
CREATE INDEX IF NOT EXISTS idx_logs_trace_id 
  ON logs (trace_id) 
  COMMENT 'Performance: Supports distributed tracing and correlation queries';

-- Composite index: For common filtering patterns
-- Usage: WHERE level = 'ERROR' AND timestamp >= startTime
-- Impact: Enables index-only scans for common error analysis queries
CREATE INDEX IF NOT EXISTS idx_logs_level_timestamp 
  ON logs (level, timestamp DESC) 
  COMMENT 'Performance: Supports combined level and timestamp queries';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this script, verify the setup with these commands:
-- ============================================================================

-- Show table structure:
-- DESCRIBE logs;

-- Show all indexes:
-- SHOW INDEXES FROM logs;

-- Count current logs:
-- SELECT COUNT(*) FROM logs;

-- Test a sample query:
-- SELECT id, timestamp, module, level, message, trace_id 
-- FROM logs 
-- ORDER BY timestamp DESC 
-- LIMIT 10;
