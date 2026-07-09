import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const shiftsOptions = [
  { id: 'Ca hành chính (08:00 - 17:30)', label: 'Ca hành chính (08:00 - 17:30)' },
  { id: 'Ca sáng (08:00 - 12:00)', label: 'Ca sáng (08:00 - 12:00)' },
  { id: 'Ca chiều (13:30 - 17:30)', label: 'Ca chiều (13:30 - 17:30)' },
  { id: 'Ca đêm (18:00 - 22:00)', label: 'Ca đêm (18:00 - 22:00)' }
];

export default function ShiftRegistration() {
  const { currentUser, requests, setRequests, pushLog, addNotification } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [selectedDays, setSelectedDays] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shift, setShift] = useState(shiftsOptions[0].id);
  const [workMode, setWorkMode] = useState('Onsite');
  
  // Calendar generation logic
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Get today string to disable past days
  const todayStr = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Validate past days
    if (dayStr < todayStr) {
      pushLog('Không thể đăng ký ca làm việc cho ngày trong quá khứ.', 'error');
      return;
    }
    
    // Check if already registered
    const existingReq = requests.find(req => 
      req.employeeId === currentUser.employeeId && 
      req.type === 'Đăng ký ca làm việc' &&
      req.fromDate <= dayStr && req.toDate >= dayStr
    );
    
    if (existingReq) {
      // If already registered and approved/pending, block
      pushLog(`Ngày ${dayStr} đã có đơn đăng ký ca. Trạng thái: ${existingReq.status}`, 'warning');
      return;
    }

    setSelectedDays(prev => 
      prev.includes(dayStr) ? prev.filter(d => d !== dayStr) : [...prev, dayStr]
    );
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) return;

    const newRequest = {
      id: Date.now(),
      type: 'Đăng ký ca làm việc',
      selectedDays: selectedDays.sort(),
      fromDate: selectedDays.sort()[0],
      toDate: selectedDays.sort()[selectedDays.length - 1],
      reason: `Đăng ký ${shift} - ${workMode === 'Onsite' ? 'Tại văn phòng' : 'Làm từ xa'}`,
      shift: shift,
      workMode: workMode,
      attachment: null,
      status: 'Pending',
      employeeName: currentUser.fullName,
      employeeId: currentUser.employeeId,
      submitDate: todayStr
    };

    setRequests(prev => [newRequest, ...prev]);
    addNotification('Đăng ký ca mới', `Bạn đã gửi yêu cầu đăng ký ca cho ${selectedDays.length} ngày`, 'info');
    pushLog(`Đăng ký ca thành công cho ${selectedDays.length} ngày. Trạng thái: Chờ duyệt.`, 'success');
    confetti({ particleCount: 80, spread: 60 });
    
    setIsModalOpen(false);
    setSelectedDays([]);
  };

  // Helper to get request status for a specific day
  const getRequestForDay = (day) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.find(req => {
      if (req.employeeId !== currentUser.employeeId || req.type !== 'Đăng ký ca làm việc') return false;
      if (req.selectedDays && req.selectedDays.includes(dayStr)) return true;
      if (!req.selectedDays && req.fromDate <= dayStr && req.toDate >= dayStr) return true;
      return false;
    });
  };

  // Render Calendar Grid
  const days = [];
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-28 border border-slate-800/50 bg-slate-900/10"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isPast = dayStr < todayStr;
    const isToday = dayStr === todayStr;
    const req = getRequestForDay(day);
    const isSelected = selectedDays.includes(dayStr);

    let bgClass = "bg-slate-900/30 hover:bg-slate-800/50 cursor-pointer transition";
    if (isPast) bgClass = "bg-slate-900/10 opacity-50 cursor-not-allowed";
    else if (isSelected) bgClass = "bg-teal-500/10 border-teal-500/50 cursor-pointer ring-1 ring-teal-500/50 z-10";
    else if (req) {
      if (req.status === 'Approved') bgClass = "bg-emerald-500/10 border-emerald-500/20";
      else if (req.status === 'Pending') bgClass = "bg-amber-500/10 border-amber-500/20";
      else if (req.status === 'Rejected') bgClass = "bg-rose-500/10 border-rose-500/20";
    }

    days.push(
      <div 
        key={day} 
        onClick={() => !isPast && !req && handleDayClick(day)}
        className={`h-28 p-2 border border-slate-800 flex flex-col relative group ${bgClass}`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-sm font-bold ${isToday ? 'bg-teal-500 text-slate-950 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>
            {day}
          </span>
          {req && (
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
              {req.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {req.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
              {req.status === 'Rejected' && <X className="w-3.5 h-3.5 text-rose-400" />}
            </div>
          )}
        </div>
        
        {req && (
          <div className="mt-auto space-y-1">
            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
              req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
              req.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
              'bg-rose-500/20 text-rose-400'
            }`}>
              {req.shift.split('(')[0].trim()}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest pl-1">
              {req.workMode}
            </div>
          </div>
        )}

        {!isPast && !req && !isSelected && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/60 backdrop-blur-sm transition rounded">
            <span className="text-xs font-bold text-teal-400">Chọn</span>
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/40 animate-in zoom-in-75">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Đăng ký Ca làm việc</h1>
          <p className="text-slate-400 text-sm mt-1">Sắp xếp và quản lý lịch làm việc linh hoạt theo từng ngày.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-sm font-bold text-slate-200 min-w-[120px] text-center">
            Tháng {month + 1}, {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-855 rounded-3xl p-6 shadow-xl overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-slate-800">
            {days}
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-8 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div> Đã duyệt</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div> Chờ duyệt</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div> Từ chối</div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedDays.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-full px-5 py-3 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-black text-sm">
              {selectedDays.length}
            </div>
            <span className="text-sm font-semibold text-slate-200">Ngày được chọn</span>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
            <button 
              onClick={() => setSelectedDays([])}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-full transition"
            >
              Hủy chọn
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-full text-sm shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
            >
              Tiếp tục <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-400" />
                Đăng ký {selectedDays.length} ca
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleRegister} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Ca làm việc *</label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-200"
                >
                  {shiftsOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Hình thức làm việc *</label>
                <select
                  value={workMode}
                  onChange={e => setWorkMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 text-slate-200"
                >
                  <option value="Onsite">Tại văn phòng (Onsite)</option>
                  <option value="Online">Làm từ xa (Online)</option>
                </select>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[11px] flex items-start gap-2 leading-relaxed mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Đơn đăng ký ca sẽ được tự động chuyển đến bộ phận Quản lý để xét duyệt.</span>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-teal-500/10 transition">
                  Xác nhận đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
