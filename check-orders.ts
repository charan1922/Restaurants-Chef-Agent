import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'demo',
  user: 'postgres',
  password: 'postgres',
});

async function checkOrders() {
  try {
    // Check connection
    const dbInfo = await pool.query('SELECT current_database(), current_user');
    console.log('Connected to database:', dbInfo.rows[0]);
    
    console.log('\nChecking chef_orders table...');
    const result = await pool.query(`
      SELECT 
        id, waiter_order_id, status, priority, eta_minutes, total_cogs, created_at
      FROM chef_orders
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`\nFound ${result.rows.length} orders:`);
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrders();
