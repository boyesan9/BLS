import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Shield, Lock, Key, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const ADMIN_SECURITY_PASSCODE = 'b0a0e454b3';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onGoogleLogin: () => Promise<void>;
  isGoogleLoading?: boolean;
  googleUser: User | null;
  targetUserName?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoogleLogin,
  isGoogleLoading = false,
  googleUser,
  targetUserName,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!passcode.trim()) {
      setErrorMessage('กรุณากรอกรหัสความปลอดภัยสำหรับผู้ดูแลระบบ');
      return;
    }

    if (passcode.trim() === ADMIN_SECURITY_PASSCODE) {
      setPasscode('');
      setErrorMessage(null);
      onSuccess();
    } else {
      setErrorMessage('รหัสความปลอดภัยไม่ถูกต้อง กรุณาตรวจสอบหรือเข้าสู่ระบบด้วย Gmail');
    }
  };

  const handleGoogleSuccess = async () => {
    try {
      setErrorMessage(null);
      if (googleUser) {
        onSuccess();
        return;
      }
      await onGoogleLogin();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-sky-950 p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 ring-1 ring-sky-400/40">
            <Lock className="h-7 w-7 text-sky-400" />
          </div>

          <h3 className="text-base font-bold tracking-tight">
            ยืนยันความปลอดภัยสำหรับผู้ดูแลระบบ
          </h3>
          <p className="mt-1 text-xs text-sky-200">
            {targetUserName
              ? `กำลังเข้าใช้งานสิทธิ์ Admin: ${targetUserName}`
              : 'ต้องเข้าสู่ระบบด้วย Gmail หรือระบุรหัสความปลอดภัยเพื่อใช้งาน'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option 1: Gmail (Google Account) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                1
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                เข้าสู่ระบบด้วยบัญชี Gmail (แนะนำ)
              </h4>
            </div>

            {googleUser ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">เข้าสู่ระบบแล้ว: {googleUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSuccess}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
                >
                  <Shield className="h-4 w-4" />
                  <span>เข้าใช้งานในฐานะ Admin ทันที</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSuccess}
                disabled={isGoogleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'กำลังเชื่อมต่อ Google...' : 'ลงชื่อเข้าใช้ด้วย Gmail'}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 dark:bg-slate-900">
              หรือใส่รหัสผ่านความปลอดภัย
            </span>
          </div>

          {/* Option 2: Security Passcode */}
          <form onSubmit={handlePasscodeSubmit} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <Key className="h-3.5 w-3.5 text-sky-500" />
                  <span>รหัสผ่านความปลอดภัย (Security Passcode)</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="ระบุรหัสความปลอดภัยผู้ดูแลระบบ"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 transition-all"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>ยืนยันสิทธิ์ผู้ดูแลระบบ</span>
            </button>
          </form>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 pt-1"
          >
            ยกเลิก (กลับไปยังพนักงานทั่วไป)
          </button>
        </div>
      </div>
    </div>
  );
};
