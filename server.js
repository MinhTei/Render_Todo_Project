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
pool.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false
  );
`);

// 3. API Lấy danh sách
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/todos error:', err);
    res.status(500).json({ error: 'Lỗi lấy dữ liệu' });
  }
});

// 4. API Thêm công việc
app.post('/api/todos', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task || !task.trim()) {
      return res.status(400).json({ error: 'Task không được để trống' });
    }
    
    const result = await pool.query('INSERT INTO todos (task) VALUES ($1) RETURNING *', [task]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/todos error:', err);
    res.status(500).json({ error: 'Lỗi thêm task' });
  }
});

// 5. API Xóa công việc
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Task không tìm thấy' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/todos/:id error:', err);
    res.status(500).json({ error: 'Lỗi xóa task' });
  }
});

// 6. API Cập nhật trạng thái hoàn thành
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    if (completed === undefined) {
      return res.status(400).json({ error: 'completed field is required' });
    }
    
    const result = await pool.query('UPDATE todos SET completed = $1 WHERE id = $2 RETURNING *', [completed, id]);
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Task không tìm thấy' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/todos/:id error:', err);
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