import React, { useState } from 'react';
import {
  AmbulanceVehicle,
  InspectionRecord,
  UserProfile,
  UserRole,
  UserStatus,
  VehicleStatus,
} from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  FileSpreadsheet,
  Search,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  Shield,
  Phone,
  UserCheck,
  Building,
  Printer,
  FolderSync,
  ExternalLink,
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminDashboardProps {
  currentUser: UserProfile;
  vehicles: AmbulanceVehicle[];
  inspections: InspectionRecord[];
  staffList: UserProfile[];
  onOpenNewInspection: () => void;
  onViewRecordDetail: (record: InspectionRecord) => void;
  onOpenVehicleModal: (vehicle?: AmbulanceVehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onUpdateVehicleStatus: (vehicleId: string, status: VehicleStatus) => void;
  onOpenStaffModal: (staff?: UserProfile) => void;
  onDeleteStaff: (staffId: string) => void;
  onUpdateStaffStatus: (staffId: string, status: UserStatus) => void;
  onDeleteInspection: (recordId: string) => void;
  onClearAllInspections: () => void;
  onClearAllSystemData?: (clearFleetAndStaff?: boolean) => void;
  onResetDemoData: () => void;
  onOpenGoogleSheetsModal: () => void;
  spreadsheetUrl?: string;
  onExportCsv: () => void;
  onPrintInspection?: (record: InspectionRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  vehicles,
  inspections,
  staffList,
  onOpenNewInspection,
  onViewRecordDetail,
  onOpenVehicleModal,
  onDeleteVehicle,
  onUpdateVehicleStatus,
  onOpenStaffModal,
  onDeleteStaff,
  onUpdateStaffStatus,
  onDeleteInspection,
  onClearAllInspections,
  onClearAllSystemData,
  onResetDemoData,
  onOpenGoogleSheetsModal,
  spreadsheetUrl,
  onExportCsv,
  onPrintInspection,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'vehicles' | 'staff'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'vehicle' | 'staff' | 'inspection' | 'clear_all' | 'clear_all_system';
    id: string;
    name: string;
  } | null>(null);

  // Vehicle KPI calculations
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const issueVehicles = vehicles.filter((v) => v.status === 'issue_found').length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
  const readinessRate = totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0;

  // Staff KPI calculations
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status === 'active' || !s.status).length;
  const onLeaveStaff = staffList.filter((s) => s.status === 'on_leave').length;
  const adminCount = staffList.filter((s) => s.role === 'admin').length;

  // Inspections in last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentInspectionsCount = inspections.filter((i) => i.createdAt >= oneDayAgo).length;

  // Filtered Inspections
  const filteredInspections = inspections.filter((rec) => {
    const matchesSearch =
      rec.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.vehicleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || rec.overallStatus === filterStatus;

    const matchesShift =
      filterShift === 'all' || rec.shift === filterShift;

    return matchesSearch && matchesStatus && matchesShift;
  });

  // Filtered Staff
  const filteredStaff = staffList.filter((s) => {
    const term = staffSearchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.employeeId.toLowerCase().includes(term) ||
      (s.position && s.position.toLowerCase().includes(term)) ||
      (s.department && s.department.toLowerCase().includes(term))
    );
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'vehicle') {
      onDeleteVehicle(deleteTarget.id);
    } else if (deleteTarget.type === 'staff') {
      onDeleteStaff(deleteTarget.id);
    } else if (deleteTarget.type === 'inspection') {
      onDeleteInspection(deleteTarget.id);
    } else if (deleteTarget.type === 'clear_all') {
      onClearAllInspections();
    } else if (deleteTarget.type === 'clear_all_system' && onClearAllSystemData) {
      onClearAllSystemData(true);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            แดชบอร์ดผู้ดูแลระบบยานพาหนะและบุคลากร (Admin Console)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ภาพรวมความพร้อมของรถกู้ชีพ BLS ส่วนกลาง · ระบบจัดการพนักงาน · สถิติและการซิงค์ข้อมูล
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenGoogleSheetsModal}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Google Sheets Auto-Sync</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewInspection}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
          >
            <Plus className="h-4 w-4" />
            <span>เริ่มตรวจสภาพรถใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Ambulances */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            รถกู้ชีพทั้งหมด
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {totalVehicles}
            </span>
            <span className="text-xs text-slate-400">คัน</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">รถกู้ชีพ BLS ในระบบ</p>
        </div>

        {/* Available / Normal */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            พร้อมปฏิบัติการ (ปกติ)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {availableVehicles}
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">ระบบไฟ/เครื่องยนต์ 100%</p>
        </div>

        {/* Issue Found */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-950 dark:bg-amber-950/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            พบปัญหา (เฝ้าระวัง)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {issueVehicles}
            </span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">มีรายการต้องซ่อม/อะไหล่</p>
        </div>

        {/* Maintenance */}
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm dark:border-red-950 dark:bg-red-950/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-800 dark:text-red-300">
            อยู่ระหว่างซ่อม (งดใช้)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {maintenanceVehicles}
            </span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-1 text-[11px] text-red-700 dark:text-red-400">ส่งศูนย์ซ่อมบำรุง</p>
        </div>

        {/* Staff Active Count */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            พนักงานพร้อมเข้าเวร
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {activeStaff}/{totalStaff}
            </span>
            <Users className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">พักเวร {onLeaveStaff} · ผู้ดูแล {adminCount}</p>
        </div>

        {/* Readiness Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            อัตราความพร้อมรถ
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {readinessRate}%
            </span>
            <div className="h-2 w-10 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${readinessRate}%` }}
              />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">ความพร้อมทั้งกองยาน</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-sky-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <span>ตารางประวัติการตรวจสภาพรถ ({inspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'vehicles'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-sky-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>จัดการข้อมูลรถกู้ชีพ BLS ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white shadow-sm dark:bg-sky-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>ระบบจัดการพนักงาน ({staffList.length})</span>
        </button>
      </div>

      {/* TAB 1: Inspection History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-1 items-center gap-2 min-w-[240px]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาตามทะเบียนรถ, รหัสรถ, หรือชื่อผู้ตรวจ..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="normal">ปกติ (พร้อมใช้)</option>
                <option value="issue_found">พบปัญหา</option>
                <option value="needs_repair">ส่งซ่อมบำรุง</option>
              </select>

              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">ทุกรอบเวร</option>
                <option value="24hr">เวร 24 ชม.</option>
                <option value="morning">เวรเช้า</option>
                <option value="afternoon">เวรบ่าย</option>
                <option value="night">เวรดึก</option>
              </select>

              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download className="h-3.5 w-3.5" />
                <span>ส่งออก CSV</span>
              </button>

              {currentUser.role === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({
                        type: 'clear_all',
                        id: 'all_inspections',
                        name: `ประวัติการตรวจสภาพทั้งหมด (${inspections.length} รายการ)`,
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    title="ล้างเฉพาะประวัติการตรวจสภาพรถทั้งหมด (เฉพาะ Admin)"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>เคลียร์ข้อมูลประวัติ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget({
                        type: 'clear_all_system',
                        id: 'complete_wipe',
                        name: `ข้อมูลระบบทั้งหมด (ล้างประวัติการตรวจและรายชื่อรถทั้งหมดเพื่อเริ่มทดสอบใหม่จาก 0)`,
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                    title="ล้างข้อมูลระบบทั้งหมดเพื่อเริ่มทดสอบตั้งแต่ศูนย์ (เฉพาะ Admin)"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>ล้างข้อมูลระบบทั้งหมดเพื่อทดสอบ</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetDemoData}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="รีเซ็ตข้อมูลตัวอย่างเป็นค่าเริ่มต้น"
                  >
                    <span>รีเซ็ตค่าเริ่มต้น (Demo)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">วัน-เวลาตรวจ</th>
                    <th className="px-4 py-3">รอบเวร</th>
                    <th className="px-4 py-3">รถกู้ชีพ BLS</th>
                    <th className="px-4 py-3">ผู้ตรวจเช็ค</th>
                    <th className="px-4 py-3">สถานะผลตรวจ</th>
                    <th className="px-4 py-3">รูป 4 ด้าน</th>
                    <th className="px-4 py-3">Sheets & Drive</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInspections.length > 0 ? (
                    filteredInspections.map((rec) => {
                      const photoCount = [
                        rec.photos.front,
                        rec.photos.rear,
                        rec.photos.left,
                        rec.photos.right,
                      ].filter(Boolean).length;

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-mono tabular-nums text-slate-900 dark:text-white font-medium">
                              {rec.uploadTimestamp}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-slate-600 dark:text-slate-300">
                              {rec.shift === '24hr' ? 'เวร 24 ชม.' : rec.shiftLabel}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                                {rec.vehicleCode}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {rec.plateNumber}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                              ไมล์: {rec.odometerReading ? rec.odometerReading.toLocaleString() : '-'} กม.
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {rec.inspectorName}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {rec.inspectorRole === 'admin' ? 'Admin' : 'พนักงานประจำเวร'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {rec.overallStatus === 'normal' && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" /> ปกติ
                              </span>
                            )}
                            {rec.overallStatus === 'issue_found' && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
                                <AlertTriangle className="h-3 w-3" /> พบปัญหา
                              </span>
                            )}
                            {rec.overallStatus === 'needs_repair' && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300">
                                <XCircle className="h-3 w-3" /> ส่งซ่อม
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`font-mono text-xs tabular-nums font-semibold ${
                                photoCount === 4
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {photoCount}/4 ด้าน
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  rec.googleSheetsSyncStatus === 'synced'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {rec.googleSheetsSyncStatus === 'synced' ? 'ชีต: ซิงค์แล้ว' : 'ชีต: ยังไม่ซิงค์'}
                              </span>

                              {rec.driveLinks?.folderUrl && (
                                <a
                                  href={rec.driveLinks.folderUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300"
                                  title="เปิดดูรูปถ่ายใน Google Drive"
                                >
                                  <FolderSync className="h-3 w-3" />
                                  <span>Drive รูป</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onPrintInspection && (
                                <button
                                  type="button"
                                  onClick={() => onPrintInspection(rec)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 shadow-sm"
                                  title="พิมพ์ใบรายงานผลการตรวจสภาพรถ"
                                >
                                  <Printer className="h-3 w-3" />
                                  <span>พิมพ์</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onViewRecordDetail(rec)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                <Eye className="h-3 w-3" />
                                <span>เปิดดู</span>
                              </button>

                              {currentUser.role === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'inspection',
                                      id: rec.id,
                                      name: `ประวัติการตรวจรถ ${rec.vehicleCode} (${rec.plateNumber}) วันที่ ${rec.uploadTimestamp}`,
                                    })
                                  }
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                  title="ลบประวัติการตรวจนี้ (เฉพาะ Admin)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลการตรวจตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Vehicle Management */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                รายการรถยนต์กู้ชีพส่วนกลางในระบบ (Fleet List)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่ม/แก้ไขข้อมูลรถกู้ชีพ BLS และอัปเดตสถานะความพร้อมใช้งาน
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenVehicleModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มรถกู้ชีพคันใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((veh) => (
              <div
                key={veh.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Vehicle Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950/20">
                  <img
                    src={veh.imageUrl}
                    alt={veh.code}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute left-2.5 top-2.5">
                    <span className="rounded-md bg-slate-950/80 px-2 py-0.5 font-mono text-xs font-bold text-sky-400 backdrop-blur-sm">
                      {veh.code}
                    </span>
                  </div>

                  <div className="absolute right-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                        veh.status === 'available'
                          ? 'bg-emerald-600 text-white'
                          : veh.status === 'issue_found'
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {veh.status === 'available'
                        ? 'พร้อมใช้งาน'
                        : veh.status === 'issue_found'
                        ? 'พบปัญหา'
                        : 'ส่งซ่อม'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {veh.plateNumber}
                    </h4>
                    <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                      {veh.brandModel} ({veh.year})
                    </p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>เลขไมล์ล่าสุด:</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                        {veh.currentOdometer.toLocaleString()} กม.
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ตรวจล่าสุด:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {veh.lastInspectionDate || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle & Actions */}
                  <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      ปรับสถานะด่วน:
                    </label>
                    <select
                      value={veh.status}
                      onChange={(e) => onUpdateVehicleStatus(veh.id, e.target.value as VehicleStatus)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="available">พร้อมใช้งาน (ปกติ)</option>
                      <option value="issue_found">พบปัญหา (เฝ้าระวัง)</option>
                      <option value="maintenance">อยู่ระหว่างซ่อม (งดใช้)</option>
                    </select>

                    <div className="mt-2.5 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenVehicleModal(veh)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="h-3 w-3" /> แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({
                            type: 'vehicle',
                            id: veh.id,
                            name: `รถกู้ชีพ ${veh.code} (ทะเบียน ${veh.plateNumber})`,
                          });
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        title="ลบรถ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Staff Management (ระบบจัดการพนักงาน) */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ระบบจัดการรายชื่อพนักงานและเจ้าหน้าที่กู้ชีพ (Staff Management)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่ม/แก้ไขข้อมูลเจ้าหน้าที่ กำหนดระดับสิทธิ์การเข้าใช้งาน และสถานะการเข้าเวร
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenStaffModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มพนักงานใหม่</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
              placeholder="ค้นหาเจ้าหน้าที่ตามชื่อ, รหัสพนักงาน, ตำแหน่ง หรือสังกัด..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-200"
            />
          </div>

          {/* Staff Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">รหัสพนักงาน</th>
                    <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3">ตำแหน่ง / สังกัด</th>
                    <th className="px-4 py-3">เบอร์ติดต่อ / อีเมล</th>
                    <th className="px-4 py-3">ระดับสิทธิ์</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                            {staff.employeeId}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {staff.name}
                          </div>
                          {staff.id === currentUser.id && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              (กำลังเข้าสู่ระบบอยู่ขณะนี้)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {staff.position || 'เจ้าหน้าที่กู้ชีพ'}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {staff.department || 'งานกู้ชีพ BLS'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{staff.phone || '-'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {staff.email || '-'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          {staff.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300">
                              <Shield className="h-3 w-3" /> ผู้ดูแลระบบ (Admin)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                              <UserCheck className="h-3 w-3" /> พนักงานทั่วไป (Staff)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <select
                            value={staff.status || 'active'}
                            onChange={(e) => onUpdateStaffStatus(staff.id, e.target.value as UserStatus)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <option value="active">พร้อมปฏิบัติงาน</option>
                            <option value="on_leave">พักเวร / ลา</option>
                            <option value="inactive">ระงับการใช้งาน</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenStaffModal(staff)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="h-3 w-3" /> แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'staff',
                                  id: staff.id,
                                  name: `${staff.name} (รหัส ${staff.employeeId})`,
                                });
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                              title="ลบพนักงาน"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        ไม่พบข้อมูลพนักงานที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (In-App Modal to avoid iframe confirm block) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'vehicle'
            ? 'ยืนยันการลบรถกู้ชีพ BLS'
            : deleteTarget?.type === 'staff'
            ? 'ยืนยันการลบพนักงาน'
            : deleteTarget?.type === 'clear_all'
            ? 'ยืนยันการล้างประวัติการตรวจทั้งหมด'
            : deleteTarget?.type === 'clear_all_system'
            ? 'ยืนยันการล้างข้อมูลระบบทั้งหมดเพื่อทดสอบ'
            : 'ยืนยันการลบประวัติการตรวจสภาพรถ'
        }
        message={
          deleteTarget?.type === 'vehicle'
            ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรถกู้ชีพคันนี้ออกจากระบบส่วนกลาง?'
            : deleteTarget?.type === 'staff'
            ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อพนักงานท่านนี้ออกจากระบบ?'
            : deleteTarget?.type === 'clear_all'
            ? 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจสภาพรถทั้งหมดออกจากระบบเพื่อเริ่มทดสอบใหม่? (สิทธิ์เฉพาะ Admin เท่านั้น)'
            : deleteTarget?.type === 'clear_all_system'
            ? 'ระบบจะทำการล้างประวัติการตรวจและรายชื่อรถทั้งหมดออกเพื่อให้คุณสามารถทดสอบสร้างรถและบันทึกตรวจสภาพใหม่ตั้งแต่ต้น คุณแน่ใจหรือไม่?'
            : 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจสภาพรถรอบนี้ออกจากระบบ? (สิทธิ์เฉพาะ Admin เท่านั้น)'
        }
        itemName={deleteTarget?.name || ''}
      />
    </div>
  );
};
