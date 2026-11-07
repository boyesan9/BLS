import React, { useState } from 'react';
import { InspectionRecord } from '../types';
import {
  X,
  Printer,
  Calendar,
  User,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Eye,
  ExternalLink,
  Trash2,
  FolderSync,
} from 'lucide-react';
import { PrintReportView } from './PrintReportView';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface InspectionDetailModalProps {
  record: InspectionRecord | null;
  onClose: () => void;
  onSyncGSheets?: (record: InspectionRecord) => Promise<void>;
  isSyncing?: boolean;
  isAdmin?: boolean;
  onDeleteRecord?: (recordId: string) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  record,
  onClose,
  onSyncGSheets,
  isSyncing = false,
  isAdmin = false,
  onDeleteRecord,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ title: string; url: string } | null>(null);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!record) return null;

  const getStatusBadge = (status: InspectionRecord['overallStatus']) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> พร้อมปฏิบัติการ (ปกติ)
          </span>
        );
      case 'issue_found':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> พบข้อบกพร่อง (เฝ้าระวัง)
          </span>
        );
      case 'needs_repair':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
            <XCircle className="h-3.5 w-3.5" /> งดใช้งาน (ส่งซ่อมบำรุง)
          </span>
        );
    }
  };

  // Group items by category
  const categories = Array.from(new Set(record.vehicleChecklist.map((i) => i.categoryId))).map((catId) => {
    const items = record.vehicleChecklist.filter((i) => i.categoryId === catId);
    return {
      id: catId,
      title: items[0]?.categoryTitle || `หมวดที่ ${catId}`,
      items,
    };
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
        <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-sky-600 dark:text-sky-400">
                  {record.vehicleCode}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ทะเบียน {record.plateNumber}
                </h3>
                {getStatusBadge(record.overallStatus)}
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                รหัสบันทึก: {record.id} · ตรวจเมื่อ {record.uploadTimestamp}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintReport(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
              >
                <Printer className="h-3.5 w-3.5" /> พิมพ์รายงาน
              </button>

              {isAdmin && onDeleteRecord && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  title="ลบประวัติการตรวจ (เฉพาะ Admin)"
                >
                  <Trash2 className="h-3.5 w-3.5" /> ลบประวัติ
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
            {/* Metadata Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <User className="h-3 w-3 text-sky-500" /> ผู้ตรวจเช็ค
                </span>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  {record.inspectorName}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  ระดับสิทธิ์: {record.inspectorRole === 'admin' ? 'Admin' : 'พนักงานทั่วไป'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3 w-3 text-sky-500" /> รอบเวร
                </span>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  {record.shiftLabel}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <Gauge className="h-3 w-3 text-sky-500" /> เลขไมล์ตรวจ
                </span>
                <p className="mt-1 font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                  {record.odometerReading ? record.odometerReading.toLocaleString() : '-'} กม.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <FileText className="h-3 w-3 text-sky-500" /> Google Sheets / Drive
                </span>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      record.googleSheetsSyncStatus === 'synced'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {record.googleSheetsSyncStatus === 'synced' ? 'ซิงค์แล้ว' : 'รอซิงค์'}
                  </span>
                  {onSyncGSheets && record.googleSheetsSyncStatus !== 'synced' && (
                    <button
                      onClick={() => onSyncGSheets(record)}
                      disabled={isSyncing}
                      className="text-[10px] font-semibold text-sky-600 hover:underline dark:text-sky-400"
                    >
                      {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ตอนนี้'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Google Drive Links Bar (If uploaded) */}
            {record.driveLinks?.folderUrl && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 dark:border-sky-900/50 dark:bg-sky-950/30">
                <div className="flex items-center gap-2">
                  <FolderSync className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <div>
                    <h5 className="text-xs font-bold text-sky-950 dark:text-sky-200">
                      บันทึกรูปและเอกสารใน Google Drive แล้ว
                    </h5>
                    <p className="text-[11px] text-sky-700 dark:text-sky-400">
                      ไฟล์ภาพ 4 ด้านและเอกสารถูกจัดเก็บในโฟลเดอร์คลาวด์อย่างปลอดภัย
                    </p>
                  </div>
                </div>

                <a
                  href={record.driveLinks.folderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>เปิดโฟลเดอร์ใน Google Drive</span>
                </a>
              </div>
            )}

            {/* 4-Side Photos Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  รูปถ่ายสภาพรถ 4 ด้าน (Timestamp Watermarked)
                </h4>
                {record.driveLinks?.folderUrl && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ ซิงค์ลง Google Drive เรียบร้อย
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'ด้านหน้า (Front)', url: record.photos.front, driveUrl: record.driveLinks?.frontPhotoUrl },
                  { label: 'ด้านหลัง (Rear)', url: record.photos.rear, driveUrl: record.driveLinks?.rearPhotoUrl },
                  { label: 'ด้านซ้าย (Left)', url: record.photos.left, driveUrl: record.driveLinks?.leftPhotoUrl },
                  { label: 'ด้านขวา (Right)', url: record.photos.right, driveUrl: record.driveLinks?.rightPhotoUrl },
                ].map((p, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                  >
                    {p.url ? (
                      <>
                        <img
                          src={p.url}
                          alt={p.label}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setSelectedImage({ title: p.label, url: p.url })}
                            className="rounded-lg bg-white/90 p-2 text-slate-900 hover:bg-white shadow"
                            title="ดูภาพขยาย"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.driveUrl && (
                            <a
                              href={p.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-sky-600/90 p-2 text-white hover:bg-sky-500 shadow"
                              title="เปิดดูใน Google Drive"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        ไม่มีภาพ
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {p.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Table (7 Categories, 19 items) */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                ผลการตรวจเช็คสภาพตัวรถ (7 หมวด 19 รายการ)
              </h4>
              <div className="space-y-4">
                {categories.map((cat, cIdx) => (
                  <div
                    key={cat.id}
                    className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      หมวด {cIdx + 1}: {cat.title}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cat.items.map((item, iIdx) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">
                              {cIdx + 1}.{iIdx + 1}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {item.subTitle}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              (เกณฑ์: {item.standard})
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {item.status === 'pass' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> พร้อมใช้งาน
                              </span>
                            )}
                            {item.status === 'warning' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5" /> เฝ้าระวัง
                              </span>
                            )}
                            {item.status === 'fail' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                <XCircle className="h-3.5 w-3.5" /> ไม่พร้อม/ชำรุด
                              </span>
                            )}

                            {item.issueNotes && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                หมายเหตุ: {item.issueNotes}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Document */}
            {record.documentAttachment && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  เอกสารการตรวจเช็คสภาพแนบ
                </h4>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-5 w-5 text-sky-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {record.documentAttachment.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ประเภท: {record.documentAttachment.type.toUpperCase()} · ขนาด:{' '}
                        {record.documentAttachment.size || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.driveLinks?.documentUrl && (
                      <a
                        href={record.driveLinks.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> ดูใน Google Drive
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<iframe src="${record.documentAttachment?.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Eye className="h-3.5 w-3.5" /> เปิดดูตัวอย่าง
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Summary Notes */}
            {record.summaryNotes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  หมายเหตุสรุปภาพรวมจากผู้ตรวจ:
                </span>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {record.summaryNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Image Preview */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="relative max-h-[90vh] max-w-4xl">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-10 right-0 text-white"
              >
                ✕ ปิด
              </button>
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[85vh] rounded-lg object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {showPrintReport && (
        <PrintReportView record={record} onClose={() => setShowPrintReport(false)} />
      )}

      {/* Delete Record Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            if (onDeleteRecord) {
              onDeleteRecord(record.id);
              onClose();
            }
          }}
          title="ยืนยันการลบประวัติการตรวจสภาพรถ"
          message="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการตรวจสภาพรอบนี้ออกจากระบบ? (สิทธิ์เฉพาะผู้ดูแลระบบ Admin เท่านั้น)"
          itemName={`รถ ${record.vehicleCode} (${record.plateNumber}) · ตรวจเมื่อ ${record.uploadTimestamp}`}
        />
      )}
    </>
  );
};
