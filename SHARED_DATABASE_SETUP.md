# 📚 Hướng Dẫn Dùng Chung Database Render (Cách 1)

## 🎯 Setup

Cả 2 project dùng **cùng DATABASE_URL** từ Render nhưng **table riêng**:

### `todo_project` (Project này)
- **Table:** `todos`
- **Columns:** `id` (PK), `task`, `completed`, `created_at`
- **API:** `/api/todos`
- **Port:** 3000

### `Backend Project 3` (Project khác)
- **Table:** `todos_backend3`
- **Columns:** `todo_id` (PK), `description`, `completed`, `created_at`
- **API:** `/todos`
- **Port:** 5000

---

## 🔧 Cấu Hình Backend Project 3

### 1. `.env`
```env
DATABASE_URL=<COPY_TỪNG_RENDER_DATABASE_URL>
PORT=5000
```

### 2. `server.js` - Thêm function init database

```javascript
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('📋 Initializing todos_backend3 table...');
    
    // Tạo table todos_backend3
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos_backend3 (
        todo_id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table todos_backend3 created');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  } finally {
    client.release();
  }
}
```

### 3. API Endpoints (Cập nhật GET path)

```javascript
// Cũ:
app.get('/todos', async (req, res) => {
  const allTodos = await pool.query('SELECT * FROM todos_backend3 ORDER BY todo_id ASC');
  // ... rest code
});

// POST, PUT, DELETE tương tự dùng todos_backend3
```

### 4. Gọi init khi server start

```javascript
async function start() {
  const dbReady = await initializeDatabase();
  if (!dbReady) console.error('Database not ready');
  
  app.listen(5000, () => {
    console.log('✓ Server running on port 5000');
  });
}

start();
```

---

## ✅ Verify Setup

### Project này
```bash
curl http://localhost:3000/api/test-db
```

**Response:**
```json
{
  "status": "OK ✓",
  "tables": ["todos", "todos_backend3"],
  "todos_columns": [...],
  "todos_count": 5
}
```

### Backend Project 3
```bash
curl http://localhost:5000/api/test-db
```

---

## 🎁 Ưu Điểm

✅ Dữ liệu 2 project **không xung đột**  
✅ Mỗi project **độc lập** thay đổi schema  
✅ **Dễ debug** - mỗi table rõ ràng  
✅ **Nâng cấp** thành 1 table duy nhất sau  

---

## 🔄 Nâng Cấp Thành 1 Table (Sau này)

Nếu muốn merge thành 1 table:
1. Chuẩn hóa column names (id hay todo_id?)
2. Chuẩn hóa API paths
3. Migrate data từ `todos_backend3` → `todos`
4. Xóa table `todos_backend3`

---

**📝 Status:** ✅ Ready  
**🔗 Database:** Render PostgreSQL (Shared)
