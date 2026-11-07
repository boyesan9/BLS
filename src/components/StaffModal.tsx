import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, UserStatus } from '../types';
import { X, UserCheck, Check, Shield, User } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: UserProfile) => void;
  staffToEdit?: UserProfile | null;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSave,
  staffToEdit,
}) => {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (staffToEdit) {
      setName(staffToEdit.name);
      setEmployeeId(staffToEdit.employeeId);
      setRole(staffToEdit.role);
      setPosition(staffToEdit.position || '');
      setDepartment(staffToEdit.department || '');
      setPhone(staffToEdit.phone || '');
      setStatus(staffToEdit.status || 'active');
      setEmail(staffToEdit.email || '');
    } else {
      setName('');
      setEmployeeId(`EMT-${Math.floor(10000 + Math.random() * 90000)}`);
      setRole('staff');
      setPosition('เจ้าหน้าที่กู้ชีพฉุกเฉิน (EMT-B)');
      setDepartment('เวรปฏิบัติการ BLS');
      setPhone('');
      setStatus('active');
      setEmail('');
    }
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !employeeId.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุลและรหัสประจำตัวพนักงาน');
      return;
    }

    const staff: UserProfile = {
      id: staffToEdit ? staffToEdit.id : `user-${Date.now()}`,
      name: name.trim(),
      employeeId: employeeId.trim(),
      role,
      position: position.trim() || (role === 'admin' ? 'ผู้ดูแลระบบยานพาหนะ' : 'เจ้าหน้าที่กู้ชีพฉุกเฉิน'),
      department: department.trim() || 'กองยานพาหนะฉุกเฉิน',
      phone: phone.trim() || '-',
      status,
      email: email.trim() || `${name.trim().replace(/\s+/g, '.').toLowerCase()}@ems-fleet.go.th`,
      avatarUrl: staffToEdit?.avatarUrl || '',
    };

    onSave(staff);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {staffToEdit ? 'แก้ไขข้อมูลพนักงาน / เจ้าหน้าที่' : 'เพิ่มพนักงาน / เจ้าหน้าที่ใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ชื่อ-นามสกุล เจ้าหน้าที่ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น นรินทร์ สมใจ"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                รหัสประจำตัวพนักงาน *
              </label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="เช่น EMT-67055"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ตำแหน่งงาน
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="เช่น เจ้าหน้าที่กู้ชีพ EMT-B"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                สังกัด / ฝ่ายงาน
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น เวรปฏิบัติการ BLS"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ระดับสิทธิ์การเข้าใช้งาน
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="staff">พนักงานทั่วไป (Staff)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                สถานะการปฏิบัติงาน
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="active">พร้อมปฏิบัติงาน (Active)</option>
                <option value="on_leave">พักเวร / ลา (On Leave)</option>
                <option value="inactive">ระงับการใช้งาน (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                อีเมลประจำตำแหน่ง
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ems-fleet.go.th"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
            >
              <Check className="h-4 w-4" /> บันทึกข้อมูลพนักงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
