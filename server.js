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

// 2. Tạo bảng dữ liệu nếu chưa có (Chạy 1 lần đầu)
(async () => {
  try {
    // Kiểm tra xem bảng có tồn tại không
    const checkTable = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'todos')"
    );
    
    if (!checkTable.rows[0].exists) {
      // Nếu bảng không tồn tại, tạo mới
      await pool.query(`
        CREATE TABLE todos (
          id SERIAL PRIMARY KEY,
          task TEXT NOT NULL,
          completed BOOLEAN DEFAULT false
        );
      `);
      console.log('Created todos table');
    } else {
      // Nếu bảng tồn tại, thêm cột nếu chưa có
      await pool.query(`
        ALTER TABLE todos ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
      `).catch(() => {}); // Ignore error nếu cột đã tồn tại
      
      await pool.query(`
        ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
      `).catch(() => {}); // Ignore error nếu cột đã tồn tại
      
      console.log('Todos table already exists, columns checked');
    }
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
})();

// 3. API Lấy danh sách
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    console.log('GET /api/todos - returned', result.rows.length, 'todos');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/todos error:', err.message);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu' });
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
    res.status(500).json({ error: 'Lỗi thêm task' });
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
    res.status(500).json({ error: 'Lỗi xóa task' });
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
    res.status(500).json({ error: 'Lỗi cập nhật task', details: err.message });
  }
});

// 7. Cấu hình phục vụ React (Sau khi Build)
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});