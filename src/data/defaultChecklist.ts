import { VehicleChecklistItem } from '../types';

export const INITIAL_CHECKLIST_ITEMS: Omit<VehicleChecklistItem, 'status' | 'issueNotes'>[] = [
  // 1 ตรวจสอบไฟตัวรถ
  {
    id: 'light-1',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟหน้า',
    standard: 'ติดส่องสว่าง',
  },
  {
    id: 'light-2',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟหลัง',
    standard: 'ติดส่องสว่าง',
  },
  {
    id: 'light-3',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟเลี้ยวหน้าขวา',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'light-4',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟเลี้ยวหน้าซ้าย',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'light-5',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟเลี้ยวหลังขวา',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'light-6',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟเลี้ยวหลังซ้าย',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'light-7',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟเบรก',
    standard: 'ติดส่องสว่าง',
  },
  {
    id: 'light-8',
    categoryId: 1,
    categoryTitle: '1. ตรวจสอบไฟตัวรถ',
    subTitle: 'ไฟตัดหมอก',
    standard: 'ติดส่องสว่าง',
  },

  // 2 ตรวจสอบสัญญาณไฟฉุกเฉิน
  {
    id: 'emerg-1',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟฉุกเฉินบนหลังคารถ',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'emerg-2',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟฉุกเฉินข้างตัวรถขวา',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'emerg-3',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟฉุกเฉินข้างตัวรถซ้าย',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'emerg-4',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟฉุกเฉินหลังรถ',
    standard: 'ติดกระพริบ',
  },
  {
    id: 'emerg-5',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟส่องสว่างข้างตัวรถด้านขวา',
    standard: 'ติดส่องสว่าง',
  },
  {
    id: 'emerg-6',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟส่องสว่างข้างตัวรถด้านซ้าย',
    standard: 'ติดส่องสว่าง',
  },
  {
    id: 'emerg-7',
    categoryId: 2,
    categoryTitle: '2. ตรวจสอบสัญญาณไฟฉุกเฉิน',
    subTitle: 'ไฟส่องสว่างด้านหลัง',
    standard: 'ติดส่องสว่าง',
  },

  // 3 ตรวจสอบกระจกมองหลัง/ข้าง
  {
    id: 'mirror-1',
    categoryId: 3,
    categoryTitle: '3. ตรวจสอบกระจกมองหลัง/ข้าง',
    subTitle: 'กระจกมองหลังและกระจกมองข้าง',
    standard: 'ใสสะอาด/ ไม่ชำรุด',
  },

  // 4 ตรวจสอบระบบของเหลว
  {
    id: 'fluid-1',
    categoryId: 4,
    categoryTitle: '4. ตรวจสอบระบบของเหลว',
    subTitle: 'น้ำมันเครื่อง',
    standard: 'ตามมาตรฐานโรงงาน',
  },
  {
    id: 'fluid-2',
    categoryId: 4,
    categoryTitle: '4. ตรวจสอบระบบของเหลว',
    subTitle: 'น้ำหม้อน้ำ',
    standard: 'ตามมาตรฐานโรงงาน',
  },
  {
    id: 'fluid-3',
    categoryId: 4,
    categoryTitle: '4. ตรวจสอบระบบของเหลว',
    subTitle: 'น้ำที่ปัดน้ำฝน',
    standard: 'ตามมาตรฐานโรงงาน',
  },

  // 5 ตรวจสอบสภาพภายนอกแบตเตอรี่
  {
    id: 'battery-1',
    categoryId: 5,
    categoryTitle: '5. ตรวจสอบสภาพภายนอกแบตเตอรี่',
    subTitle: 'สภาพภายนอกและขั้วแบตเตอรี่',
    standard: 'ไม่ชำรุด/พร้อมใช้งาน',
  },

  // 6 ทดสอบสัญญาณเสียง
  {
    id: 'sound-1',
    categoryId: 6,
    categoryTitle: '6. ทดสอบสัญญาณเสียง',
    subTitle: 'สัญญาณเสียงไซเรนฉุกเฉินและแตร',
    standard: 'ได้ยินเสียงชัดเจน',
  },

  // 7 ยางรถ
  {
    id: 'tire-1',
    categoryId: 7,
    categoryTitle: '7. ยางรถ',
    subTitle: 'ยางรถยนต์ทั้ง 4 เส้นและยางอะไหล่',
    standard: 'ตามมาตรฐาน (แรงดันลมยางและดอกยาง)',
  },
];

export function createFreshChecklist(): VehicleChecklistItem[] {
  return INITIAL_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    status: 'pass',
    issueNotes: '',
  }));
}

export const SHIFT_OPTIONS = [
  { value: '24hr', label: 'เวร 24 ชั่วโมง (08:00 น. - 08:00 น. ของอีกวัน)' },
  { value: 'morning', label: 'เวรเช้า (08:00 น. - 16:00 น.)' },
  { value: 'afternoon', label: 'เวรบ่าย (16:00 น. - 24:00 น.)' },
  { value: 'night', label: 'เวรดึก (24:00 น. - 08:00 น.)' },
] as const;
