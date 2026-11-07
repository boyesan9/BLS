import { AmbulanceVehicle, GoogleSheetsConfig, InspectionRecord, UserProfile } from '../types';
import { createFreshChecklist } from '../data/defaultChecklist';

const VEHICLES_STORAGE_KEY = 'bls_vehicles_fleet_v1';
const INSPECTIONS_STORAGE_KEY = 'bls_inspections_history_v1';
const CURRENT_USER_KEY = 'bls_current_user_v1';
const GSHEETS_CONFIG_KEY = 'bls_gsheets_config_v1';

// Clean SVG ambulance illustration placeholder
export function generateSvgCarPlaceholder(label: string, angle: string, color = '#2563eb'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#0f172a" />
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    <rect width="600" height="400" fill="url(#grid)" />
    
    <!-- Vehicle Body -->
    <rect x="90" y="140" width="420" height="150" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="130" y="160" width="100" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    <rect x="250" y="160" width="110" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    <rect x="380" y="160" width="100" height="50" rx="8" fill="#38bdf8" opacity="0.3"/>
    
    <!-- Emergency Light Bar -->
    <rect x="230" y="120" width="140" height="20" rx="6" fill="#ef4444"/>
    <rect x="290" y="120" width="80" height="20" rx="6" fill="#3b82f6"/>
    <circle cx="260" cy="130" r="4" fill="#ffffff" opacity="0.8"/>
    <circle cx="330" cy="130" r="4" fill="#ffffff" opacity="0.8"/>
    
    <!-- Star of Life / Cross -->
    <circle cx="300" cy="225" r="28" fill="${color}" opacity="0.9"/>
    <rect x="293" y="205" width="14" height="40" fill="#ffffff" rx="2"/>
    <rect x="280" y="218" width="40" height="14" fill="#ffffff" rx="2"/>
    
    <!-- Wheels -->
    <circle cx="170" cy="290" r="34" fill="#1e293b" stroke="#475569" stroke-width="6"/>
    <circle cx="170" cy="290" r="14" fill="#94a3b8"/>
    <circle cx="430" cy="290" r="34" fill="#1e293b" stroke="#475569" stroke-width="6"/>
    <circle cx="430" cy="290" r="14" fill="#94a3b8"/>
    
    <!-- Label Banner -->
    <rect x="150" y="335" width="300" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="300" y="358" font-family="sans-serif" font-size="15" font-weight="bold" fill="#38bdf8" text-anchor="middle">
      ${label} · ${angle}
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_VEHICLES: AmbulanceVehicle[] = [
  {
    id: 'veh-01',
    code: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    brandModel: 'Toyota Commuter 3.0 D4D Ambulance High-Roof',
    year: '2023',
    status: 'available',
    currentOdometer: 42150,
    imageUrl: generateSvgCarPlaceholder('BLS-01', 'รถกู้ชีพพยาบาลระดับพื้นฐาน'),
    lastInspectionDate: '07/11/2026 08:00 น.',
    lastInspector: 'สมนึก มีพร้อม (EMT-B)',
    notes: 'พร้อมปฏิบัติการเต็มระบบ ไฟไซเรนและระบบไฟรอบคันสมบูรณ์',
  },
  {
    id: 'veh-02',
    code: 'BLS-02',
    plateNumber: '2ขค 8812 กรุงเทพมหานคร',
    brandModel: 'Toyota HiAce Premio 2.8 BLS Standard',
    year: '2024',
    status: 'available',
    currentOdometer: 28400,
    imageUrl: generateSvgCarPlaceholder('BLS-02', 'รถกู้ชีพพยาบาลระดับพื้นฐาน'),
    lastInspectionDate: '06/11/2026 08:00 น.',
    lastInspector: 'วิชัย ชัยชนะ (EMT-B)',
    notes: 'รถสภาพใหม่ ตรวจเช็กระบบส่องสว่างผ่านเกณฑ์',
  },
  {
    id: 'veh-03',
    code: 'BLS-03',
    plateNumber: '3งง 7721 กรุงเทพมหานคร',
    brandModel: 'Hyundai Staria Rescue Emergency Van',
    year: '2023',
    status: 'issue_found',
    currentOdometer: 61820,
    imageUrl: generateSvgCarPlaceholder('BLS-03', 'รถกู้ชีพพยาบาลระดับพื้นฐาน', '#eab308'),
    lastInspectionDate: '05/11/2026 20:30 น.',
    lastInspector: 'ประเสริฐ ยืนยง (พนักงานขับรถ)',
    notes: 'ไฟตัดหมอกหน้าซ้ายดับ หลอดขาด รออะไหล่เปลี่ยนช่วงบ่าย',
  },
  {
    id: 'veh-04',
    code: 'BLS-04',
    plateNumber: '1ขจ 3341 กรุงเทพมหานคร',
    brandModel: 'Nissan Urvan NV350 BLS Life Support',
    year: '2022',
    status: 'maintenance',
    currentOdometer: 89310,
    imageUrl: generateSvgCarPlaceholder('BLS-04', 'รถกู้ชีพพยาบาลระดับพื้นฐาน', '#ef4444'),
    lastInspectionDate: '04/11/2026 14:00 น.',
    lastInspector: 'สมนึก มีพร้อม (EMT-B)',
    notes: 'ส่งศูนย์ซ่อมบำรุงระยะ 90,000 กม. และเปลี่ยนถ่ายน้ำมันเครื่อง',
  },
];

// Pre-seeded inspection history for immediate rich demonstration
export const INITIAL_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'insp-20261107-001',
    vehicleId: 'veh-01',
    vehicleCode: 'BLS-01',
    plateNumber: '1กข 4589 กรุงเทพมหานคร',
    inspectorName: 'สมนึก มีพร้อม',
    inspectorRole: 'staff',
    uploadTimestamp: '07/11/2026 08:15 น.',
    shift: '24hr',
    shiftLabel: 'เวร 24 ชั่วโมง (08:00 น. - 08:00 น. ของอีกวัน)',
    odometerReading: 42150,
    photos: {
      front: generateSvgCarPlaceholder('BLS-01', 'ด้านหน้า (Front)'),
      rear: generateSvgCarPlaceholder('BLS-01', 'ด้านหลัง (Rear)'),
      left: generateSvgCarPlaceholder('BLS-01', 'ด้านซ้าย (Left Side)'),
      right: generateSvgCarPlaceholder('BLS-01', 'ด้านขวา (Right Side)'),
    },
    vehicleChecklist: createFreshChecklist(),
    documentAttachment: {
      name: 'ใบตรวจสภาพรถประจำเวร_BLS01_07112026.pdf',
      type: 'pdf',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp...',
      size: '1.2 MB',
    },
    overallStatus: 'normal',
    summaryNotes: 'ตรวจรอบเช้า 24 ชม. รถและระบบไฟฉุกเฉินสมบูรณ์ 100% พร้อมออกรับเคส',
    googleSheetsSyncStatus: 'synced',
    googleSheetsRowIndex: 2,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'insp-20261106-002',
    vehicleId: 'veh-03',
    vehicleCode: 'BLS-03',
    plateNumber: '3งง 7721 กรุงเทพมหานคร',
    inspectorName: 'ประเสริฐ ยืนยง',
    inspectorRole: 'staff',
    uploadTimestamp: '06/11/2026 16:30 น.',
    shift: 'afternoon',
    shiftLabel: 'เวรบ่าย (16:00 น. - 24:00 น.)',
    odometerReading: 61820,
    photos: {
      front: generateSvgCarPlaceholder('BLS-03', 'ด้านหน้า (Front)', '#eab308'),
      rear: generateSvgCarPlaceholder('BLS-03', 'ด้านหลัง (Rear)', '#eab308'),
      left: generateSvgCarPlaceholder('BLS-03', 'ด้านซ้าย (Left Side)', '#eab308'),
      right: generateSvgCarPlaceholder('BLS-03', 'ด้านขวา (Right Side)', '#eab308'),
    },
    vehicleChecklist: createFreshChecklist().map((item) => {
      if (item.subTitle === 'ไฟตัดหมอก') {
        return {
          ...item,
          status: 'fail',
          issueNotes: 'หลอดไฟตัดหมอกหน้าซ้ายดับ ไม่ติดส่องสว่าง',
        };
      }
      return item;
    }),
    documentAttachment: {
      name: 'รายงานข้อบกพร่อง_BLS03_ไฟตัดหมอก.jpg',
      type: 'image',
      dataUrl: generateSvgCarPlaceholder('BLS-03', 'เอกสารบันทึกแจ้งซ่อม', '#eab308'),
      size: '850 KB',
    },
    overallStatus: 'issue_found',
    summaryNotes: 'พบไฟตัดหมอกหน้าซ้ายขาด ได้แจ้งแอดมินยานพาหนะสั่งอะไหล่เรียบร้อย',
    googleSheetsSyncStatus: 'synced',
    googleSheetsRowIndex: 3,
    createdAt: Date.now() - 3600000 * 28,
  },
];

const STAFF_STORAGE_KEY = 'bls_staff_members_v1';

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'user-admin-01',
    name: 'พ.ต.ต. ธนกร มั่นคง',
    role: 'admin',
    employeeId: 'ADM-90210',
    position: 'หัวหน้างานกู้ชีพฉุกเฉิน',
    department: 'ฝ่ายปฏิบัติการกู้ชีพ BLS',
    phone: '081-998-1122',
    status: 'active',
    email: 'thanakorn.fleet@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-01',
    name: 'สมนึก มีพร้อม',
    role: 'staff',
    employeeId: 'EMT-67041',
    position: 'เจ้าหน้าที่กู้ชีพฉุกเฉิน (EMT-B)',
    department: 'เวรปฏิบัติการ BLS ผลัด 1',
    phone: '086-442-3311',
    status: 'active',
    email: 'somnuek.bls@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-02',
    name: 'วิชัย ชัยชนะ',
    role: 'staff',
    employeeId: 'EMT-67042',
    position: 'พนักงานขับรถพยาบาลฉุกเฉิน',
    department: 'เวรปฏิบัติการ BLS ผลัด 2',
    phone: '089-223-4455',
    status: 'active',
    email: 'wichai.c@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-staff-03',
    name: 'ประเสริฐ ยืนยง',
    role: 'staff',
    employeeId: 'EMT-67043',
    position: 'เจ้าหน้าที่เวชกรฉุกเฉิน',
    department: 'เวรปฏิบัติการ BLS ผลัด 3',
    phone: '084-556-7788',
    status: 'on_leave',
    email: 'prasert.y@ems-fleet.go.th',
    avatarUrl: '',
  },
  {
    id: 'user-admin-02',
    name: 'กัญญาณี รักษ์สุข',
    role: 'admin',
    employeeId: 'ADM-90211',
    position: 'ผู้ช่วยงานธุรการยานพาหนะ',
    department: 'ฝ่ายสนับสนุนการกู้ชีพ',
    phone: '082-334-9988',
    status: 'active',
    email: 'kanyanee.r@ems-fleet.go.th',
    avatarUrl: '',
  },
];

export const DEMO_USERS: Record<string, UserProfile> = {
  staff: INITIAL_STAFF[1],
  admin: INITIAL_STAFF[0],
};

export function getStoredStaff(): UserProfile[] {
  try {
    const data = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading staff from localStorage', e);
    return INITIAL_STAFF;
  }
}

export function saveStaff(staffList: UserProfile[]) {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
  } catch (e) {
    console.error('Error saving staff to localStorage', e);
  }
}

// Storage Access Functions
export function getStoredVehicles(): AmbulanceVehicle[] {
  try {
    const data = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading vehicles from localStorage', e);
    return INITIAL_VEHICLES;
  }
}

export function saveVehicles(vehicles: AmbulanceVehicle[]) {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving vehicles to localStorage', e);
  }
}

export function getStoredInspections(): InspectionRecord[] {
  try {
    const data = localStorage.getItem(INSPECTIONS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(INITIAL_INSPECTIONS));
      return INITIAL_INSPECTIONS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading inspections from localStorage', e);
    return INITIAL_INSPECTIONS;
  }
}

export function saveInspectionRecord(record: InspectionRecord): InspectionRecord[] {
  const current = getStoredInspections();
  const updated = [record, ...current];
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage full, trimming oldest records if necessary', e);
    // Keep last 30
    const trimmed = updated.slice(0, 30);
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(trimmed));
  }

  // Update vehicle's last inspection date and status
  const vehicles = getStoredVehicles();
  const targetVeh = vehicles.find((v) => v.id === record.vehicleId);
  if (targetVeh) {
    targetVeh.lastInspectionDate = record.uploadTimestamp;
    targetVeh.lastInspector = `${record.inspectorName} (${record.inspectorRole === 'admin' ? 'Admin' : 'Staff'})`;
    targetVeh.currentOdometer = record.odometerReading;
    if (record.overallStatus === 'needs_repair') {
      targetVeh.status = 'maintenance';
    } else if (record.overallStatus === 'issue_found') {
      targetVeh.status = 'issue_found';
    } else {
      targetVeh.status = 'available';
    }
    saveVehicles(vehicles);
  }

  return updated;
}

export function updateInspectionRecord(updatedRecord: InspectionRecord) {
  const list = getStoredInspections();
  const idx = list.findIndex((r) => r.id === updatedRecord.id);
  if (idx >= 0) {
    list[idx] = updatedRecord;
    try {
      localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }
}

export function deleteInspectionRecord(recordId: string): InspectionRecord[] {
  const list = getStoredInspections().filter((r) => r.id !== recordId);
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
  return list;
}

export function clearAllInspectionRecords(): InspectionRecord[] {
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function clearAllSystemData(clearVehiclesAndStaff = false) {
  try {
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify([]));
    if (clearVehiclesAndStaff) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify([]));
    }
  } catch (e) {
    console.error(e);
  }
}

export function resetToInitialDemoData() {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF));
  } catch (e) {
    console.error(e);
  }
}

export function getCurrentUser(): UserProfile {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) {
      return DEMO_USERS.staff;
    }
    return JSON.parse(data);
  } catch (e) {
    return DEMO_USERS.staff;
  }
}

export function setCurrentUser(user: UserProfile) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const data = localStorage.getItem(GSHEETS_CONFIG_KEY);
    if (!data) {
      return { autoSync: true };
    }
    return JSON.parse(data);
  } catch (e) {
    return { autoSync: true };
  }
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig) {
  try {
    localStorage.setItem(GSHEETS_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}
