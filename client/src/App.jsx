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

  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;

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

        <div className="stats">
          <div className="stat-item completed">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Hoàn thành</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Chưa làm</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item total">
            <span className="stat-number">{todos.length}</span>
            <span className="stat-label">Tổng cộng</span>
          </div>
        </div>

        <div className="todos-container">
          {todos.length === 0 ? (
            <div className="empty-state">
              <p>🎯 Hãy thêm công việc đầu tiên của bạn!</p>
            </div>
          ) : (
            <ul className="todos-list">
              {todos.map((t, index) => (
                <li key={t.id} className={`todo-item ${t.completed ? 'completed' : ''}`}>
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

        <footer className="app-footer">
          <p>Made with ❤️ using React + Node.js</p>
        </footer>
      </div>
    </div>
  );
}

export default App;