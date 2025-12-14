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
          <span className="stat-badge">{todos.length} công việc</span>
        </div>

        <div className="todos-container">
          {todos.length === 0 ? (
            <div className="empty-state">
              <p>🎯 Hãy thêm công việc đầu tiên của bạn!</p>
            </div>
          ) : (
            <ul className="todos-list">
              {todos.map((t, index) => (
                <li key={t.id} className="todo-item">
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