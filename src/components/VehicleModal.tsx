import React, { useState, useEffect } from 'react';
import { AmbulanceVehicle, VehicleStatus } from '../types';
import { X, Truck, Check } from 'lucide-react';
import { generateSvgCarPlaceholder } from '../services/storage';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: AmbulanceVehicle) => void;
  vehicleToEdit?: AmbulanceVehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleToEdit,
}) => {
  const [code, setCode] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [year, setYear] = useState('2024');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (vehicleToEdit) {
      setCode(vehicleToEdit.code);
      setPlateNumber(vehicleToEdit.plateNumber);
      setBrandModel(vehicleToEdit.brandModel);
      setYear(vehicleToEdit.year);
      setStatus(vehicleToEdit.status);
      setCurrentOdometer(vehicleToEdit.currentOdometer);
      setNotes(vehicleToEdit.notes || '');
    } else {
      setCode('');
      setPlateNumber('');
      setBrandModel('');
      setYear('2024');
      setStatus('available');
      setCurrentOdometer(0);
      setNotes('');
    }
  }, [vehicleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !plateNumber.trim()) {
      setError('กรุณากรอกรหัสรถและเลขทะเบียนให้ครบถ้วน');
      return;
    }

    const color =
      status === 'available' ? '#2563eb' : status === 'issue_found' ? '#eab308' : '#ef4444';

    const vehicle: AmbulanceVehicle = {
      id: vehicleToEdit ? vehicleToEdit.id : `veh-${Date.now()}`,
      code: code.trim(),
      plateNumber: plateNumber.trim(),
      brandModel: brandModel.trim() || 'Toyota Commuter BLS Ambulance',
      year: year.trim() || '2024',
      status,
      currentOdometer: Number(currentOdometer) || 0,
      imageUrl: vehicleToEdit?.imageUrl || generateSvgCarPlaceholder(code.trim(), 'รถกู้ชีพ BLS', color),
      lastInspectionDate: vehicleToEdit?.lastInspectionDate || '-',
      lastInspector: vehicleToEdit?.lastInspector || '-',
      notes: notes.trim(),
    };

    onSave(vehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {vehicleToEdit ? 'แก้ไขข้อมูลรถกู้ชีพ BLS' : 'เพิ่มรถกู้ชีพ BLS คันใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                รหัสรถ (Vehicle Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น BLS-05"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                เลขทะเบียน (Plate Number) *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="เช่น 1กข 9988 กรุงเทพฯ"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ยี่ห้อและรุ่นรถ
              </label>
              <input
                type="text"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                placeholder="เช่น Toyota Commuter 3.0 High-Roof"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ปีที่จดทะเบียน
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                สถานะความพร้อม
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="available">พร้อมใช้งาน (ปกติ)</option>
                <option value="issue_found">พบปัญหา (เฝ้าระวัง)</option>
                <option value="maintenance">อยู่ระหว่างซ่อม (งดใช้)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                เลขไมล์ปัจจุบัน (กม.)
              </label>
              <input
                type="number"
                value={currentOdometer}
                onChange={(e) => setCurrentOdometer(Number(e.target.value))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs tabular-nums text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              หมายเหตุ / ข้อมูลจำเพาะ
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุรายละเอียดอุปกรณ์ประจำรถ..."
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

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
              <Check className="h-4 w-4" /> บันทึกข้อมูลรถ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
