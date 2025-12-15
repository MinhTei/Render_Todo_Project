const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 1. Kết nối Database PostgreSQL (Lấy link từ biến môi trường Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Bắt buộc cho Render
});

// 2. Kiểm tra kết nối database
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// 3. Tạo/reset bảng dữ liệu
async function initializeDatabase() {
  try {
    console.log('📋 Initializing database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
    
    // DROP table cũ nếu có (FORCE RESET)
    console.log('Dropping old tables if exists...');
    await pool.query(`DROP TABLE IF EXISTS todos CASCADE`);
    console.log('✓ Old tables dropped');
    
    // Tạo table todos mới (cho project này)
    console.log('Creating todos table...');
    await pool.query(`
      CREATE TABLE todos (
        id SERIAL PRIMARY KEY,
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Table todos created');
    
    // Kiểm tra columns
    const columns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'todos'
      ORDER BY ordinal_position
    `);
    const columnNames = columns.rows.map(c => c.column_name).join(', ');
    console.log(`  Columns: ${columnNames}`);
    
    return true;
  } catch (err) {
    console.error('✗ Database initialization error:', err.message);
    console.error('Error details:', err);
    return false;
  }
}

// 4. API Lấy danh sách
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    console.log('GET /api/todos - returned', result.rows.length, 'todos');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/todos error:', err.message);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu: ' + err.message });
  }
});

// Test DB endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🔍 Testing database...');
    
    // Kiểm tra connection
    const connTest = await pool.query('SELECT NOW()');
    
    // Kiểm tra tất cả tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Kiểm tra columns của todos
    const todosColumns = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'todos'
      ORDER BY ordinal_position
    `);
    
    // Lấy sample data
    const todos = await pool.query('SELECT COUNT(*) as count FROM todos');
    
    res.json({
      status: 'OK ✓',
      database: 'Connected',
      tables: tables.rows.map(t => t.table_name),
      todos_columns: todosColumns.rows,
      todos_count: todos.rows[0].count,
      message: '✓ Database setup correctly for Cách 1 (Multiple tables)'
    });
  } catch (err) {
    console.error('❌ Database test error:', err.message);
    res.status(500).json({ 
      status: 'ERROR',
      error: err.message,
      hint: 'Database might not be initialized'
    });
  }
});

// 4. API Thêm công việc
app.post('/api/todos', async (req, res) => {
  try {
    const { task } = req.body;
    
    console.log('POST /api/todos', { task });
    
    if (!task || !task.trim()) {
      console.log('Error: task is empty');
      return res.status(400).json({ error: 'Task không được để trống' });
    }
    
    const result = await pool.query('INSERT INTO todos (task) VALUES ($1) RETURNING *', [task]);
    console.log('Success: Created todo:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/todos error:', err.message);
    res.status(500).json({ error: 'Lỗi thêm task: ' + err.message });
  }
});

// 5. API Xóa công việc
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    console.log('DELETE /api/todos/' + id);
    
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (!result.rows[0]) {
      console.log('Error: No todo found with id:', id);
      return res.status(404).json({ error: 'Task không tìm thấy' });
    }
    
    console.log('Success: Deleted todo with id:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/todos/:id error:', err.message);
    res.status(500).json({ error: 'Lỗi xóa task: ' + err.message });
  }
});

// 6. API Cập nhật trạng thái hoàn thành
app.put('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completed } = req.body;
    
    console.log(`PUT /api/todos/${id}`, { id, completed, type: typeof completed });
    
    if (completed === undefined || completed === null) {
      console.log('Error: completed field is missing');
      return res.status(400).json({ error: 'completed field is required' });
    }
    
    if (typeof completed !== 'boolean') {
      console.log('Error: completed must be boolean, got:', typeof completed);
      return res.status(400).json({ error: 'completed must be boolean' });
    }
    
    const query = 'UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *';
    console.log('Executing query:', query, 'with params:', [completed, id]);
    
    const result = await pool.query(query, [completed, id]);
    
    if (!result.rows[0]) {
      console.log('Error: No todo found with id:', id);
      return res.status(404).json({ error: 'Task không tìm thấy' });
    }
    
    console.log('Success: Updated todo:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/todos/:id error:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi cập nhật task: ' + err.message });
  }
});

// 7. Cấu hình phục vụ React (Sau khi Build)
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start server AFTER initializing database
async function start() {
  const dbReady = await initializeDatabase();
  
  if (!dbReady) {
    console.error('Failed to initialize database. Server will still start but may not work properly.');
  }
  
  app.listen(port, () => {
    console.log(`✓ Server running on port ${port}`);
    console.log(`Database status: ${dbReady ? 'Ready ✓' : 'Not Ready ✗'}`);
  });
}

start();