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
  keepAliveInitialDelay: number;
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
    keepAliveInitialDelay: 0,
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
 * Execute a query and return all rows
 */
export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const pool = await getPool();
  const connection = await pool.getConnection();
  try {
    // Ensure params is always an array
    const queryParams = params || [];
    // Log for debugging
    console.log(`[SQL] Query: ${sql.substring(0, 100)}...`);
    console.log(`[SQL] Params count: ${queryParams.length}, Params:`, queryParams);
    const [results] = await connection.execute(sql, queryParams);
    return results as T[];
  } finally {
    connection.release();
  }
}

/**
 * Execute a query and get a single row
 */
export async function executeQueryOne<T = Record<string, unknown>>(
  query: string,
  params?: (string | number | null)[]
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
