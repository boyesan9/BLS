import React, { useState } from 'react';
import { Camera, Upload, Trash2, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { FourSidePhotos } from '../types';
import { CameraModal } from './CameraModal';

interface PhotoUploadGridProps {
  photos: FourSidePhotos;
  onChange: (photos: FourSidePhotos) => void;
  vehiclePlate: string;
  shiftLabel: string;
}

interface PhotoSlotConfig {
  key: keyof FourSidePhotos;
  title: string;
  subtitle: string;
  instruction: string;
}

const PHOTO_SLOTS: PhotoSlotConfig[] = [
  {
    key: 'front',
    title: 'ด้านหน้า (Front)',
    subtitle: 'ตรวจไฟหน้า, ไฟตัดหมอก, กระจกหน้า, ทะเบียน',
    instruction: 'ถ่ายให้เห็นเต็มส่วนหน้ารถ และป้ายทะเบียนชัดเจน',
  },
  {
    key: 'rear',
    title: 'ด้านหลัง (Rear)',
    subtitle: 'ตรวจไฟท้าย, ไฟเบรก, ไฟถอย, สัญญาณหลังคา',
    instruction: 'ถ่ายตรงจากด้านหลัง ให้เห็นไฟสัญญาณและประตูกู้ชีพ',
  },
  {
    key: 'left',
    title: 'ด้านซ้าย (Left Side)',
    subtitle: 'ตรวจไฟเลี้ยวข้าง, สัญญาณฉุกเฉิน, ยางซ้าย',
    instruction: 'ถ่ายข้างรถฝั่งคนขับ/ผู้โดยสาร เต็มคัน',
  },
  {
    key: 'right',
    title: 'ด้านขวา (Right Side)',
    subtitle: 'ตรวจไฟข้าง, ไฟส่องสว่าง, ตัวถัง, ยางขวา',
    instruction: 'ถ่ายข้างรถฝั่งประตูเปิด-ปิดผู้ป่วย เต็มคัน',
  },
];

export const PhotoUploadGrid: React.FC<PhotoUploadGridProps> = ({
  photos,
  onChange,
  vehiclePlate,
  shiftLabel,
}) => {
  const [activeCameraSlot, setActiveCameraSlot] = useState<keyof FourSidePhotos | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<{ title: string; url: string } | null>(null);

  const handleFileSelect = (slotKey: keyof FourSidePhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({
          ...photos,
          [slotKey]: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleCameraCapture = (dataUrl: string) => {
    if (activeCameraSlot) {
      onChange({
        ...photos,
        [activeCameraSlot]: dataUrl,
      });
      setActiveCameraSlot(null);
    }
  };

  const handleRemovePhoto = (slotKey: keyof FourSidePhotos) => {
    onChange({
      ...photos,
      [slotKey]: '',
    });
  };

  const totalFilled = Object.values(photos).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            อัปโหลดรูปถ่ายสภาพรถ 4 ด้าน
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            แนะนำเปิดกล้องสดเพื่อความแม่นยำของเวลาจริง หรือเลือกอัปโหลดไฟล์ภาพความละเอียดสูง
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {totalFilled === 4 ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> ถ่ายครบ 4 ด้านแล้ว (4/4)
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" /> อัปโหลดแล้ว {totalFilled}/4 ด้าน
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PHOTO_SLOTS.map((slot) => {
          const hasPhoto = Boolean(photos[slot.key]);

          return (
            <div
              key={slot.key}
              className={`group relative flex flex-col rounded-xl border transition-all ${
                hasPhoto
                  ? 'border-sky-500/40 bg-white shadow-sm dark:border-sky-500/30 dark:bg-slate-900'
                  : 'border-dashed border-slate-300 bg-slate-50/70 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/40'
              }`}
            >
              {/* Photo Preview Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-slate-950/5 dark:bg-slate-950/40">
                {hasPhoto ? (
                  <>
                    <img
                      src={photos[slot.key]}
                      alt={slot.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomImage({ title: slot.title, url: photos[slot.key] })}
                        className="rounded-lg bg-slate-900/80 p-2 text-white hover:bg-slate-900 shadow-md backdrop-blur-sm"
                        title="ดูภาพขยาย"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(slot.key)}
                        className="rounded-lg bg-red-600/90 p-2 text-white hover:bg-red-600 shadow-md backdrop-blur-sm"
                        title="ลบภาพ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Camera className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      ยังไม่มีรูปภาพ
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                      {slot.instruction}
                    </p>
                  </div>
                )}

                {/* Status Indicator Badge */}
                <div className="absolute left-2.5 top-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium backdrop-blur-md ${
                      hasPhoto
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-900/60 text-slate-200'
                    }`}
                  >
                    {hasPhoto ? <CheckCircle2 className="h-3 w-3" /> : null}
                    {slot.title}
                  </span>
                </div>
              </div>

              {/* Slot Details and Buttons */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                  {slot.subtitle}
                </p>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCameraSlot(slot.key)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-sky-600/30 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>เปิดกล้อง</span>
                  </button>

                  <label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Upload className="h-3.5 w-3.5" />
                    <span>เลือกไฟล์</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(slot.key, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Camera Modal */}
      {activeCameraSlot && (
        <CameraModal
          isOpen={Boolean(activeCameraSlot)}
          onClose={() => setActiveCameraSlot(null)}
          onCapture={handleCameraCapture}
          title={PHOTO_SLOTS.find((s) => s.key === activeCameraSlot)?.title || 'ถ่ายภาพรถ'}
          vehiclePlate={vehiclePlate}
          shiftLabel={shiftLabel}
        />
      )}

      {/* Zoom Preview Modal */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h4 className="text-sm font-semibold text-white">
                ภาพขยาย: {previewZoomImage.title}
              </h4>
              <button
                onClick={() => setPreviewZoomImage(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-2">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.title}
                className="mx-auto max-h-[70vh] rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
