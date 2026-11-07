import React, { useState } from 'react';
import { GoogleSheetsConfig, InspectionRecord } from '../types';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { createInspectionSpreadsheet, appendInspectionToSheet } from '../services/googleSheets';
import { uploadInspectionMediaToDrive } from '../services/googleDrive';
import { googleSignIn, getAccessToken } from '../services/firebaseAuth';
import { User } from 'firebase/auth';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  inspections: InspectionRecord[];
  onUpdateInspection: (record: InspectionRecord) => void;
  googleUser: User | null;
  onGoogleLoginSuccess: (user: User) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  inspections,
  onUpdateInspection,
  googleUser,
  onGoogleLoginSuccess,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onGoogleLoginSuccess(res.user);
        setStatusMessage({
          type: 'success',
          text: `เชื่อมต่อกับบัญชี Google: ${res.user.email} สำเร็จ!`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'ไม่สามารถเข้าสู่ระบบ Google ได้',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreating(true);
    setStatusMessage(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          onGoogleLoginSuccess(res.user);
        }
      }

      if (!token) {
        throw new Error('กรุณาลงชื่อเข้าใช้ Google เพื่อสร้างสเปรดชีต');
      }

      const res = await createInspectionSpreadsheet(
        token,
        'ระบบตรวจสภาพรถกู้ชีพ BLS - กองยานพาหนะส่วนกลาง'
      );

      const newConfig: GoogleSheetsConfig = {
        ...config,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        sheetName: 'บันทึกการตรวจรถกู้ชีพ_BLS',
        lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
      };

      setSpreadsheetId(res.spreadsheetId);
      onSaveConfig(newConfig);

      setStatusMessage({
        type: 'success',
        text: 'สร้าง Google Spreadsheet ใหม่และเตรียมหัวตารางสำเร็จเรียบร้อยแล้ว!',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการสร้างสเปรดชีต',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSyncAllPending = async () => {
    if (!spreadsheetId) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุหรือสร้าง Google Spreadsheet ID ก่อน',
      });
      return;
    }

    setIsSyncingAll(true);
    setStatusMessage(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          onGoogleLoginSuccess(res.user);
        }
      }

      if (!token) {
        throw new Error('กรุณาลงชื่อเข้าใช้ Google เพื่อซิงค์ข้อมูล');
      }

      let count = 0;
      let driveUploadedCount = 0;
      for (const rec of inspections) {
        if (rec.googleSheetsSyncStatus !== 'synced') {
          let updatedRec = { ...rec };

          // Upload media to Google Drive if not uploaded yet
          if (!updatedRec.driveLinks?.folderUrl) {
            try {
              const driveLinks = await uploadInspectionMediaToDrive(token, updatedRec);
              updatedRec.driveLinks = driveLinks;
              driveUploadedCount++;
            } catch (dErr) {
              console.warn('Google Drive upload error for record:', updatedRec.id, dErr);
            }
          }

          await appendInspectionToSheet(spreadsheetId, updatedRec, token);
          updatedRec.googleSheetsSyncStatus = 'synced';
          onUpdateInspection(updatedRec);
          count++;
        }
      }

      onSaveConfig({
        ...config,
        spreadsheetId,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH'),
      });

      setStatusMessage({
        type: 'success',
        text: `ซิงค์ข้อมูลสำเร็จจำนวน ${count} รายการ (อัปโหลดรูปและเอกสารลง Google Drive ${driveUploadedCount} รายการ)`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSaveCustomId = () => {
    if (!spreadsheetId) return;
    const cleanId = spreadsheetId.includes('/d/')
      ? spreadsheetId.split('/d/')[1].split('/')[0]
      : spreadsheetId.trim();

    onSaveConfig({
      ...config,
      spreadsheetId: cleanId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
    });

    setStatusMessage({
      type: 'success',
      text: 'บันทึก Spreadsheet ID เรียบร้อยแล้ว',
    });
  };

  const currentSheetUrl =
    config.spreadsheetUrl ||
    (config.spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`
      : null);

  const pendingCount = inspections.filter((i) => i.googleSheetsSyncStatus !== 'synced').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              การเชื่อมต่อ Google Sheets (Auto-Sync)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Google Account Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  บัญชี Google สำหรับบันทึก Sheets:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {googleUser ? googleUser.email : 'ยังไม่ได้เชื่อมต่อบัญชี Google'}
                </p>
              </div>

              {!googleUser ? (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <LogIn className="h-3.5 w-3.5 text-sky-600" />
                  {isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'ลงชื่อเข้าใช้ Google'}
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> เชื่อมต่อแล้ว
                </span>
              )}
            </div>
          </div>

          {/* Current Sheet Connection */}
          {currentSheetUrl ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> เชื่อมต่อกับ Spreadsheet แล้ว
                  </span>
                  <p className="mt-1 line-clamp-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    ID: {config.spreadsheetId}
                  </p>
                </div>
                <a
                  href={currentSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> เปิดดูใน Sheets
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
              <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                ยังไม่มีการเชื่อมต่อกับ Google Spreadsheet
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                คุณสามารถสร้างสเปรดชีตใหม่ได้ด้วยคลิกเดียว หรือนำ ID ของชีตเดิมมาใส่
              </p>
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isCreating}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                {isCreating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>สร้าง Google Sheets อัตโนมัติทันที</span>
              </button>
            </div>
          )}

          {/* Manual ID Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              หรือระบุ Google Spreadsheet ID ด้วยตนเอง:
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleSaveCustomId}
                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                บันทึก ID
              </button>
            </div>
          </div>

          {/* Sync All Button */}
          <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  ข้อมูลที่รอการซิงค์: {pendingCount} รายการ
                </p>
                <p className="text-[11px] text-slate-400">
                  ซิงค์ทั้งหมด {inspections.length} รายการไปยัง Google Sheets
                </p>
              </div>

              <button
                type="button"
                disabled={isSyncingAll || !spreadsheetId}
                onClick={handleSyncAllPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลทั้งหมด'}</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
