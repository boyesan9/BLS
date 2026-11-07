import React, { useState } from 'react';
import {
  AmbulanceVehicle,
  FourSidePhotos,
  InspectionRecord,
  ItemStatus,
  ShiftType,
  UserProfile,
  VehicleChecklistItem,
  DocumentAttachment,
} from '../types';
import { INITIAL_CHECKLIST_ITEMS, SHIFT_OPTIONS } from '../data/defaultChecklist';
import { PhotoUploadGrid } from './PhotoUploadGrid';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  Send,
  Calendar,
  User,
  Clock,
  Gauge,
  CheckCheck,
  FileCheck,
  Trash2,
} from 'lucide-react';

interface InspectionFormProps {
  currentUser: UserProfile;
  vehicles: AmbulanceVehicle[];
  onSubmitInspection: (record: InspectionRecord) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  staffList?: UserProfile[];
}

export const InspectionForm: React.FC<InspectionFormProps> = ({
  currentUser,
  vehicles,
  onSubmitInspection,
  onCancel,
  isSubmitting = false,
  staffList = [],
}) => {
  const [activeInspector, setActiveInspector] = useState<UserProfile>(currentUser);
  // Selected Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ''
  );

  // Auto-calculated timestamps
  const [nowDate] = useState(() => new Date());
  const formattedUploadTimestamp = `${nowDate.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })} ${nowDate.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })} น.`;

  // Shift & Odometer
  const [selectedShift, setSelectedShift] = useState<ShiftType>('24hr');
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const [odometer, setOdometer] = useState<number>(
    selectedVehicle?.currentOdometer || 0
  );

  // 4-side photos
  const [photos, setPhotos] = useState<FourSidePhotos>({
    front: '',
    rear: '',
    left: '',
    right: '',
  });

  // Checklist items
  const [checklist, setChecklist] = useState<VehicleChecklistItem[]>(() =>
    INITIAL_CHECKLIST_ITEMS.map((item) => ({
      ...item,
      status: 'pass',
      issueNotes: '',
    }))
  );

  // Signed Document attachment
  const [documentAttachment, setDocumentAttachment] = useState<DocumentAttachment | undefined>(undefined);

  // Summary notes
  const [summaryNotes, setSummaryNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pass All Handler
  const handlePassAll = () => {
    setChecklist((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'pass',
      }))
    );
  };

  // Update item status
  const handleStatusChange = (itemId: string, status: ItemStatus) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  // Update item note
  const handleNoteChange = (itemId: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, issueNotes: notes } : item))
    );
  };

  // Document Upload Handler (PDF or Image)
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setValidationError('กรุณาเลือกไฟล์เอกสาร PDF หรือรูปภาพ (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setDocumentAttachment({
          name: file.name,
          type: isPdf ? 'pdf' : 'image',
          dataUrl: reader.result,
          size: `${sizeMb} MB`,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedVehicle) {
      setValidationError('กรุณาเลือกรถกู้ชีพ BLS ที่ต้องการตรวจ');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check photos
    const missingPhotos: string[] = [];
    if (!photos.front) missingPhotos.push('ด้านหน้า');
    if (!photos.rear) missingPhotos.push('ด้านหลัง');
    if (!photos.left) missingPhotos.push('ด้านซ้าย');
    if (!photos.right) missingPhotos.push('ด้านขวา');

    if (missingPhotos.length > 0) {
      setValidationError(`กรุณาถ่ายภาพตัวรถให้ครบทั้ง 4 ด้าน (ขาด: ${missingPhotos.join(', ')})`);
      return;
    }

    // Determine overall status
    const hasFail = checklist.some((item) => item.status === 'fail');
    const hasWarning = checklist.some((item) => item.status === 'warning');
    const overallStatus: InspectionRecord['overallStatus'] = hasFail
      ? 'needs_repair'
      : hasWarning
      ? 'issue_found'
      : 'normal';

    const shiftOption = SHIFT_OPTIONS.find((s) => s.value === selectedShift);

    const record: InspectionRecord = {
      id: `insp-${Date.now()}`,
      vehicleId: selectedVehicle.id,
      vehicleCode: selectedVehicle.code,
      plateNumber: selectedVehicle.plateNumber,
      inspectorName: activeInspector.name,
      inspectorRole: activeInspector.role,
      uploadTimestamp: formattedUploadTimestamp,
      shift: selectedShift,
      shiftLabel: shiftOption ? shiftOption.label : 'เวร 24 ชั่วโมง',
      odometerReading: Number(odometer) || selectedVehicle.currentOdometer,
      photos,
      vehicleChecklist: checklist,
      documentAttachment,
      overallStatus,
      summaryNotes: summaryNotes.trim(),
      googleSheetsSyncStatus: 'pending',
      createdAt: Date.now(),
    };

    await onSubmitInspection(record);
  };

  // Group checklist by category
  const categories = Array.from(new Set(checklist.map((item) => item.categoryId))).map((catId) => {
    const items = checklist.filter((item) => item.categoryId === catId);
    return {
      id: catId,
      title: items[0]?.categoryTitle || `หมวดที่ ${catId}`,
      items,
    };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Banner / Header Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              แบบฟอร์มบันทึกการตรวจสภาพรถกู้ชีพ (BLS Inspection)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              ระบบตรวจเช็คความพร้อมรถกู้ชีพ BLS ส่วนกลาง ก่อนออกปฏิบัติการฉุกเฉิน
            </p>
          </div>

          <button
            type="button"
            onClick={handlePassAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCheck className="h-4 w-4" />
            ทำเครื่องหมาย &quot;พร้อมใช้งานทั้งหมด&quot; (Pass All)
          </button>
        </div>

        {/* Section 1: ข้อมูลเวรและเวลา + ข้อมูลรถ */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Uploader Name */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-sky-500" />
                <span>ผู้ตรวจเช็ค (Uploader Name)</span>
              </div>
            </div>
            {staffList.length > 0 ? (
              <select
                value={activeInspector.id}
                onChange={(e) => {
                  const found = staffList.find((s) => s.id === e.target.value);
                  if (found) setActiveInspector(found);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-xs text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId})
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {activeInspector.name}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              ตำแหน่ง: {activeInspector.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่เวร (Staff)'} · รหัส: {activeInspector.employeeId}
            </p>
          </div>

          {/* Upload Timestamp */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-sky-500" />
              <span>เวลาที่ตรวจ (Upload Timestamp)</span>
            </div>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
              {formattedUploadTimestamp}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ● บันทึกเวลาแบบอัตโนมัติ Real-Time
            </p>
          </div>

          {/* Shift Selection */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-sky-500" />
              <span>รอบเวรการทำงาน (Shift)</span>
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              รองรับเวร 24 ชม. (08:00 - 08:00 น.)
            </p>
          </div>

          {/* Odometer */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-800/40">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-sky-500" />
              <span>เลขไมล์ขณะตรวจ (กิโลเมตร)</span>
            </label>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(Number(e.target.value))}
              placeholder="เช่น 42150"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-sm tabular-nums text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              ไมล์เดิม: {selectedVehicle?.currentOdometer.toLocaleString() || 0} กม.
            </p>
          </div>
        </div>

        {/* Vehicle Selector Carousel/Cards */}
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            เลือกรถกู้ชีพ BLS ที่ต้องการตรวจสภาพ:
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((veh) => {
              const isSelected = veh.id === selectedVehicleId;
              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    setSelectedVehicleId(veh.id);
                    setOdometer(veh.currentOdometer);
                  }}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm dark:border-sky-400 dark:bg-sky-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                      {veh.code}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        veh.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : veh.status === 'issue_found'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {veh.status === 'available'
                        ? 'พร้อมใช้งาน'
                        : veh.status === 'issue_found'
                        ? 'พบปัญหา'
                        : 'อยู่ระหว่างซ่อม'}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {veh.plateNumber}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {veh.brandModel}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: รูปถ่าย 4 ด้าน */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PhotoUploadGrid
          photos={photos}
          onChange={setPhotos}
          vehiclePlate={selectedVehicle?.plateNumber || ''}
          shiftLabel={SHIFT_OPTIONS.find((s) => s.value === selectedShift)?.label || ''}
        />
      </div>

      {/* Section 3: รายการตรวจสอบตัวรถ 7 หมวด 19 รายการ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              รายการตรวจสอบสภาพรถยนต์ (7 หมวด 19 รายการ)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ตรวจสอบตามเกณฑ์มาตรฐานความปลอดภัย และระบุปัญหาที่พบหากไม่พร้อมใช้งาน
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> พร้อมใช้งาน
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> เฝ้าระวัง
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> ไม่พร้อม/ชำรุด
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((cat, catIndex) => (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2.5 dark:bg-slate-800/80">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  หมวด {catIndex + 1}: {cat.title}
                </h5>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {cat.items.length} รายการ
                </span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-1 items-center gap-3 p-3.5 transition-colors sm:grid-cols-12 ${
                      item.status === 'fail'
                        ? 'bg-red-50/50 dark:bg-red-950/20'
                        : item.status === 'warning'
                        ? 'bg-amber-50/40 dark:bg-amber-950/15'
                        : 'bg-white hover:bg-slate-50/50 dark:bg-slate-900 dark:hover:bg-slate-850'
                    }`}
                  >
                    {/* Item Title & Standard */}
                    <div className="sm:col-span-5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {catIndex + 1}.{itemIdx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {item.subTitle}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            มาตรฐาน: <span className="font-medium text-slate-700 dark:text-slate-300">{item.standard}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-1.5 sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'pass')}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                          item.status === 'pass'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>พร้อม</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'warning')}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                          item.status === 'warning'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>เฝ้าระวัง</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'fail')}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                          item.status === 'fail'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>ชำรุด</span>
                      </button>
                    </div>

                    {/* Notes / Issues Input */}
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={item.issueNotes}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder={
                          item.status === 'pass'
                            ? 'หมายเหตุเพิ่มเติม (ถ้ามี)'
                            : 'ระบุปัญหาที่พบหรือจุดที่ชำรุด...'
                        }
                        className={`w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none ${
                          item.status === 'fail'
                            ? 'border-red-300 bg-red-50/50 text-red-900 focus:border-red-500 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                            : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: อัปโหลดเอกสารการตรวจเช็คสภาพ */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            เอกสารการตรวจเช็คสภาพ (Inspection Document / Sign-off Sheet)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            รองรับไฟล์ PDF หรือรูปภาพเอกสารที่มีลายเซ็นของผู้ตรวจ (ขนาดไม่เกิน 10MB)
          </p>
        </div>

        {documentAttachment ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {documentAttachment.name}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  ประเภท: {documentAttachment.type.toUpperCase()} · ขนาด: {documentAttachment.size}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const win = window.open();
                  if (win) {
                    win.document.write(
                      `<iframe src="${documentAttachment.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                    );
                  }
                }}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-200"
              >
                ดูตัวอย่าง
              </button>
              <button
                type="button"
                onClick={() => setDocumentAttachment(undefined)}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                title="ลบเอกสาร"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
            <Upload className="mb-2 h-7 w-7 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              คลิกเพื่อเลือกไฟล์เอกสาร PDF หรือรูปภาพเอกสารที่มีลายเซ็น
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              PDF, JPG, PNG ขนาดไฟล์สูงสุด 10MB
            </p>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleDocumentUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Summary Notes */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            สรุปผลการตรวจหรือหมายเหตุภาพรวมสำหรับรอบเวรนี้:
          </label>
          <textarea
            rows={2}
            value={summaryNotes}
            onChange={(e) => setSummaryNotes(e.target.value)}
            placeholder="เช่น รถพร้อมปฏิบัติการเต็มระบบ หรือ รอเปลี่ยนหลอดไฟช่วงบ่าย..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ยกเลิก
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>กำลังบันทึกและส่งข้อมูล...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>บันทึกและส่งข้อมูล</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
