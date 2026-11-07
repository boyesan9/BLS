import React, { useState, useEffect } from 'react';
import {
  AmbulanceVehicle,
  GoogleSheetsConfig,
  InspectionRecord,
  UserProfile,
  UserRole,
  VehicleStatus,
} from './types';
import {
  getStoredVehicles,
  saveVehicles,
  getStoredInspections,
  saveInspectionRecord,
  updateInspectionRecord,
  getCurrentUser,
  setCurrentUser,
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  getStoredStaff,
  saveStaff,
  deleteInspectionRecord,
  clearAllInspectionRecords,
  clearAllSystemData,
  resetToInitialDemoData,
  DEMO_USERS,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { InspectionForm } from './components/InspectionForm';
import { AdminDashboard } from './components/AdminDashboard';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { VehicleModal } from './components/VehicleModal';
import { StaffModal } from './components/StaffModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PrintReportView } from './components/PrintReportView';
import { initAuth, googleSignIn, getAccessToken, logoutGoogle } from './services/firebaseAuth';
import { appendInspectionToSheet, formatRecordForSheet } from './services/googleSheets';
import { uploadInspectionMediaToDrive } from './services/googleDrive';
import { User } from 'firebase/auth';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Logged in with default persona for instant testing
  const [currentView, setCurrentView] = useState<'form' | 'dashboard'>('form');

  const [vehicles, setVehicles] = useState<AmbulanceVehicle[]>(() => getStoredVehicles());
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => getStoredInspections());

  const [selectedRecordDetail, setSelectedRecordDetail] = useState<InspectionRecord | null>(null);
  const [recordToPrint, setRecordToPrint] = useState<InspectionRecord | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<AmbulanceVehicle | null>(null);

  const [staffList, setStaffList] = useState<UserProfile[]>(() => getStoredStaff());
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<UserProfile | null>(null);

  const [googleSheetsModalOpen, setGoogleSheetsModalOpen] = useState(false);
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => getGoogleSheetsConfig());
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  const [isSyncingGSheets, setIsSyncingGSheets] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
    linkUrl?: string;
    linkText?: string;
  } | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Login handler
  const handleLogin = (user: UserProfile) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    // If admin logs in, show dashboard; if staff, show inspection form
    setCurrentView(user.role === 'admin' ? 'dashboard' : 'form');
  };

  // Switch role handler (Admin <-> Staff)
  const handleSwitchRole = (role: UserRole) => {
    const updated: UserProfile = {
      ...(currentUser || DEMO_USERS[role]),
      role,
    };
    setCurrentUserState(updated);
    setCurrentUser(updated);
    if (role === 'admin') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('form');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Google Login Trigger
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToastNotification({
          type: 'success',
          title: 'เชื่อมต่อบัญชี Google สำเร็จ',
          message: `ลงชื่อเข้าใช้ด้วย ${res.user.email} พร้อมสำหรับการซิงค์ชีต`,
        });
      }
    } catch (err: any) {
      setToastNotification({
        type: 'error',
        title: 'การเชื่อมต่อ Google ไม่สำเร็จ',
        message: err.message || 'โปรดตรวจสอบการอนุญาตสิทธิ์',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Submit Inspection Record
  const handleSubmitInspection = async (record: InspectionRecord) => {
    setIsSubmittingInspection(true);
    try {
      // 1. Save locally first
      let recordToSave = { ...record };

      // 2. Try Google Drive & Sheets Sync
      let driveSucceeded = false;
      let syncSucceeded = false;
      const targetSpreadsheetId = googleSheetsConfig.spreadsheetId;

      try {
        const token = await getAccessToken();
        if (token) {
          // Upload 4-side photos and attached document to Google Drive
          try {
            const driveLinks = await uploadInspectionMediaToDrive(token, record);
            recordToSave.driveLinks = driveLinks;
            driveSucceeded = true;
          } catch (driveErr) {
            console.warn('Google Drive upload warning:', driveErr);
          }

          // Sync row with Google Drive links to Google Sheets
          if (targetSpreadsheetId) {
            await appendInspectionToSheet(targetSpreadsheetId, recordToSave, token);
            syncSucceeded = true;
            recordToSave.googleSheetsSyncStatus = 'synced';
          }
        }
      } catch (cloudErr: any) {
        console.warn('Google Workspace sync warning:', cloudErr);
      }

      const updatedList = saveInspectionRecord(recordToSave);
      setInspections(updatedList);
      setVehicles(getStoredVehicles());

      const statusDesc = [];
      if (driveSucceeded) statusDesc.push('บันทึกรูปภาพและเอกสารลง Google Drive');
      if (syncSucceeded) statusDesc.push('ซิงค์ข้อมูลลง Google Sheets');

      setToastNotification({
        type: 'success',
        title: 'บันทึกการตรวจสภาพรถสำเร็จ!',
        message:
          statusDesc.length > 0
            ? `บันทึกข้อมูลรถ ${record.vehicleCode} (${record.plateNumber}) และ ${statusDesc.join(' + ')} เรียบร้อยแล้ว`
            : `บันทึกข้อมูลรถ ${record.vehicleCode} (${record.plateNumber}) ในระบบเรียบร้อย (สามารถซิงค์ขึ้น Drive/Sheets ภายหลังได้)`,
        linkUrl: recordToSave.driveLinks?.folderUrl || googleSheetsConfig.spreadsheetUrl,
        linkText: recordToSave.driveLinks?.folderUrl
          ? 'เปิดดูรูปใน Google Drive'
          : syncSucceeded
          ? 'เปิดดูใน Google Sheets'
          : undefined,
      });

      // Switch to dashboard to review history
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error(err);
      setToastNotification({
        type: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึก',
        message: err.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  // Force single record sync to Google Drive & Sheets
  const handleSyncSingleRecord = async (record: InspectionRecord) => {
    setIsSyncingGSheets(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setGoogleUser(res.user);
        }
      }

      if (!token) throw new Error('ไม่พบ Access Token กรุณาลงชื่อเข้าใช้ Google');

      let updatedRecord = { ...record };

      // Upload media to Google Drive if not uploaded yet
      if (!updatedRecord.driveLinks?.folderUrl) {
        try {
          const driveLinks = await uploadInspectionMediaToDrive(token, updatedRecord);
          updatedRecord.driveLinks = driveLinks;
        } catch (dErr) {
          console.warn('Drive upload error:', dErr);
        }
      }

      const sheetId = googleSheetsConfig.spreadsheetId;
      if (sheetId) {
        await appendInspectionToSheet(sheetId, updatedRecord, token);
        updatedRecord.googleSheetsSyncStatus = 'synced';
      }

      updateInspectionRecord(updatedRecord);
      setInspections(getStoredInspections());
      setSelectedRecordDetail(updatedRecord);

      setToastNotification({
        type: 'success',
        title: 'ซิงค์ข้อมูลสำเร็จ',
        message: `อัปโหลดรูปภาพลง Google Drive และบันทึกผลลง Google Sheets เรียบร้อยแล้ว`,
        linkUrl: updatedRecord.driveLinks?.folderUrl || googleSheetsConfig.spreadsheetUrl,
        linkText: 'เปิดดูใน Google Drive',
      });
    } catch (err: any) {
      setToastNotification({
        type: 'error',
        title: 'ไม่สามารถซิงค์ข้อมูลได้',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      });
    } finally {
      setIsSyncingGSheets(false);
    }
  };

  // Delete single inspection (Admin only)
  const handleDeleteInspection = (recordId: string) => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ลบประวัติการตรวจ',
      });
      return;
    }
    const updated = deleteInspectionRecord(recordId);
    setInspections(updated);
    if (selectedRecordDetail?.id === recordId) {
      setSelectedRecordDetail(null);
    }
    setToastNotification({
      type: 'info',
      title: 'ลบประวัติการตรวจแล้ว',
      message: 'ลบรายการบันทึกการตรวจสภาพรถออกจากระบบเรียบร้อยแล้ว',
    });
  };

  // Clear all inspections (Admin only)
  const handleClearAllInspections = () => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ล้างประวัติการตรวจ',
      });
      return;
    }
    const emptyList = clearAllInspectionRecords();
    setInspections(emptyList);
    setSelectedRecordDetail(null);
    setToastNotification({
      type: 'info',
      title: 'ล้างประวัติการตรวจทั้งหมดแล้ว',
      message: 'เคลียร์ตารางประวัติการตรวจสภาพรถทั้งหมดเรียบร้อยแล้ว พร้อมสำหรับการทดสอบระบบใหม่',
    });
  };

  // Reset demo data
  const handleResetDemoData = () => {
    resetToInitialDemoData();
    setVehicles(getStoredVehicles());
    setInspections(getStoredInspections());
    setStaffList(getStoredStaff());
    setSelectedRecordDetail(null);
    setToastNotification({
      type: 'success',
      title: 'รีเซ็ตข้อมูลตัวอย่างสำเร็จ',
      message: 'คืนค่าข้อมูลรถ, พนักงาน และตัวอย่างผลตรวจสภาพเรียบร้อยแล้ว',
    });
  };

  // Clear all data completely for fresh system testing
  const handleClearAllSystemData = (clearFleetAndStaff = false) => {
    if (currentUser?.role !== 'admin') {
      setToastNotification({
        type: 'error',
        title: 'ไม่มีสิทธิ์ดำเนินการ',
        message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่มีสิทธิ์ล้างข้อมูลทั้งหมด',
      });
      return;
    }
    clearAllSystemData(clearFleetAndStaff);
    setInspections([]);
    if (clearFleetAndStaff) {
      setVehicles([]);
    }
    setSelectedRecordDetail(null);
    setRecordToPrint(null);
    setToastNotification({
      type: 'info',
      title: 'ล้างข้อมูลเพื่อทดสอบระบบแล้ว',
      message: clearFleetAndStaff
        ? 'ล้างประวัติการตรวจและรายชื่อรถทั้งหมดแล้ว พร้อมให้เริ่มทดสอบระบบตั้งแต่ศูนย์'
        : 'เคลียร์ประวัติการตรวจทั้งหมดแล้ว พร้อมสำหรับการเริ่มบันทึกตรวจรถรอบใหม่',
    });
  };

  // Vehicle CRUD
  const handleSaveVehicle = (vehicle: AmbulanceVehicle) => {
    const list = [...vehicles];
    const idx = list.findIndex((v) => v.id === vehicle.id);
    if (idx >= 0) {
      list[idx] = vehicle;
    } else {
      list.push(vehicle);
    }
    setVehicles(list);
    saveVehicles(list);

    setToastNotification({
      type: 'success',
      title: 'บันทึกข้อมูลรถสำเร็จ',
      message: `บันทึกข้อมูลรถกู้ชีพ ${vehicle.code} (${vehicle.plateNumber}) แล้ว`,
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const filtered = vehicles.filter((v) => v.id !== vehicleId);
    setVehicles(filtered);
    saveVehicles(filtered);

    setToastNotification({
      type: 'info',
      title: 'ลบข้อมูลรถแล้ว',
      message: 'ลบรายการรถกู้ชีพออกจากระบบเรียบร้อยแล้ว',
    });
  };

  const handleUpdateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    const list = vehicles.map((v) => (v.id === vehicleId ? { ...v, status } : v));
    setVehicles(list);
    saveVehicles(list);
  };

  // Staff CRUD
  const handleSaveStaff = (staff: UserProfile) => {
    const list = [...staffList];
    const idx = list.findIndex((s) => s.id === staff.id);
    if (idx >= 0) {
      list[idx] = staff;
    } else {
      list.push(staff);
    }
    setStaffList(list);
    saveStaff(list);

    // If current logged in user was edited, update currentUser too
    if (currentUser && currentUser.id === staff.id) {
      setCurrentUserState(staff);
      setCurrentUser(staff);
    }

    setToastNotification({
      type: 'success',
      title: 'บันทึกข้อมูลพนักงานสำเร็จ',
      message: `บันทึกข้อมูล ${staff.name} (${staff.employeeId}) เรียบร้อยแล้ว`,
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    const filtered = staffList.filter((s) => s.id !== staffId);
    setStaffList(filtered);
    saveStaff(filtered);

    setToastNotification({
      type: 'info',
      title: 'ลบข้อมูลพนักงานแล้ว',
      message: 'ลบรายชื่อพนักงานออกจากระบบเรียบร้อยแล้ว',
    });
  };

  const handleUpdateStaffStatus = (staffId: string, status: any) => {
    const list = staffList.map((s) => (s.id === staffId ? { ...s, status } : s));
    setStaffList(list);
    saveStaff(list);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!inspections.length) {
      setToastNotification({
        type: 'info',
        title: 'ไม่มีข้อมูล',
        message: 'ยังไม่มีข้อมูลการตรวจสภาพรถสำหรับส่งออก CSV',
      });
      return;
    }

    const headers = [
      'วัน-เวลาที่ตรวจ',
      'รอบเวร',
      'รหัสรถ',
      'เลขทะเบียน',
      'ผู้ตรวจเช็ค',
      'สถานะรวม',
      'เลขไมล์ (กม.)',
      'ไฟตัวรถ',
      'ไฟฉุกเฉิน',
      'กระจก',
      'ของเหลว',
      'แบตเตอรี่',
      'เสียง',
      'ยาง',
      'ปัญหาที่พบ/หมายเหตุ',
      'เอกสารแนบ',
      'รูป 4 ด้าน',
      'รหัสบันทึก',
    ];

    const rows = inspections.map((rec) =>
      formatRecordForSheet(rec).map((val) => `"${String(val).replace(/"/g, '""')}"`)
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BLS_Vehicle_Inspections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        staffList={staffList}
        onGoogleLogin={handleGoogleLogin}
        isGoogleLoading={isGoogleLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenGoogleSheets={() => setGoogleSheetsModalOpen(true)}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
        sheetsConnected={Boolean(googleSheetsConfig.spreadsheetId)}
      />

      {/* Main Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {currentView === 'form' ? (
          <InspectionForm
            currentUser={currentUser}
            vehicles={vehicles}
            staffList={staffList}
            onSubmitInspection={handleSubmitInspection}
            onCancel={() => setCurrentView('dashboard')}
            isSubmitting={isSubmittingInspection}
          />
        ) : (
          <AdminDashboard
            currentUser={currentUser}
            vehicles={vehicles}
            inspections={inspections}
            staffList={staffList}
            onOpenNewInspection={() => setCurrentView('form')}
            onViewRecordDetail={(rec) => setSelectedRecordDetail(rec)}
            onOpenVehicleModal={(veh) => {
              setVehicleToEdit(veh || null);
              setVehicleModalOpen(true);
            }}
            onDeleteVehicle={handleDeleteVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onOpenStaffModal={(staff) => {
              setStaffToEdit(staff || null);
              setStaffModalOpen(true);
            }}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStaffStatus={handleUpdateStaffStatus}
            onDeleteInspection={handleDeleteInspection}
            onClearAllInspections={handleClearAllInspections}
            onResetDemoData={handleResetDemoData}
            onOpenGoogleSheetsModal={() => setGoogleSheetsModalOpen(true)}
            spreadsheetUrl={googleSheetsConfig.spreadsheetUrl}
            onExportCsv={handleExportCsv}
            onPrintInspection={(rec) => setRecordToPrint(rec)}
            onClearAllSystemData={handleClearAllSystemData}
          />
        )}
      </main>

      {/* Modals */}
      {recordToPrint && (
        <PrintReportView
          record={recordToPrint}
          onClose={() => setRecordToPrint(null)}
        />
      )}

      <InspectionDetailModal
        record={selectedRecordDetail}
        onClose={() => setSelectedRecordDetail(null)}
        onSyncGSheets={handleSyncSingleRecord}
        isSyncing={isSyncingGSheets}
        isAdmin={currentUser?.role === 'admin'}
        onDeleteRecord={handleDeleteInspection}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={handleSaveVehicle}
        vehicleToEdit={vehicleToEdit}
      />

      <StaffModal
        isOpen={staffModalOpen}
        onClose={() => {
          setStaffModalOpen(false);
          setStaffToEdit(null);
        }}
        onSave={handleSaveStaff}
        staffToEdit={staffToEdit}
      />

      <GoogleSheetsModal
        isOpen={googleSheetsModalOpen}
        onClose={() => setGoogleSheetsModalOpen(false)}
        config={googleSheetsConfig}
        onSaveConfig={(cfg) => {
          setGoogleSheetsConfig(cfg);
          saveGoogleSheetsConfig(cfg);
        }}
        inspections={inspections}
        onUpdateInspection={(updated) => {
          updateInspectionRecord(updated);
          setInspections(getStoredInspections());
        }}
        googleUser={googleUser}
        onGoogleLoginSuccess={(u) => setGoogleUser(u)}
      />

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3">
          <div
            className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md ${
              toastNotification.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100'
                : toastNotification.type === 'error'
                ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100'
                : 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/90 dark:text-sky-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {toastNotification.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h5 className="text-xs font-bold">{toastNotification.title}</h5>
                <p className="mt-0.5 text-xs opacity-90">{toastNotification.message}</p>
                {toastNotification.linkUrl && (
                  <a
                    href={toastNotification.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-bold text-xs underline"
                  >
                    <span>{toastNotification.linkText || 'เปิดดูลิงก์'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
