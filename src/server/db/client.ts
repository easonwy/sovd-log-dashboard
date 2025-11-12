import mysql, { Pool } from 'mysql2/promise';

/**
 * MySQL Database Connection Pool
 * 
 * This module manages the connection pool to MySQL database.
 * It uses connection pooling to efficiently manage database connections.
 */

let pool: Pool | null = null;

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  enableKeepAlive: boolean;
  keepAliveInitialDelayMs: number;
}

/**
 * Get or create the database connection pool
 */
export async function getPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const config: DbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'log_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
  };

  try {
    pool = mysql.createPool(config);
    
    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log(`✅ Database connected: ${config.user}@${config.host}:${config.port}/${config.database}`);
    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Execute a query with optional parameters
 */
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(query, params || []);
    return rows as T[];
  } finally {
    connection.release();
  }
}

/**
 * Execute a query and get a single row
 */
export async function executeQueryOne<T = any>(
  query: string,
  params?: any[]
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

/**
 * Check if database is connected
 */
export async function isConnected(): Promise<boolean> {
  try {
    const pool = await getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch {
    return false;
  }
}
