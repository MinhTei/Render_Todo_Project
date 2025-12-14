import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');

  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error("Lỗi:", err));
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if(!task.trim()) return;

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task })
      });
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setTask('');
    } catch (err) {
      alert("Lỗi thêm task: " + err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      alert("Lỗi xóa task: " + err);
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      const updatedTodo = await res.json();
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (err) {
      alert("Lỗi cập nhật task: " + err);
    }
  };

  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  const completedCount = completedTodos.length;

  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="header">
          <div className="header-content">
            <h1>✨ My Tasks</h1>
            <p>Quản lý công việc hàng ngày của bạn</p>
          </div>
        </div>

        <form onSubmit={addTask} className="form-container">
          <div className="input-group">
            <input 
              value={task} 
              onChange={e => setTask(e.target.value)} 
              placeholder="Thêm công việc mới..." 
              className="input-field"
              autoFocus
            />
            <button className="btn-add">
              <span>➕</span> Thêm
            </button>
          </div>
        </form>

        <div className="content-wrapper">
          {/* Cột bên trái: Công việc cần làm */}
          <div className="left-column">
            <div className="column-header">
              <h2>📋 Công việc cần làm</h2>
              <span className="badge-pending">{pendingTodos.length}</span>
            </div>

            <div className="todos-container">
              {pendingTodos.length === 0 ? (
                <div className="empty-state">
                  <p>🎉 Tất cả công việc đã hoàn thành!</p>
                </div>
              ) : (
                <ul className="todos-list">
                  {pendingTodos.map((t, index) => (
                    <li key={t.id} className="todo-item">
                      <div className="todo-checkbox">
                        <input 
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => toggleTask(t.id, t.completed)}
                          className="checkbox-input"
                        />
                        <span className="checkmark"></span>
                      </div>
                      <div className="todo-content">
                        <span className="todo-number">{index + 1}</span>
                        <span className="todo-text">{t.task}</span>
                      </div>
                      <button 
                        onClick={() => deleteTask(t.id)}
                        className="btn-delete"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Cột bên phải: Công việc hoàn thành + Thống kê */}
          <div className="right-column">
            <div className="column-header">
              <h2>✅ Hoàn thành</h2>
              <span className="badge-completed">{completedCount}</span>
            </div>

            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-value">{todos.length}</div>
                <div className="stat-name">Tổng cộng</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{pendingTodos.length}</div>
                <div className="stat-name">Chưa làm</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">{completedCount}</div>
                <div className="stat-name">Hoàn thành</div>
              </div>
            </div>

            <div className="todos-container">
              {completedTodos.length === 0 ? (
                <div className="empty-state">
                  <p>📝 Hoàn thành công việc để xem ở đây</p>
                </div>
              ) : (
                <ul className="todos-list completed-list">
                  {completedTodos.map((t) => (
                    <li key={t.id} className="todo-item completed">
                      <div className="todo-checkbox">
                        <input 
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => toggleTask(t.id, t.completed)}
                          className="checkbox-input"
                        />
                        <span className="checkmark"></span>
                      </div>
                      <div className="todo-content">
                        <span className="todo-text">{t.task}</span>
                      </div>
                      <button 
                        onClick={() => deleteTask(t.id)}
                        className="btn-delete"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <footer className="app-footer">
          <p>Made with ❤️ using React + Node.js</p>
        </footer>
      </div>
    </div>
  );
}

export default App;