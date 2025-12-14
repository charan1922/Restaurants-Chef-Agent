import { Pool, QueryResult } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  host: process.env.DB_HOST, // Fallback
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.POSTGRES_URL ? { rejectUnauthorized: false } : undefined,
});

pool.on("connect", () => {
  console.log("✅ Chef Agent connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Chef Agent: Unexpected error on PostgreSQL client", err);
});

// Simple query function
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("[Chef DB] Executed query", { text: text.substring(0, 50), duration, rows: res.rowCount });
  return res;
}

// Get a client from the pool for transactions
export async function getClient() {
  return await pool.connect();
}

export default pool;
