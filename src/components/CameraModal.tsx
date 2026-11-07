import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title: string;
  vehiclePlate: string;
  shiftLabel: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title,
  vehiclePlate,
  shiftLabel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setErrorMsg(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    setIsLoadingCamera(true);
    setErrorMsg(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเปิดกล้องเว็บแคมโดยตรง');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'เบราว์เซอร์ถูกปฏิเสธการเข้าถึงกล้อง โปรดอนุญาตสิทธิ์การใช้กล้อง หรือเลือกอัปโหลดไฟล์ภาพแทน'
          : 'ไม่สามารถเปิดกล้องได้ อาจมีแอปอื่นใช้งานอยู่ หรือไม่พบอุปกรณ์กล้อง'
      );
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Overlay Watermark Banner at the bottom
    const bannerHeight = Math.max(50, Math.floor(height * 0.12));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Text details
    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const fontSize = Math.max(14, Math.floor(bannerHeight * 0.32));
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`🚑 ${title} · ทะเบียน: ${vehiclePlate || 'ไม่ระบุ'}`, 20, height - bannerHeight + fontSize + 8);

    ctx.font = `400 ${Math.max(12, fontSize - 2)}px sans-serif`;
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`⏰ ${dateStr} ${timeStr} น. · ${shiftLabel || 'เวร 24 ชม.'}`, 20, height - 14);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-sky-400" />
              <h3 className="text-base font-semibold text-white">ถ่ายภาพสด: {title}</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              ทะเบียน: {vehiclePlate || '-'} · มีระบบประทับตราวันเวลาและเวรตรวจอัตโนมัติ
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative flex aspect-video w-full items-center justify-center bg-black">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="ภาพที่บันทึก"
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`h-full w-full object-cover ${errorMsg ? 'hidden' : ''}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {isLoadingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70 text-slate-300">
                  <RefreshCw className="h-7 w-7 animate-spin text-sky-400" />
                  <span className="text-sm">กำลังเชื่อมต่อกล้อง...</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex max-w-sm flex-col items-center p-6 text-center">
                  <AlertCircle className="mb-3 h-10 w-10 text-amber-400" />
                  <p className="text-sm font-medium text-slate-200">{errorMsg}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    แนะนำให้ใช้ปุ่ม &quot;เลือกไฟล์รูปภาพ&quot; บนอุปกรณ์ของคุณแทน
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> ลองใหม่อีกครั้ง
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            {!capturedImage && !errorMsg && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                สลับกล้อง ({facingMode === 'environment' ? 'หลัง' : 'หน้า'})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  ถ่ายใหม่
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 shadow-sm"
                >
                  <Check className="h-4 w-4" /> ใช้ภาพนี้
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={Boolean(errorMsg) || isLoadingCamera}
                onClick={takeSnapshot}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                กดถ่ายภาพ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
