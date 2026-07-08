import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Users, Clock, Calendar, CheckCircle2, AlertTriangle, Search, Building2, Award } from 'lucide-react';

export default function Analytics() {
  const { allUsers, departments, attendanceHistory } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(7);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' or number '1', '2', etc.
  const [searchQuery, setSearchQuery] = useState('');

  // Get total days in the selected month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };
  const daysCount = getDaysInMonth(selectedMonth, selectedYear);

  // Determine current active filter status
  const isMonthly = selectedDay === 'all';
  const targetDateStr = isMonthly 
    ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
    : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  // Filter logs for the selected period (month or specific day)
  const filteredLogs = isMonthly 
    ? attendanceHistory.filter(log => log.date.startsWith(targetDateStr))
    : attendanceHistory.filter(log => log.date === targetDateStr);

  // 1. Staff Headcount by Department (active users)
  const getDeptHeadcount = () => {
    return departments.map(dept => {
      const count = allUsers.filter(u => u.department === dept && !u.isLocked).length;
      return { name: dept, count };
    });
  };
  const deptData = getDeptHeadcount();
  const maxHeadcount = Math.max(...deptData.map(d => d.count), 1);

  // 2. Attendance Status Distribution
  const totalEmployees = allUsers.filter(u => !u.isLocked).length;
  
  const getAttendanceStats = () => {
    const onTimeCount = filteredLogs.filter(l => l.status === 'Hợp lệ' || l.status === 'Đang làm việc').length;
    const lateCount = filteredLogs.filter(l => l.status === 'Đi muộn').length;
    const earlyCount = filteredLogs.filter(l => l.status === 'Về sớm').length;
    
    // For single day, absent = total - logs. For month, we sum the absent/leave logs.
    const absentCount = isMonthly 
      ? filteredLogs.filter(l => l.status === 'Vắng mặt' || l.status === 'Nghỉ phép' || l.status === 'Nghỉ không phép').length
      : Math.max(0, totalEmployees - onTimeCount - lateCount - earlyCount);

    const totalCalculated = isMonthly 
      ? filteredLogs.length 
      : totalEmployees;

    const onTimePct = totalCalculated > 0 ? Math.round((onTimeCount / totalCalculated) * 100) : 0;
    const latePct = totalCalculated > 0 ? Math.round((lateCount / totalCalculated) * 100) : 0;
    const earlyPct = totalCalculated > 0 ? Math.round((earlyCount / totalCalculated) * 100) : 0;
    const absentPct = totalCalculated > 0 ? Math.round((absentCount / totalCalculated) * 100) : 0;

    return {
      onTimeCount,
      lateCount,
      earlyCount,
      absentCount,
      onTimePct,
      latePct,
      earlyPct,
      absentPct,
      totalCalculated
    };
  };
  const stats = getAttendanceStats();

  // 3. KPI Cards Data
  const averageAttendanceRate = isMonthly
    ? (filteredLogs.length > 0 ? Math.round(((stats.onTimeCount + stats.earlyCount) / filteredLogs.length) * 100) : 0)
    : (totalEmployees > 0 ? Math.round(((stats.onTimeCount + stats.earlyCount) / totalEmployees) * 100) : 0);

  const totalHoursWorked = Math.round(filteredLogs.reduce((sum, log) => sum + (Number(log.actualHours) || 0), 0));
  const totalLateCount = stats.lateCount;

  // 4. Employee Detailed Roster / Leaderboard for the selected month or day
  const getLeaderboardOrRoster = () => {
    const activeUsers = allUsers.filter(u => !u.isLocked);
    
    if (isMonthly) {
      // Monthly Leaderboard mode
      return activeUsers.map(user => {
        const userLogs = filteredLogs.filter(log => log.employeeId === user.employeeId);
        const workedDays = userLogs.filter(l => l.status === 'Hợp lệ' || l.status === 'Về sớm' || l.status === 'Đi muộn').length;
        const lateDays = userLogs.filter(l => l.status === 'Đi muộn').length;
        const hours = userLogs.reduce((sum, log) => sum + (Number(log.actualHours) || 0), 0);
        const attendancePct = userLogs.length > 0
          ? Math.round((userLogs.filter(l => l.status === 'Hợp lệ' || l.status === 'Về sớm').length / userLogs.length) * 100)
          : 100;

        return {
          ...user,
          workedDays,
          lateDays,
          hours: Number(hours.toFixed(1)),
          attendancePct
        };
      }).sort((a, b) => b.hours - a.hours);
    } else {
      // Daily Attendance Roster mode
      return activeUsers.map(user => {
        const log = filteredLogs.find(l => l.employeeId === user.employeeId);
        return {
          ...user,
          clockIn: log ? log.clockIn : '—',
          clockOut: log ? log.clockOut : '—',
          hours: log ? Number((Number(log.actualHours) || 0).toFixed(1)) : 0,
          status: log ? log.status : 'Vắng mặt',
          shift: log ? log.shift : '—'
        };
      }).sort((a, b) => {
        // Sort: Active/Checked-in first, Absents last
        if (a.status === 'Vắng mặt' && b.status !== 'Vắng mặt') return 1;
        if (a.status !== 'Vắng mặt' && b.status === 'Vắng mặt') return -1;
        return 0;
      });
    }
  };

  const listData = getLeaderboardOrRoster().filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            Thống kê & Báo cáo Tổng hợp
          </h2>
          <p className="text-slate-550 text-xs mt-0.5">Phân tích hiệu suất chuyên cần và giờ công của toàn bộ nhân sự.</p>
        </div>

        {/* Date Selector (Month, Year, and Day) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2 rounded-2xl border border-slate-800 shrink-0">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          
          {/* Month Selector */}
          <div className="flex items-center">
            <span className="text-[10px] text-slate-500 uppercase font-black mr-1">Tháng:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSelectedDay('all'); // Reset day on month change
              }}
              className="bg-transparent border-0 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-4"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} className="bg-slate-900">Tháng {m}</option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center border-l border-slate-800 pl-2">
            <span className="text-[10px] text-slate-500 uppercase font-black mr-1">Năm:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setSelectedDay('all'); // Reset day on year change
              }}
              className="bg-transparent border-0 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer pr-4"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>
          </div>

          {/* Day Selector */}
          <div className="flex items-center border-l border-slate-800 pl-2">
            <span className="text-[10px] text-slate-500 uppercase font-black mr-1">Ngày:</span>
            <select 
              value={selectedDay} 
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Cả tháng</option>
              {Array.from({ length: daysCount }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} className="bg-slate-900">Ngày {String(d).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Employees */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500">Tổng nhân sự</span>
            <span className="text-2xl font-bold text-slate-200 tracking-tight mt-0.5">{totalEmployees}</span>
          </div>
        </div>

        {/* Average Attendance Rate */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500">
              {isMonthly ? 'Tỷ lệ đúng giờ' : 'Đúng giờ hôm nay'}
            </span>
            <span className="text-2xl font-bold text-slate-200 tracking-tight mt-0.5">
              {averageAttendanceRate > 0 ? `${averageAttendanceRate}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Hours Worked */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500">
              {isMonthly ? 'Tổng giờ công tháng' : 'Tổng giờ công ngày'}
            </span>
            <span className="text-2xl font-bold text-slate-200 tracking-tight mt-0.5">{totalHoursWorked}h</span>
          </div>
        </div>

        {/* Total Late Count */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-2xl p-5 shadow flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500">
              {isMonthly ? 'Tổng lượt đi muộn' : 'Lượt đi muộn ngày'}
            </span>
            <span className="text-2xl font-bold text-slate-200 tracking-tight mt-0.5">{totalLateCount}</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Department Distribution */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-teal-400" />
              Cơ cấu nhân sự theo Phòng ban
            </h3>
            <p className="text-slate-550 text-[11px] mt-0.5">Số lượng nhân sự đang hoạt động tại các phòng ban khác nhau.</p>
          </div>

          <div className="space-y-4 pt-1">
            {deptData.map((dept) => {
              const pct = (dept.count / maxHeadcount) * 100;
              return (
                <div key={dept.name} className="space-y-1.5 group">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350 group-hover:text-slate-200 transition-colors">{dept.name}</span>
                    <span className="text-slate-200">{dept.count} nhân sự</span>
                  </div>
                  <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 relative">
                    <div 
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Attendance Rate Segmented Bar */}
        <div className="bg-slate-900/30 border border-slate-855 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-400" />
              Tình trạng chuyên cần ({isMonthly ? `Tháng ${selectedMonth}/${selectedYear}` : `Ngày ${String(selectedDay).padStart(2,'0')}/${selectedMonth}/${selectedYear}`})
            </h3>
            <p className="text-slate-550 text-[11px] mt-0.5">Tỷ lệ phân phối chuyên cần theo chu kỳ lựa chọn.</p>
          </div>

          <div className="space-y-5">
            {/* Segmented Percentage Bar */}
            <div className="h-7 w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex">
              {stats.onTimePct > 0 && (
                <div 
                  style={{ width: `${stats.onTimePct}%` }} 
                  className="h-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-slate-950 transition-all duration-300"
                  title={`Đúng giờ: ${stats.onTimeCount}`}
                >
                  {stats.onTimePct}%
                </div>
              )}
              {stats.latePct > 0 && (
                <div 
                  style={{ width: `${stats.latePct}%` }} 
                  className="h-full bg-amber-500 flex items-center justify-center text-[10px] font-black text-slate-950 transition-all duration-300"
                  title={`Đi muộn: ${stats.lateCount}`}
                >
                  {stats.latePct}%
                </div>
              )}
              {stats.earlyPct > 0 && (
                <div 
                  style={{ width: `${stats.earlyPct}%` }} 
                  className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-slate-950 transition-all duration-300"
                  title={`Về sớm: ${stats.earlyCount}`}
                >
                  {stats.earlyPct}%
                </div>
              )}
              {stats.absentPct > 0 && (
                <div 
                  style={{ width: `${stats.absentPct}%` }} 
                  className="h-full bg-rose-500 flex items-center justify-center text-[10px] font-black text-slate-950 transition-all duration-300"
                  title={`Vắng mặt/Nghỉ phép: ${stats.absentCount}`}
                >
                  {stats.absentPct}%
                </div>
              )}
            </div>

            {/* Explanatory Widgets */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-855">
                <span className="block text-[9px] font-bold text-emerald-400 uppercase truncate">Đúng giờ</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">{stats.onTimeCount}</span>
                <span className="text-[9px] text-slate-550">{isMonthly ? 'Lượt' : 'Nhân sự'}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-855">
                <span className="block text-[9px] font-bold text-amber-400 uppercase truncate">Đi muộn</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">{stats.lateCount}</span>
                <span className="text-[9px] text-slate-550">{isMonthly ? 'Lượt' : 'Nhân sự'}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-855">
                <span className="block text-[9px] font-bold text-blue-400 uppercase truncate">Về sớm</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">{stats.earlyCount}</span>
                <span className="text-[9px] text-slate-550">{isMonthly ? 'Lượt' : 'Nhân sự'}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-2xl border border-slate-855">
                <span className="block text-[9px] font-bold text-rose-400 uppercase truncate">Vắng/Nghỉ</span>
                <span className="text-base font-bold text-slate-200 mt-1 block">{stats.absentCount}</span>
                <span className="text-[9px] text-slate-550">{isMonthly ? 'Lượt' : 'Nhân sự'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Leaderboard or Daily Attendance Table */}
      <div className="bg-slate-900/30 border border-slate-855 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-400" />
              {isMonthly 
                ? `Bảng xếp hạng Giờ công & Chuyên cần (Tháng ${selectedMonth}/${selectedYear})`
                : `Danh sách Chấm công Chi tiết (Ngày ${String(selectedDay).padStart(2,'0')}/${selectedMonth}/${selectedYear})`
              }
            </h3>
            <p className="text-slate-550 text-[11px] mt-0.5">
              {isMonthly
                ? 'Xếp hạng nhân sự theo số giờ làm việc thực tế được ghi nhận trong tháng.'
                : 'Báo cáo chi tiết check-in, check-out và trạng thái làm việc của toàn bộ nhân viên.'
              }
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã NV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Dynamic Table based on Filter Type */}
        <div className="border border-slate-850/80 rounded-2xl overflow-hidden bg-slate-950/20">
          <table className="w-full text-left text-xs border-collapse">
            {isMonthly ? (
              /* Monthly Table Header */
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-850">
                <tr>
                  <th className="px-5 py-3 text-center w-14">Hạng</th>
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Phòng ban / Chức vụ</th>
                  <th className="px-5 py-3 text-center">Số ngày đi làm</th>
                  <th className="px-5 py-3 text-center">Số lượt đi muộn</th>
                  <th className="px-5 py-3 text-right">Tổng số giờ công</th>
                  <th className="px-5 py-3 text-right">Tỷ lệ đúng giờ</th>
                </tr>
              </thead>
            ) : (
              /* Daily Table Header */
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-850">
                <tr>
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Phòng ban / Chức vụ</th>
                  <th className="px-5 py-3">Ca làm việc</th>
                  <th className="px-5 py-3 text-center">Check-in</th>
                  <th className="px-5 py-3 text-center">Check-out</th>
                  <th className="px-5 py-3 text-right">Số giờ làm</th>
                  <th className="px-5 py-3 text-right">Trạng thái</th>
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-850/50 text-slate-350">
              {listData.length === 0 ? (
                <tr>
                  <td colSpan={isMonthly ? 7 : 7} className="px-5 py-10 text-center text-slate-500 italic">
                    Không có dữ liệu phù hợp trong ngày/tháng được chọn.
                  </td>
                </tr>
              ) : (
                listData.map((user, idx) => {
                  if (isMonthly) {
                    /* Render Monthly Row */
                    const rank = idx + 1;
                    const medalClass = 
                      rank === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      rank === 2 ? 'bg-slate-300/20 text-slate-200 border-slate-300/30' :
                      rank === 3 ? 'bg-amber-700/20 text-amber-600 border-amber-700/30' :
                      'bg-slate-950 text-slate-500 border-slate-800';

                    return (
                      <tr key={user.employeeId} className="hover:bg-slate-900/10 transition">
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border ${medalClass}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                              {user.fullName.split(' ').pop().substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-200 block leading-tight">{user.fullName}</span>
                              <span className="text-[10px] text-slate-550 font-mono">{user.employeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="block text-slate-300">{user.department}</span>
                          <span className="text-[10px] text-slate-550">{user.position}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-slate-250">
                          {user.workedDays} ngày
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {user.lateDays > 0 ? (
                            <span className="inline-block px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold text-[10px]">
                              {user.lateDays} lần
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-200 font-mono">
                          {user.hours}h
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold font-mono">
                          <span className={user.attendancePct >= 90 ? 'text-emerald-400' : user.attendancePct >= 75 ? 'text-amber-400' : 'text-rose-400'}>
                            {user.attendancePct}%
                          </span>
                        </td>
                      </tr>
                    );
                  } else {
                    /* Render Daily Row */
                    const statusColor = 
                      user.status === 'Hợp lệ' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      user.status === 'Đang làm việc' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      user.status === 'Đi muộn' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      user.status === 'Về sớm' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20';

                    return (
                      <tr key={user.employeeId} className="hover:bg-slate-900/10 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                              {user.fullName.split(' ').pop().substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-200 block leading-tight">{user.fullName}</span>
                              <span className="text-[10px] text-slate-550 font-mono">{user.employeeId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="block text-slate-300">{user.department}</span>
                          <span className="text-[10px] text-slate-550">{user.position}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 truncate max-w-[150px]">
                          {user.shift}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-slate-250">
                          {user.clockIn}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-slate-250">
                          {user.clockOut}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-200 font-mono">
                          {user.hours > 0 ? `${user.hours}h` : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusColor}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
