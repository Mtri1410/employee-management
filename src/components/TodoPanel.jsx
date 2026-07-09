import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle2, Circle, Plus, Calendar, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TodoPanel({ isOpen, onClose }) {
  const { currentUser, todos, setTodos, pushLog } = useApp();
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [filter, setFilter] = useState('active'); // all, active, completed

  const myTodos = todos.filter(t => t.employeeId === currentUser.employeeId);
  
  const filteredTodos = myTodos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTodo = {
      id: Date.now(),
      employeeId: currentUser.employeeId,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || null,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTodos(prev => [newTodo, ...prev]);
    pushLog(`Đã thêm ghi chú công việc: "${newTodo.title}"`, 'info');
    
    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  const toggleTodo = (id, completed) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    if (!completed) {
      confetti({ particleCount: 30, spread: 40, origin: { x: 0.9, y: 0.5 } });
    }
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };
  
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Slide-out Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Ghi chú công việc</h2>
              <p className="text-xs font-semibold text-slate-400">{myTodos.filter(t => !t.completed).length} công việc chưa hoàn thành</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex px-5 pt-4 pb-2 gap-2 border-b border-slate-850">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                filter === f 
                  ? 'bg-teal-500 text-slate-950' 
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang làm' : 'Đã xong'}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Không có công việc nào.</p>
            </div>
          ) : (
            filteredTodos.map(todo => {
              const overdue = !todo.completed && isOverdue(todo.dueDate);
              const todayTask = !todo.completed && isToday(todo.dueDate);
              
              return (
                <div 
                  key={todo.id} 
                  className={`group relative flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    todo.completed 
                      ? 'bg-slate-900/50 border-slate-850 opacity-60' 
                      : overdue 
                        ? 'bg-rose-500/5 border-rose-500/20' 
                        : todayTask 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button 
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className="mt-0.5 shrink-0 focus:outline-none"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    ) : (
                      <Circle className={`w-5 h-5 ${overdue ? 'text-rose-500/70' : todayTask ? 'text-amber-500/70' : 'text-slate-500 hover:text-teal-400'}`} />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold break-words ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {todo.title}
                    </p>
                    
                    {todo.dueDate && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Calendar className={`w-3 h-3 ${overdue ? 'text-rose-400' : todayTask ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-bold ${overdue ? 'text-rose-400' : todayTask ? 'text-amber-400' : 'text-slate-500'}`}>
                          {todo.dueDate.split('-').reverse().join('/')} 
                          {overdue ? ' (Quá hạn)' : todayTask ? ' (Hôm nay)' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Add Todo Form */}
        <div className="p-5 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleAddTodo} className="space-y-3">
            <input 
              type="text" 
              placeholder="Thêm công việc mới..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-200 placeholder-slate-500"
            />
            <div className="flex gap-2">
              <input 
                type="date" 
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-slate-400"
              />
              <button 
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
