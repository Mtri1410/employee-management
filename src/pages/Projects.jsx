import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Briefcase, Calendar, Users, CheckCircle2, Clock, AlertTriangle, Search, Building2, Plus, Trash2, Edit2, ClipboardList, CheckSquare, Square } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Projects() {
  const { 
    currentUser, 
    departments, 
    allUsers, 
    projects, 
    setProjects, 
    pushLog, 
    showDialog,
    deptManagers
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Modals visibility
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState(null); // null if creating
  const [activeProjForTasks, setActiveProjForTasks] = useState(null);

  // Form states
  const [projForm, setProjForm] = useState({
    name: '',
    department: '',
    managerId: '',
    memberIds: [],
    startDate: '',
    endDate: '',
    budget: '',
    status: 'Ý tưởng (BA tạo)'
  });

  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    assigneeId: '',
    deadline: ''
  });

  // Permission & Role Helpers
  const isBA = currentUser.position === 'Business Analyst (BA)';

  const canCreateProject = () => {
    if (currentUser.role === 'Admin') return true;
    if (isBA) return true;
    // Department managers can create projects
    const isAnyDeptManager = deptManagers && Object.values(deptManagers).includes(currentUser.employeeId);
    return isAnyDeptManager;
  };

  const isAuthorizedToModify = (project = null) => {
    if (currentUser.role === 'Admin') return true;
    if (!project) return false;

    // Trưởng phòng ban quản lý phòng ban của dự án
    const isProjectDeptMgr = deptManagers && deptManagers[project.department] === currentUser.employeeId;
    // PM của dự án
    const isProjectPM = project.managerId === currentUser.employeeId;
    // BA tạo ý tưởng thuộc cùng phòng ban
    const isProjectBA = isBA && project.status === 'Ý tưởng (BA tạo)' && currentUser.department === project.department;

    return isProjectDeptMgr || isProjectPM || isProjectBA;
  };

  const canEditFinanceAndTimeline = 
    currentUser.role === 'Admin' || 
    (deptManagers && Object.values(deptManagers).includes(currentUser.employeeId)) ||
    (editingProj && editingProj.managerId === currentUser.employeeId);

  const canManageTasks = (project) => {
    if (currentUser.role === 'Admin') return true;
    if (!project) return false;
    const isPM = project.managerId === currentUser.employeeId;
    const isMember = (project.memberIds || []).includes(currentUser.employeeId);
    return isPM || isMember;
  };

  // 1. KPI Calculations
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === 'Đang thực hiện').length;
  const completedProjects = projects.filter(p => p.status === 'Đã hoàn thành').length;
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  // 2. Filter logic
  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (allUsers.find(u => u.employeeId === p.managerId)?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchDept = !deptFilter || p.department === deptFilter;
    
    // Non-admins only see projects they are participating in or managing
    const isParticipant = currentUser.role === 'Admin' || currentUser.role === 'HR' || currentUser.role === 'KeToan' ||
                          p.managerId === currentUser.employeeId || (p.memberIds || []).includes(currentUser.employeeId);
                          
    return matchSearch && matchStatus && matchDept && isParticipant;
  });

  // 3. Project CRUD handlers
  const handleOpenAddProj = () => {
    setEditingProj(null);
    setProjForm({
      name: '',
      department: departments[0] || '',
      managerId: allUsers[0]?.employeeId || '',
      memberIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: '',
      status: 'Đang chuẩn bị'
    });
    setIsProjModalOpen(true);
  };

  const handleOpenEditProj = (proj) => {
    setEditingProj(proj);
    setProjForm({
      name: proj.name,
      department: proj.department,
      managerId: proj.managerId,
      memberIds: proj.memberIds || [],
      startDate: proj.startDate,
      endDate: proj.endDate,
      budget: proj.budget || '',
      status: proj.status
    });
    setIsProjModalOpen(true);
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projForm.name.trim()) return;

    if (editingProj) {
      // Edit
      setProjects(prev => prev.map(p => {
        if (p.id === editingProj.id) {
          return {
            ...p,
            name: projForm.name.trim(),
            department: projForm.department,
            managerId: projForm.managerId,
            memberIds: projForm.memberIds,
            startDate: projForm.startDate,
            endDate: projForm.endDate,
            budget: Number(projForm.budget) || 0,
            status: projForm.status
          };
        }
        return p;
      }));
      pushLog(`Cập nhật thông tin dự án: ${projForm.name.trim()}`, 'success');
      showDialog({ title: 'Thành công', message: `Đã cập nhật dự án "${projForm.name.trim()}" thành công.`, type: 'success' });
    } else {
      // Create
      const newProj = {
        id: `p_${Date.now()}`,
        name: projForm.name.trim(),
        department: projForm.department,
        managerId: projForm.managerId,
        memberIds: projForm.memberIds,
        startDate: projForm.startDate,
        endDate: projForm.endDate,
        budget: Number(projForm.budget) || 0,
        status: projForm.status,
        progress: 0,
        tasks: []
      };
      setProjects(prev => [...prev, newProj]);
      pushLog(`Tạo mới dự án: ${newProj.name}`, 'success');
      showDialog({ title: 'Thành công', message: `Đã tạo dự án mới "${newProj.name}" thành công.`, type: 'success' });
      confetti({ particleCount: 50, spread: 40 });
    }
    setIsProjModalOpen(false);
  };

  const handleDeleteProj = (projId) => {
    const target = projects.find(p => p.id === projId);
    showDialog({
      title: 'Xác nhận xóa dự án',
      message: `Bạn có chắc chắn muốn xóa dự án "${target?.name}"? Mọi công việc liên quan sẽ bị xóa vĩnh viễn.`,
      type: 'warning',
      onConfirm: () => {
        setProjects(prev => prev.filter(p => p.id !== projId));
        pushLog(`Đã xóa dự án: ${target?.name}`, 'success');
      }
    });
  };

  const handleApproveProj = (projId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        pushLog(`Phê duyệt dự án: ${p.name} thành công. Trạng thái chuyển sang Đang thực hiện.`, 'success');
        return { ...p, status: 'Đang thực hiện' };
      }
      return p;
    }));
    showDialog({
      title: 'Đã phê duyệt',
      message: 'Dự án đã được duyệt thành công và chuyển sang trạng thái Đang thực hiện.',
      type: 'success'
    });
  };

  const handleRejectProj = (projId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        pushLog(`Từ chối dự án: ${p.name}. Trạng thái trả về Ý tưởng.`, 'warning');
        return { ...p, status: 'Ý tưởng (BA tạo)' };
      }
      return p;
    }));
    showDialog({
      title: 'Từ chối dự án',
      message: 'Đã từ chối dự án và chuyển trạng thái về dạng Ý tưởng để PM điều chỉnh lại.',
      type: 'warning'
    });
  };

  // 4. Task Management handlers
  const handleOpenTasks = (proj) => {
    setActiveProjForTasks(proj);
    setNewTaskForm({
      name: '',
      assigneeId: proj.memberIds[0] || proj.managerId || '',
      deadline: ''
    });
    setIsTaskModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.name.trim() || !activeProjForTasks) return;

    const newTask = {
      id: `task_${Date.now()}`,
      name: newTaskForm.name.trim(),
      assigneeId: newTaskForm.assigneeId,
      status: 'Chờ làm',
      deadline: newTaskForm.deadline || ''
    };

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjForTasks.id) {
        const nextTasks = [...(p.tasks || []), newTask];
        const nextProgress = calculateProgress(nextTasks);
        
        const updated = {
          ...p,
          tasks: nextTasks,
          progress: nextProgress
        };
        setActiveProjForTasks(updated); // Sync local modal view
        return updated;
      }
      return p;
    }));

    pushLog(`Thêm công việc "${newTask.name}" vào dự án "${activeProjForTasks.name}"`, 'success');
    setNewTaskForm(prev => ({ ...prev, name: '', deadline: '' }));
  };

  const handleToggleTaskStatus = (taskId) => {
    if (!activeProjForTasks) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjForTasks.id) {
        const nextTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            const nextStatus = t.status === 'Hoàn thành' ? 'Đang làm' : 'Hoàn thành';
            return { ...t, status: nextStatus };
          }
          return t;
        });
        const nextProgress = calculateProgress(nextTasks);
        
        const updated = {
          ...p,
          tasks: nextTasks,
          progress: nextProgress
        };
        setActiveProjForTasks(updated); // Sync local modal view
        return updated;
      }
      return p;
    }));
  };

  const handleDeleteTask = (taskId) => {
    if (!activeProjForTasks) return;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjForTasks.id) {
        const nextTasks = p.tasks.filter(t => t.id !== taskId);
        const nextProgress = calculateProgress(nextTasks);

        const updated = {
          ...p,
          tasks: nextTasks,
          progress: nextProgress
        };
        setActiveProjForTasks(updated);
        return updated;
      }
      return p;
    }));
  };

  const calculateProgress = (tasksList) => {
    if (!tasksList || tasksList.length === 0) return 0;
    const completedCount = tasksList.filter(t => t.status === 'Hoàn thành').length;
    return Math.round((completedCount / tasksList.length) * 100);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-400" />
            Hệ thống Quản lý Dự án
          </h2>
          <p className="text-slate-550 text-xs mt-0.5">Giám sát tiến độ công việc, quản lý ngân sách và điều phối thành viên tổ dự án.</p>
        </div>

        {canCreateProject() && (
          <button
            onClick={handleOpenAddProj}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
          >
            <Plus className="w-4 h-4" /> Tạo dự án mới
          </button>
        )}
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-550">Tổng dự án</span>
            <span className="text-2xl font-bold text-slate-250 tracking-tight mt-0.5">{totalProjects}</span>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-550">Đang thực hiện</span>
            <span className="text-2xl font-bold text-slate-250 tracking-tight mt-0.5">{inProgressProjects}</span>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-550">Đã hoàn thành</span>
            <span className="text-2xl font-bold text-slate-250 tracking-tight mt-0.5">{completedProjects}</span>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-550">Tổng ngân sách</span>
            <span className="text-lg font-bold text-slate-250 tracking-tight mt-1">{formatCurrency(totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-slate-900/20 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên dự án hoặc PM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex gap-2">
          {/* Status select filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Ý tưởng (BA tạo)">Ý tưởng (BA tạo)</option>
            <option value="Chờ duyệt">Đang chờ duyệt</option>
            <option value="Đang thực hiện">Đang thực hiện</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </select>

          {/* Department select filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full bg-slate-900/10 border border-dashed border-slate-800 p-12 text-center text-slate-500 italic rounded-3xl">
            Không tìm thấy dự án nào phù hợp.
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const pm = allUsers.find(u => u.employeeId === proj.managerId);
            const totalTasksCount = proj.tasks ? proj.tasks.length : 0;
            const doneTasksCount = proj.tasks ? proj.tasks.filter(t => t.status === 'Hoàn thành').length : 0;
            
            // Status colors
            const statusClass = 
              proj.status === 'Đã hoàn thành' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              proj.status === 'Đang thực hiện' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              proj.status === 'Tạm ngưng' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              'bg-slate-800 text-slate-400 border border-slate-750';

            return (
              <div key={proj.id} className="bg-slate-900/30 border border-slate-855 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-750 transition duration-300">
                <div className="space-y-4">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="px-2.5 py-0.5 bg-slate-950/65 text-slate-450 border border-slate-800/80 rounded-full text-[9px] font-bold uppercase tracking-wider block w-max">
                        {proj.department}
                      </span>
                      <h4 className="font-bold text-slate-200 mt-1.5 truncate text-sm" title={proj.name}>
                        {proj.name}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${statusClass}`}>
                      {proj.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Tiến độ hoàn thành</span>
                      <span className="font-mono text-slate-200">{proj.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 relative">
                      <div 
                        style={{ width: `${proj.progress}%` }}
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Details metadata */}
                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-b border-slate-850/60 py-3.5">
                    <div>
                      <span className="block text-[10px] text-slate-550 font-semibold uppercase">Ngân sách</span>
                      <span className="font-bold text-slate-200 mt-0.5 block truncate">{formatCurrency(proj.budget)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-550 font-semibold uppercase">Hạn chót</span>
                      <span className="font-medium text-slate-300 mt-0.5 block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                        {proj.endDate ? formatDate(proj.endDate) : 'Chưa thiết lập'}
                      </span>
                    </div>
                  </div>

                  {/* Project Team Members row of badges */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[10px] text-slate-550 font-semibold uppercase">Đội ngũ dự án</span>
                    <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto pr-1">
                      {/* PM Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 border border-teal-500/25 rounded-md text-[9px] font-bold text-teal-400">
                        {pm ? pm.fullName.split(' ').pop() : 'PM'} (PM)
                      </span>
                      {/* Members Badges */}
                      {(proj.memberIds || []).filter(id => id !== proj.managerId).map(id => {
                        const mUser = allUsers.find(u => u.employeeId === id);
                        if (!mUser) return null;
                        const shortName = mUser.fullName.split(' ').pop();
                        // Format role abbreviation
                        let roleAbbrev = mUser.position;
                        if (roleAbbrev.includes('(')) {
                          roleAbbrev = roleAbbrev.split('(')[1].replace(')', '');
                        } else if (roleAbbrev === 'Chuyên viên HR') {
                          roleAbbrev = 'HR';
                        } else if (roleAbbrev === 'Kế toán viên') {
                          roleAbbrev = 'ACC';
                        }
                        return (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950/70 border border-slate-800 rounded-md text-[9px] font-medium text-slate-300">
                            {shortName} ({roleAbbrev})
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manager & Participants count */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6.5 h-6.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[9px] uppercase">
                        {pm ? pm.fullName.split(' ').pop().substring(0, 2) : 'PM'}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-tight font-medium">Quản trị (PM)</span>
                        <span className="font-semibold text-slate-300 block leading-tight mt-0.5">{pm ? pm.fullName : 'Chưa xếp'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block leading-tight font-medium">Công việc</span>
                      <span className="font-bold text-slate-350 block leading-tight mt-0.5">
                        {doneTasksCount}/{totalTasksCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Actions Bar */}
                {proj.status === 'Chờ duyệt' && (currentUser.role === 'Admin' || currentUser.role === 'HR' || currentUser.role === 'KeToan') && (
                  <div className="mt-4 p-3 bg-teal-500/5 border border-teal-500/15 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-teal-400">Đang chờ duyệt:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveProj(proj.id)}
                        className="px-3 py-1.5 bg-teal-550 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition text-[10px]"
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectProj(proj.id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 font-bold rounded-lg border border-rose-500/20 transition text-[10px]"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-855/40">
                  <button
                    type="button"
                    onClick={() => handleOpenTasks(proj)}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-855 text-slate-350 hover:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-800"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Công việc
                  </button>

                  {isAuthorizedToModify(proj) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditProj(proj)}
                        className="px-3 py-2 bg-slate-950 hover:bg-slate-855 text-slate-450 hover:text-teal-400 rounded-xl text-xs transition border border-slate-800"
                        title="Sửa dự án"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProj(proj.id)}
                        className="px-3 py-2 bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-xl text-xs transition border border-slate-800"
                        title="Xóa dự án"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Project Add/Edit Modal (via Portal) */}
      {isProjModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  {editingProj ? '📝 Chỉnh sửa Dự án' : '➕ Khởi tạo Dự án mới'}
                </h3>
                <p className="text-slate-550 text-xs mt-0.5">Nhập các thông tin mục tiêu, ngân sách, nhân sự tham gia dự án.</p>
              </div>
              <button
                onClick={() => setIsProjModalOpen(false)}
                className="text-slate-550 hover:text-slate-355 transition text-xl font-black px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="p-6 space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tên dự án *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Xây dựng cổng thanh toán trực tuyến"
                    value={projForm.name}
                    onChange={(e) => setProjForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Department & Budget Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Phòng ban phụ trách *</label>
                    <select
                      value={projForm.department}
                      onChange={(e) => setProjForm(prev => ({ ...prev, department: e.target.value, managerId: '', memberIds: [] }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Ngân sách (VNĐ) *</label>
                    <input
                      type="number"
                      required={canEditFinanceAndTimeline}
                      disabled={!canEditFinanceAndTimeline}
                      placeholder={canEditFinanceAndTimeline ? "Ví dụ: 100000000" : "PM sẽ thiết lập sau"}
                      value={projForm.budget}
                      onChange={(e) => setProjForm(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Project Manager */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Quản trị dự án (PM / Trưởng phòng) *</label>
                  <select
                    value={projForm.managerId}
                    onChange={(e) => setProjForm(prev => ({ ...prev, managerId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Chọn PM --</option>
                    {allUsers.filter(u => u.department === projForm.department && !u.isLocked).map(u => (
                      <option key={u.employeeId} value={u.employeeId}>{u.fullName} ({u.employeeId})</option>
                    ))}
                  </select>
                </div>

                {/* Project Status & Timeline Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      required={canEditFinanceAndTimeline}
                      disabled={!canEditFinanceAndTimeline}
                      value={projForm.startDate}
                      onChange={(e) => setProjForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Hạn chót *</label>
                    <input
                      type="date"
                      required={canEditFinanceAndTimeline}
                      disabled={!canEditFinanceAndTimeline}
                      value={projForm.endDate}
                      onChange={(e) => setProjForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Trạng thái *</label>
                    <select
                      value={projForm.status}
                      disabled={!canEditFinanceAndTimeline}
                      onChange={(e) => setProjForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Ý tưởng (BA tạo)">Ý tưởng (BA tạo)</option>
                      <option value="Chờ duyệt">Đề xuất (PM lập) & Chờ duyệt</option>
                      <option value="Đang thực hiện">Đang thực hiện</option>
                      <option value="Tạm ngưng">Tạm ngưng</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>

                {/* Project Members Multi-select checkboxes */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Thành viên tham gia (Phòng ban {projForm.department})</label>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto space-y-2">
                    {allUsers.filter(u => u.department === projForm.department && !u.isLocked).length === 0 ? (
                      <span className="text-xs text-slate-600 italic block py-2 text-center">Không có nhân sự nào trong ban này.</span>
                    ) : (
                      allUsers.filter(u => u.department === projForm.department && !u.isLocked).map(user => {
                        const isChecked = projForm.memberIds.includes(user.employeeId);
                        return (
                          <label key={user.employeeId} className="flex items-center gap-3.5 bg-slate-900/30 hover:bg-slate-900/60 p-2 rounded-xl border border-slate-850 hover:border-slate-800 transition cursor-pointer text-xs select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!canEditFinanceAndTimeline}
                              onChange={() => {
                                setProjForm(prev => {
                                  const nextMembers = isChecked
                                    ? prev.memberIds.filter(id => id !== user.employeeId)
                                    : [...prev.memberIds, user.employeeId];
                                  return { ...prev, memberIds: nextMembers };
                                });
                              }}
                              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-teal-500 focus:ring-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                              <span className="font-semibold text-slate-200 block">{user.fullName}</span>
                              <span className="text-[10px] text-slate-550 font-mono">{user.employeeId} | {user.position}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setIsProjModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-semibold transition border border-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/10"
                >
                  Lưu dự án
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Tasks Management & Milestones Modal (via Portal) */}
      {isTaskModalOpen && activeProjForTasks && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950/10">
              <div>
                <h3 className="font-bold text-slate-100 text-base">
                  📋 Quản lý Công việc: {activeProjForTasks.name}
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Tiến độ tổng quát: {activeProjForTasks.progress}% ({activeProjForTasks.tasks?.filter(t => t.status === 'Hoàn thành').length || 0}/{activeProjForTasks.tasks?.length || 0} công việc đã hoàn tất)</p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-550 hover:text-slate-350 transition text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            {/* Add Task Form (PM or project members can add tasks) */}
            {canManageTasks(activeProjForTasks) && (
              <div className="p-6 border-b border-slate-850 bg-slate-950/20 space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Thêm công việc mới</span>
                
                <form onSubmit={handleAddTask} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-3">
                    <input
                      type="text"
                      required
                      placeholder="Tên công việc..."
                      value={newTaskForm.name}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">Người thực hiện</label>
                    <select
                      value={newTaskForm.assigneeId}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {/* Only show project PM and participants */}
                      <option value={activeProjForTasks.managerId}>
                        {allUsers.find(u => u.employeeId === activeProjForTasks.managerId)?.fullName || 'PM'} (PM)
                      </option>
                      {(activeProjForTasks.memberIds || []).filter(id => id !== activeProjForTasks.managerId).map(id => {
                        const user = allUsers.find(u => u.employeeId === id);
                        return user ? (
                          <option key={id} value={id}>{user.fullName} ({id})</option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-slate-500 font-semibold block">Hạn chót</label>
                    <input
                      type="date"
                      required
                      value={newTaskForm.deadline}
                      onChange={(e) => setNewTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-lg shadow-teal-500/10"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm việc
                  </button>
                </form>
              </div>
            )}

            {/* Task list view */}
            <div className="p-6 space-y-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Danh sách công việc</span>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {(!activeProjForTasks.tasks || activeProjForTasks.tasks.length === 0) ? (
                  <div className="text-center text-slate-600 italic text-xs py-10">
                    Chưa có công việc nào được giao trong dự án này.
                  </div>
                ) : (
                  activeProjForTasks.tasks.map((task) => {
                    const assignee = allUsers.find(u => u.employeeId === task.assigneeId);
                    const isCompleted = task.status === 'Hoàn thành';
                    const canUserToggle = currentUser.role === 'Admin' || 
                                         activeProjForTasks.managerId === currentUser.employeeId || 
                                         task.assigneeId === currentUser.employeeId;

                    return (
                      <div 
                        key={task.id} 
                        className={`flex items-center justify-between p-3 rounded-2xl border transition duration-200 text-xs gap-3 ${
                          isCompleted 
                            ? 'bg-slate-950/20 border-slate-850/40 opacity-70' 
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-750'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox toggle status */}
                          <button
                            type="button"
                            disabled={!canUserToggle}
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`text-slate-450 hover:text-teal-400 transition ${
                              canUserToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <span className={`font-semibold block truncate leading-tight ${
                              isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}>
                              {task.name}
                            </span>
                            
                            <div className="flex items-center gap-3 text-[10px] text-slate-550 mt-1 leading-none">
                              <span>Giao cho: <strong className="text-slate-400 font-medium">{assignee ? assignee.fullName : task.assigneeId}</strong></span>
                              {task.deadline && (
                                <span className="flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                                  Hạn chót: {formatDate(task.deadline)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Delete actions */}
                        {canManageTasks(activeProjForTasks) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-rose-950/65 text-slate-550 hover:text-rose-400 rounded-lg transition"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-slate-800/80 bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-semibold transition border border-slate-800"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Internal date helper
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '—') return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};
