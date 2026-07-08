const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/pages/HR.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add createPortal import
const importStr = "import React, { useState } from 'react';";
const newImportStr = "import React, { useState } from 'react';\nimport { createPortal } from 'react-dom';";
if (content.includes(importStr) && !content.includes('createPortal')) {
  content = content.replace(importStr, newImportStr);
}

// 2. Replace state variables
const stateStr = `  const [editingUserId, setEditingUserId] = useState(null);\n  const [selectedRole, setSelectedRole] = useState('');\n  const [selectedDept, setSelectedDept] = useState('');\n  const [selectedPos, setSelectedPos] = useState('');\n  const [errorMsg, setErrorMsg] = useState('');`;
const newStateStr = `  const [transferringUser, setTransferringUser] = useState(null);\n  const [transferDept, setTransferDept] = useState('');\n  const [transferPos, setTransferPos] = useState('');\n  const [transferRole, setTransferRole] = useState('');\n  const [errorMsg, setErrorMsg] = useState('');`;
content = content.replace(stateStr, newStateStr);

// 2b. Add baseSalary to hrEditForm
const editFormStr = `  const [hrEditForm, setHrEditForm] = useState({\n    fullName: '',\n    email: '',\n    phone: '',\n    cccd: '',\n    dob: '',\n    gender: 'Nam',\n    address: '',\n    startDate: ''\n  });`;
const newEditFormStr = `  const [hrEditForm, setHrEditForm] = useState({\n    fullName: '',\n    email: '',\n    phone: '',\n    cccd: '',\n    dob: '',\n    gender: 'Nam',\n    address: '',\n    startDate: '',\n    baseSalary: ''\n  });`;
content = content.replace(editFormStr, newEditFormStr);

// 3. Replace handleEditClick and handleSave with handleSaveTransfer
const handlersPattern = `  const handleEditClick = (user) => {
    setEditingUserId(user.employeeId);
    setSelectedRole(user.role);
    setSelectedDept(user.department);
    setSelectedPos(user.position || '');
    setErrorMsg('');
  };

  const handleSave = (userId) => {
    setErrorMsg('');
    const editingUser = allUsers.find(u => u.employeeId === userId);

    const getRoleLevel = (r) => {
      if (r === 'Admin') return 3;
      if (r === 'HR' || r === 'KeToan') return 2;
      return 1;
    };

    // 1. HR cannot edit Admin accounts
    if (currentUser.role === 'HR' && editingUser.role === 'Admin') {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không được phép thay đổi thông tin hay vai trò của Admin.');
      pushLog(\`HR \${currentUser.fullName} cố gắng chỉnh sửa tài khoản Admin \${editingUser.fullName} bị chặn.\`, 'error');
      return;
    }

    // 2. HR cannot assign Admin role to others
    if (currentUser.role === 'HR' && selectedRole === 'Admin') {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không có quyền cấp vai trò Quản trị viên (Admin).');
      pushLog(\`HR \${currentUser.fullName} cố gắng phân bổ vai trò Admin cho \${editingUser.fullName} bị chặn.\`, 'error');
      return;
    }

    // 3. HR cannot downgrade another HR or KeToan (level 2) to NhanVien (level 1)
    if (currentUser.role === 'HR' && getRoleLevel(editingUser.role) === 2 && getRoleLevel(selectedRole) < 2) {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không được phép hạ cấp vai trò của nhân sự quản lý ngang hàng (HR/Kế toán) xuống cấp Nhân viên.');
      pushLog(\`HR \${currentUser.fullName} cố gắng hạ cấp vai trò của \${editingUser.fullName} (\${editingUser.role}) xuống \${selectedRole} bị chặn.\`, 'error');
      return;
    }

    pushLog(\`Đang cập nhật vai trò và phòng ban cho nhân sự mã: \${userId}...\`);

    setAllUsers(prev => prev.map(u => {
      if (u.employeeId === userId) {
        return { 
          ...u, 
          role: currentUser.role === 'HR' ? u.role : selectedRole, 
          department: selectedDept, 
          position: selectedPos 
        };
      }
      return u;
    }));

    setEditingUserId(null);
    if (currentUser.role === 'HR') {
      pushLog(\`HR cập nhật thành công nhân sự \${editingUser.fullName}: Phòng ban -> \${selectedDept || 'Chưa chọn'}, Chức vụ -> \${selectedPos || 'Chưa chọn'}\`, 'success');
    } else {
      pushLog(\`Cập nhật thành công nhân sự \${editingUser.fullName}: Phòng ban -> \${selectedDept}, Vai trò -> \${selectedRole}\`, 'success');
    }
    confetti({ particleCount: 50, spread: 40 });
  };`;

const newHandlersStr = `  const handleSaveTransfer = () => {
    setErrorMsg('');
    const getRoleLevel = (r) => {
      if (r === 'Admin') return 3;
      if (r === 'HR' || r === 'KeToan') return 2;
      return 1;
    };

    // 1. HR cannot edit Admin accounts
    if (currentUser.role === 'HR' && transferringUser.role === 'Admin') {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không được phép thay đổi thông tin hay vai trò của Admin.');
      pushLog(\`HR \${currentUser.fullName} cố gắng chỉnh sửa tài khoản Admin \${transferringUser.fullName} bị chặn.\`, 'error');
      return;
    }

    // 2. HR cannot assign Admin role to others
    if (currentUser.role === 'HR' && transferRole === 'Admin') {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không có quyền cấp vai trò Quản trị viên (Admin).');
      pushLog(\`HR \${currentUser.fullName} cố gắng phân bổ vai trò Admin cho \${transferringUser.fullName} bị chặn.\`, 'error');
      return;
    }

    // 3. HR cannot downgrade another HR or KeToan (level 2) to NhanVien (level 1)
    if (currentUser.role === 'HR' && getRoleLevel(transferringUser.role) === 2 && getRoleLevel(transferRole) < 2) {
      setErrorMsg('Thẩm quyền thất bại: Nhân sự (HR) không được phép hạ cấp vai trò của nhân sự quản lý ngang hàng (HR/Kế toán) xuống cấp Nhân viên.');
      pushLog(\`HR \${currentUser.fullName} cố gắng hạ cấp vai trò của \${transferringUser.fullName} (\${transferringUser.role}) xuống \${transferRole} bị chặn.\`, 'error');
      return;
    }

    pushLog(\`Đang cập nhật vai trò và phòng ban cho nhân sự mã: \${transferringUser.employeeId}...\`);

    setAllUsers(prev => prev.map(u => {
      if (u.employeeId === transferringUser.employeeId) {
        return { 
          ...u, 
          role: currentUser.role === 'HR' ? u.role : transferRole, 
          department: transferDept, 
          position: transferPos 
        };
      }
      return u;
    }));

    setTransferringUser(null);
    if (currentUser.role === 'HR') {
      pushLog(\`HR cập nhật thành công nhân sự \${transferringUser.fullName}: Phòng ban -> \${transferDept || 'Chưa chọn'}, Chức vụ -> \${transferPos || 'Chưa chọn'}\`, 'success');
    } else {
      pushLog(\`Cập nhật thành công nhân sự \${transferringUser.fullName}: Phòng ban -> \${transferDept}, Vai trò -> \${transferRole}\`, 'success');
    }
    confetti({ particleCount: 50, spread: 40 });
  };`;

content = content.replace(handlersPattern, newHandlersStr);

// 4. Replace handleSaveProfileByHR mapping
const saveProfileMapping = `          fullName: hrEditForm.fullName.trim(),
          email: hrEditForm.email.trim(),
          phone: hrEditForm.phone.trim(),
          cccd: hrEditForm.cccd.trim(),
          dob: hrEditForm.dob,
          gender: hrEditForm.gender,
          address: hrEditForm.address.trim(),
          startDate: hrEditForm.startDate`;

const newSaveProfileMapping = `          fullName: hrEditForm.fullName.trim(),
          email: hrEditForm.email.trim(),
          phone: hrEditForm.phone.trim(),
          cccd: hrEditForm.cccd.trim(),
          dob: hrEditForm.dob,
          gender: hrEditForm.gender,
          address: hrEditForm.address.trim(),
          startDate: hrEditForm.startDate,
          baseSalary: Number(hrEditForm.baseSalary) || 0`;

content = content.replace(saveProfileMapping, newSaveProfileMapping);

// 5. Replace table row body within map
const tbodyRegex = /<tbody className="divide-y divide-slate-850\/80 text-slate-300">([\s\S]*?)<\/tbody>/;
const newTbody = `<tbody className="divide-y divide-slate-850/80 text-slate-300">
              {filteredHRUsers.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500 italic">Không tìm thấy nhân sự phù hợp.</td></tr>
              ) : filteredHRUsers.map((user) => (
                <tr key={user.employeeId} className="hover:bg-slate-900/10 transition duration-150">
                  {/* Employee Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-350">
                        {user.fullName.split(' ').pop().substring(0,2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200">{user.fullName}</h4>
                        <span className="text-slate-500 text-xs block mt-0.5">ID: {user.employeeId}</span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-slate-300">
                    {user.department || <span className="text-slate-650 italic">Chưa sắp xếp</span>}
                  </td>

                  {/* Position */}
                  <td className="px-6 py-4 text-slate-355 text-xs">
                    {user.position || <span className="text-slate-600 italic text-[11px]">Chưa cập nhật</span>}
                  </td>

                  <td className="px-6 py-4">
                    <span className={\`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold \${
                      user.role === 'Admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      user.role === 'HR' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      user.role === 'KeToan' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-slate-800 text-slate-400'
                    }\`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 text-xs space-y-0.5 text-slate-400">
                    <span className="block">{user.email}</span>
                    <span className="block font-mono">{user.phone || 'Chưa cung cấp'}</span>
                  </td>

                  {/* Profile completeness status */}
                  <td className="px-6 py-4 text-center">
                    {user.isProfileComplete ? (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                        <UserCheck className="w-4 h-4" /> Đã hoàn thiện
                      </span>
                    ) : (
                      <span className="text-amber-500 text-xs font-semibold flex items-center justify-center gap-1">
                        <AlertTriangle className="w-4 h-4 animate-pulse" /> Thiếu thông tin
                      </span>
                    )}
                  </td>

                  {/* Contract Expiry Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={\`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold \${getContractStatus(user.contractExpiry).class}\`}>
                      {getContractStatus(user.contractExpiry).label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right space-x-2 text-nowrap">
                    {!user.isProfileComplete && (
                      <button
                        onClick={() => handleApproveProfile(user)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-955 rounded-lg text-xs font-bold transition border border-emerald-500/20 hover:border-transparent animate-pulse"
                      >
                        Kích hoạt
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedUserForDetails(user);
                        setIsRenewMode(false);
                        setNewExpiryDate(user.contractExpiry === 'Vô thời hạn' ? '' : user.contractExpiry || '');
                        setUploadedContractName('');
                        setIsEditingProfileByHR(false);
                        setErrorMsg('');
                      }}
                      className="px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-955 rounded-lg text-xs font-bold transition border border-teal-500/20 hover:border-transparent"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => {
                        setTransferringUser(user);
                        setTransferDept(user.department || departments[0]);
                        setTransferPos(user.position || '');
                        setTransferRole(user.role || 'NhanVien');
                        setErrorMsg('');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700/80"
                    >
                      Điều chuyển
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>`;
content = content.replace(tbodyRegex, newTbody);

// 6. Replace details modal at the bottom
const modalRegex = /\{\/\* Details & Contract Renewal Modal \*\/\}([\s\S]*?)\{\/\* Transfer Department\/Position Modal \*\/\}([\s\S]*?)document\.body\s*?\)\s*?\}\s*?<\/div>/;
// Wait, in clean file there is no Transfer Department/Position Modal yet!
// In the clean file, details modal starts with `{selectedUserForDetails && (` and ends before `</div>\n  );\n}`.
const cleanModalRegex = /\{\/\* Details & Contract Renewal Modal \*\/\}\s*?\{selectedUserForDetails[\s\S]*?\}\s*?\n\s*?<\/div>/;

const newModalsBlock = `{/* Details & Contract Renewal Modal */}
      {selectedUserForDetails && createPortal(
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-[4px] flex items-center justify-center z-[9998] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-855 rounded-3xl shadow-2xl p-7 max-w-4xl w-full relative animate-in zoom-in-95 duration-200">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm uppercase">
                  {selectedUserForDetails.fullName.split(' ').pop().substring(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{selectedUserForDetails.fullName}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Mã nhân sự: {selectedUserForDetails.employeeId} | {selectedUserForDetails.department || 'Chưa xếp phòng'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="text-slate-500 hover:text-slate-355 transition text-sm font-bold bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-855"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Profile Grid */}
            {isEditingProfileByHR ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs col-span-2">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={hrEditForm.fullName}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={hrEditForm.email}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Số điện thoại</label>
                  <input
                    type="text"
                    value={hrEditForm.phone}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Số CCCD / Hộ chiếu</label>
                  <input
                    type="text"
                    value={hrEditForm.cccd}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, cccd: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Ngày sinh</label>
                  <input
                    type="date"
                    value={hrEditForm.dob}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Giới tính</label>
                  <select
                    value={hrEditForm.gender}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Ngày nhận việc</label>
                  <input
                    type="date"
                    value={hrEditForm.startDate}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Lương cơ bản (Lương cứng) *</label>
                  <input
                    type="number"
                    required
                    value={hrEditForm.baseSalary}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, baseSalary: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-slate-500 block">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={hrEditForm.address}
                    onChange={(e) => setHrEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Địa chỉ Email</span>
                  <span className="text-slate-250 font-semibold">{selectedUserForDetails.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Số điện thoại</span>
                  <span className="text-slate-250 font-semibold">{selectedUserForDetails.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Số CCCD / Hộ chiếu</span>
                  <span className="text-slate-250 font-semibold">{selectedUserForDetails.cccd || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Ngày sinh</span>
                  <span className="text-slate-250 font-semibold">{formatDate(selectedUserForDetails.dob) || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Giới tính</span>
                  <span className="text-slate-250 font-semibold">{selectedUserForDetails.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Địa chỉ liên hệ</span>
                  <span className="text-slate-250 font-semibold">{selectedUserForDetails.address || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Ngày nhận việc</span>
                  <span className="text-slate-250 font-semibold">{formatDate(selectedUserForDetails.startDate) || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Vai trò quyền hạn</span>
                  <span className="text-teal-400 font-bold uppercase">{selectedUserForDetails.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Lương cơ bản (Lương cứng)</span>
                  <span className="text-teal-400 font-bold font-mono">
                    {Number(selectedUserForDetails.baseSalary || (selectedUserForDetails.role === 'Admin' ? 25000000 : (selectedUserForDetails.role === 'HR' || selectedUserForDetails.role === 'KeToan') ? 18000000 : 12000000)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-0.5">Thời hạn hợp đồng hiện tại</span>
                  <span className={\`inline-block px-2.5 py-0.5 rounded-full font-bold mt-1 text-[11px] \${getContractStatus(selectedUserForDetails.contractExpiry).class}\`}>
                    {getContractStatus(selectedUserForDetails.contractExpiry).label}
                  </span>
                </div>

                {/* Uploaded Contract File if any */}
                <div className="col-span-2 bg-slate-950/40 p-3 rounded-xl border border-slate-855 mt-2">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-2">Tài liệu hợp đồng đính kèm</span>
                  {selectedUserForDetails.contractFile ? (
                    <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-250 font-mono text-xs flex items-center gap-1.5">
                        📄 {selectedUserForDetails.contractFile}
                      </span>
                      <button
                        onClick={() => {
                          pushLog(\`HR tải xuống hợp đồng của \${selectedUserForDetails.fullName}\`, 'success');
                        }}
                        className="text-[10px] text-teal-450 hover:underline font-bold"
                      >
                        Tải xuống
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-550 italic">Chưa tải lên file hợp đồng ký kết.</span>
                  )}
                </div>
              </div>
            )}

            {/* Error Message inside modal */}
            {errorMsg && (
              <div className="mt-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-xs flex items-center gap-1.5 animate-in shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              {isRenewMode ? (
                // Contract Renewal Panel
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-455 block font-bold uppercase">Ngày hết hạn mới</label>
                      <input
                        type="date"
                        value={newExpiryDate}
                        onChange={(e) => setNewExpiryDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-455 block font-bold uppercase">Tải lên tệp hợp đồng mới (PDF)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setUploadedContractName(file.name);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-teal-400 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setErrorMsg('');
                        setIsRenewMode(false);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg border border-slate-885 transition"
                    >
                      Hủy bộ
                    </button>
                    <button
                      onClick={() => {
                        if (!newExpiryDate) {
                          setErrorMsg('Vui lòng chọn ngày hết hạn hợp đồng mới.');
                          return;
                        }
                        const selectedDate = new Date(newExpiryDate);
                        const todayDate = new Date('2026-07-02');
                        if (selectedDate < todayDate) {
                          setErrorMsg('Lỗi: Ngày hết hạn mới không được nhỏ hơn ngày hiện tại (2026-07-02).');
                          return;
                        }
                        setErrorMsg('');
                        // Update in Context
                        setAllUsers(prev => prev.map(u => {
                          if (u.employeeId === selectedUserForDetails.employeeId) {
                            return {
                              ...u,
                              contractExpiry: newExpiryDate,
                              contractSignDate: '2026-07-02',
                              contractType: u.contractType === 'Thử việc' ? '1 năm' : u.contractType || '1 năm',
                              contractFile: uploadedContractName || u.contractFile || \`HopDong_LaoDong_\${u.fullName.replace(/\\s+/g, '_')}_GiaHan.pdf\`
                            };
                          }
                          return u;
                        }));
                        pushLog(\`Gia hạn hợp đồng nhân sự \${selectedUserForDetails.fullName} thành công đến \${newExpiryDate}.\`, 'success');
                        setSelectedUserForDetails(null);
                        setIsRenewMode(false);
                        confetti({ particleCount: 50, spread: 35 });
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      Lưu gia hạn
                    </button>
                  </div>
                </div>
              ) : isEditingProfileByHR ? (
                // Profile Edit mode actions for HR
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsEditingProfileByHR(false);
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-355 rounded-xl text-xs font-semibold border border-slate-700/80 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveProfileByHR}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-955 text-xs font-bold rounded-xl transition shadow-lg shadow-teal-500/10"
                  >
                    Lưu hồ sơ
                  </button>
                </div>
              ) : (
                // Actions selection
                <div className="flex gap-3 justify-end flex-wrap">
                  <button
                    onClick={() => {
                      setIsEditingProfileByHR(true);
                      setHrEditForm({
                        fullName: selectedUserForDetails.fullName,
                        email: selectedUserForDetails.email,
                        phone: selectedUserForDetails.phone || '',
                        cccd: selectedUserForDetails.cccd || '',
                        dob: selectedUserForDetails.dob || '',
                        gender: selectedUserForDetails.gender || 'Nam',
                        address: selectedUserForDetails.address || '',
                        startDate: selectedUserForDetails.startDate || '',
                        baseSalary: String(selectedUserForDetails.baseSalary || (selectedUserForDetails.role === 'Admin' ? 25000000 : (selectedUserForDetails.role === 'HR' || selectedUserForDetails.role === 'KeToan') ? 18000000 : 12000000))
                      });
                      setErrorMsg('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5"
                  >
                    ✏️ Sửa hồ sơ
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      id="contract-upload-direct"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAllUsers(prev => prev.map(u => {
                            if (u.employeeId === selectedUserForDetails.employeeId) {
                              return { ...u, contractFile: file.name };
                            }
                            return u;
                          }));
                          pushLog(\`Đã tải lên tệp hợp đồng "\${file.name}" cho nhân sự \${selectedUserForDetails.fullName}\`, 'success');
                          setSelectedUserForDetails(prev => ({ ...prev, contractFile: file.name }));
                          confetti({ particleCount: 20, spread: 20 });
                        }
                      }}
                    />
                    <label
                      htmlFor="contract-upload-direct"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 cursor-pointer flex items-center gap-1.5 transition select-none"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-400" /> Upload Hợp đồng (PDF)
                    </label>
                  </div>
                  <button
                    onClick={() => setIsRenewMode(true)}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-955 text-xs font-bold rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 transition flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Gia hạn hợp đồng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Transfer Department/Position Modal */}
      {transferringUser && createPortal(
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-855 rounded-3xl shadow-2xl p-6 max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
            
            <div className="relative space-y-4">
              <div>
                <h3 className="font-bold text-slate-200">Điều chuyển Nhân sự</h3>
                <p className="text-slate-500 text-xs mt-0.5">{transferringUser.fullName} (ID: {transferringUser.employeeId})</p>
              </div>

              {/* Error Message inside modal */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-xl text-[10px] flex items-center gap-1.5 animate-in shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              
              <div className="space-y-3.5 text-left">
                {/* Department */}
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">PHÒNG BAN MỚI</label>
                  <select
                    value={transferDept}
                    onChange={(e) => setTransferDept(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">CHỨC VỤ MỚI</label>
                  <select
                    value={transferPos}
                    onChange={(e) => setTransferPos(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {positions.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Role (Only editable by Admin) */}
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] block font-bold uppercase tracking-wider">VAI TRÒ HỆ THỐNG</label>
                  <select
                    value={transferRole}
                    onChange={(e) => setTransferRole(e.target.value)}
                    disabled={currentUser.role !== 'Admin'}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                  >
                    <option value="NhanVien">Nhân viên (NhanVien)</option>
                    <option value="KeToan">Kế toán (KeToan)</option>
                    <option value="HR">Nhân sự (HR)</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setErrorMsg('');
                    setTransferringUser(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-355 rounded-xl text-xs font-semibold border border-slate-700/80 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveTransfer}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-955 text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}`;

content = content.replace(cleanModalRegex, newModalsBlock);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update successful!');
