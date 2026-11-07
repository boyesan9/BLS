# ระบบตรวจรถยนต์ส่วนกลาง (รถกู้ชีพ BLS) — Ambulance Fleet Inspection & Management System

ระบบเว็บแอปพลิเคชันสำหรับตรวจเช็คสภาพรถยนต์กู้ชีพส่วนกลาง (BLS Ambulance) รองรับการใช้งานของเจ้าหน้าที่ประจำเวรตรวจสภาพรถภาคสนาม (ผ่านสมาร์ตโฟน/แท็บเล็ต) และผู้ดูแลระบบยานพาหนะ (Admin Fleet Manager) บนเดสก์ท็อป พร้อมระบบถ่ายภาพ 4 ด้าน, เช็คลิสต์ระบบตัวรถ 7 หมวด 19 รายการ, แนบเอกสารการตรวจเช็คสภาพพร้อมลายเซ็น, และการซิงค์ข้อมูลอัตโนมัติกับ Google Sheets

---

## User Review & Critical Decisions

> [!IMPORTANT]
> สรุปแนวทางที่ได้รับการยืนยันและปรับปรุงตามความคิดเห็นของผู้ใช้:
> 
> - **การปรับปรุงตามฟีดแบ็ก (ล่าสุด)**: นำส่วนเช็คลิสต์อุปกรณ์การแพทย์ BLS ออกตามความต้องการของผู้ใช้ โดยมุ่งเน้นที่การตรวจเช็คสภาพความพร้อมของตัวรถยนต์ 7 หมวด 19 รายการอย่างละเอียด พร้อมแนบเอกสารการตรวจสภาพและลายเซ็น
> - **การเชื่อมต่อ Google Sheets**: บันทึกและซิงค์ข้อมูลผลการตรวจเช็กรถลง Google Sheets อัตโนมัติในแต่ละรอบเวร พร้อมเปิดดูและส่งออกจากระบบได้ทันที โดยใช้ Google Workspace Integration (OAuth Scopes: `spreadsheets` และ `drive.file`)
> - **การเลือกรถกู้ชีพ BLS**: เลือกจากรายการรถกู้ชีพส่วนกลางที่มีในระบบ แสดงรูปถ่าย ทะเบียน รหัสรถ (เช่น BLS-01, BLS-02) และสถานะความพร้อม
> - **ระบบถ่ายภาพรถ 4 ด้าน**: รองรับทั้งการเปิดกล้องถ่ายสดจากอุปกรณ์ (Mobile/Tablet Camera Stream) และการเลือกอัปโหลดไฟล์รูปภาพ พร้อมระบบประทับเวลา (Timestamp Watermark) อัตโนมัติ

---

## 1. Overview & Core Concept

- **วัตถุประสงค์หลัก**: ยกระดับมาตรฐานความพร้อมของรถพยาบาลกู้ชีพ BLS ก่อนออกปฏิบัติการฉุกเฉิน ป้องกันความผิดพลาดของระบบไฟ สัญญาณฉุกเฉิน ระบบของเหลว แบตเตอรี่ เสียงไซเรน และยางรถยนต์
- **กลุ่มผู้ใช้งาน**:
  1. **พนักงานทั่วไป / เจ้าหน้าที่เวรตรวจรถ (Field Staff / EMT)**: เข้าเวร 24 ชั่วโมง (08:00 - 08:00 น.) หรือเวรผลัด บันทึกผลตรวจสภาพ ถ่ายรูป 4 ด้าน ตรวจระบบรถ แนบเอกสารลงนาม และส่งข้อมูลเข้าสู่ระบบ
  2. **ผู้ดูแลระบบ / หัวหน้างานยานพาหนะ (Fleet Admin)**: ตรวจสอบความพร้อมของรถทุกคันในกองยานพาหนะ จัดการข้อมูลรถ BLS ตรวจสอบประวัติย้อนหลัง ดูรูปถ่าย 4 ด้านและเอกสารแนบ และกำกับดูแลการซิงค์ข้อมูลไปยัง Google Sheets
- **จุดเด่น**: บันทึกชื่อผู้ตรวจและเวลาอัปโหลดอัตโนมัติ มีโหมดตรวจด่วน "ผ่านเกณฑ์ทั้งหมด (Pass All)" สำหรับข้อที่สมบูรณ์ และแสดงผลการแจ้งเตือนทันทีเมื่อพบรายการที่ไม่พร้อมใช้งาน

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Authentication & Session Switcher**:
   - หน้าจอล็อกอินที่รองรับการเข้าสู่ระบบแบบ Role-based (Admin และ พนักงานทั่วไป)
   - มีปุ่มเข้าใช้งานด่วน (One-Click Demo Personas: "เจ้าหน้าที่เวรตรวจรถ BLS" และ "ผู้ดูแลระบบยานพาหนะ Admin") พร้อมปุ่มเชื่อมต่อ Google Account สำหรับการซิงค์ Google Sheets
2. **Staff Inspection Flow (ตรวจสภาพรถประจำเวร)**:
   - **ขั้นตอนที่ 1 (ข้อมูลเวรและรถ)**: เลือกรถกู้ชีพ BLS จากรายการกองยานพาหนะ, ระบบระบุชื่อผู้ตรวจ (Uploader Name) และเวลาปัจจุบัน (Upload Timestamp) อัตโนมัติ, เลือกรอบเวร (ค่าเริ่มต้น: เวร 24 ชม. 08:00 - 08:00 น. ของอีกวัน หรือเลือก เวรเช้า / เวรบ่าย / เวรดึก)
   - **ขั้นตอนที่ 2 (ภาพถ่ายตัวรถ 4 ด้าน)**: ถ่ายภาพสดผ่านกล้องหรืออัปโหลดรูป 4 ช่อง (ด้านหน้า Front, ด้านหลัง Rear, ด้านซ้าย Left, ด้านขวา Right) พร้อมแสดงสถานะความสมบูรณ์
   - **ขั้นตอนที่ 3 (เช็คลิสต์ตัวรถ 7 หมวด 19 รายการตามมาตรฐาน)**:
     - 1. ตรวจสอบไฟตัวรถ: ไฟหน้า (ติดส่องสว่าง), ไฟหลัง (ติดส่องสว่าง), ไฟเลี้ยวหน้าขวา (ติดกระพริบ), ไฟเลี้ยวหน้าซ้าย (ติดกระพริบ), ไฟเลี้ยวหลังขวา (ติดกระพริบ), ไฟเลี้ยวหลังซ้าย (ติดกระพริบ), ไฟเบรก (ติดส่องสว่าง), ไฟตัดหมอก (ติดส่องสว่าง)
     - 2. ตรวจสอบสัญญาณไฟฉุกเฉิน: ไฟฉุกเฉินบนหลังคารถ (ติดกระพริบ), ไฟฉุกเฉินข้างตัวรถขวา (ติดกระพริบ), ไฟฉุกเฉินข้างตัวรถซ้าย (ติดกระพริบ), ไฟฉุกเฉินหลังรถ (ติดกระพริบ), ไฟส่องสว่างข้างตัวรถด้านขวา (ติดส่องสว่าง), ไฟส่องสว่างข้างตัวรถด้านซ้าย (ติดส่องสว่าง), ไฟส่องสว่างด้านหลัง (ติดส่องสว่าง)
     - 3. ตรวจสอบกระจกมองหลัง/ข้าง: ใสสะอาด / ไม่ชำรุด
     - 4. ตรวจสอบระบบของเหลว: น้ำมันเครื่อง (ตามมาตรฐานโรงงาน), น้ำหม้อน้ำ (ตามมาตรฐานโรงงาน), น้ำที่ปัดน้ำฝน (ตามมาตรฐานโรงงาน)
     - 5. ตรวจสอบสภาพภายนอกแบตเตอรี่: ไม่ชำรุด / พร้อมใช้งาน
     - 6. ทดสอบสัญญาณเสียง: ได้ยินเสียงชัดเจน (ไซเรนและแตร)
     - 7. ยางรถ: ตามมาตรฐาน (ระดับลมยางและความลึกดอกยาง)
     - แต่ละรายการมีสถานะ: "พร้อมใช้งาน (Pass)", "ต้องเฝ้าระวัง (Warning)", "ไม่พร้อม/ชำรุด (Fail)" พร้อมช่องบันทึกปัญหาที่พบ/หมายเหตุ
   - **ขั้นตอนที่ 4 (เอกสารตรวจเช็คสภาพรถ)**:
     - ช่องอัปโหลดเอกสารการตรวจเช็คสภาพ (รองรับไฟล์ PDF หรือรูปภาพเอกสารที่มีลายเซ็นผู้ตรวจ)
     - พรีวิวเอกสารที่อัปโหลด
   - **ขั้นตอนที่ 5 (บันทึกและส่งข้อมูล)**: กดส่งข้อมูล ระบบบันทึกลงฐานข้อมูลและส่งซิงค์ไปยัง Google Sheets ทันที พร้อมแสดงใบสรุปผลการส่ง
3. **Admin Dashboard Flow (แดชบอร์ดผู้ดูแลระบบ)**:
   - **Fleet Overview**: การ์ดสรุปสถานะรถประจำวัน (จำนวนรถทั้งหมด, รถพร้อมใช้งานปกติ, รถที่พบปัญหา, รถอยู่ระหว่างส่งซ่อม)
   - **Inspection History**: ตารางประวัติการตรวจแบบเจาะลึก ค้นหาตามทะเบียน, วันที่, รอบเวร, สถานะความพร้อม และผู้ตรวจ
   - **Detailed Inspection Modal**: คลิกดูข้อมูลแบบละเอียด ทั้งรูป 4 ด้านขนาดใหญ่, ผลเช็คลิสต์ทุกหมวด, เอกสารแนบตรวจสภาพ, พร้อมปุ่มพิมพ์เอกสารตรวจรับรถ (Printable Inspection Report)
   - **Fleet Vehicle Management**: จัดการข้อมูลรถกู้ชีพ BLS (เพิ่มรถใหม่, แก้ไขข้อมูลทะเบียน/รหัส/รุ่น, ปรับสถานะรถ)
   - **Google Sheets Sync Center**: แผงควบคุมการเชื่อมต่อ Google Sheets แสดงลิงก์เปิดดูไฟล์สเปรดชีตจริง และปุ่มทดสอบ/ซิงค์ย้อนหลัง

### Visual Identity & Theme

- **Aesthetic Direction**: Clinical Utility & Emergency Fleet Management — ให้ความรู้สึกน่าเชื่อถือ ชัดเจน สะอาดตา
- **Color Palette**:
  - Dominant Neutral: Cool Slate / Crisp White (`bg-slate-50` และ `bg-white`, ขอบบาง `border-slate-200`)
  - Structural Dark: Deep Navy (`#0F172A` / `#1E293B`) ให้ความมั่นคงในส่วนแถบนำทางและหัวตาราง
  - Emergency / Accent: Signal Red (`#DC2626`) สำหรับแจ้งเตือนข้อบกพร่อง, Medical Emerald (`#16A34A`) สำหรับสถานะพร้อมใช้งาน, Alert Amber (`#D97706`) สำหรับรายการเฝ้าระวัง
- **Typography**:
  - หัวข้อและแบรนด์: `Plus Jakarta Sans` ผสมข้อความภาษาไทยฟอนต์อ่านง่าย
  - ตัวเลขและข้อมูลเวลา: `tabular-nums` และ `font-mono` สำหรับตัวเลขไมล์ เวลาตรวจ และทะเบียนรถ
- **Anti-Slop Discipline**:
  - ไม่ใช้กล่อง Pill ซ้อนกัน (Zero-Pill Discipline) ใช้ข้อความเรียบง่ายพร้อมสัญลักษณ์คั่น (`·`)
  - ปุ่มและตัวเลือกชัดเจน สื่อความหมายตรงไปตรงมา เช่น "บันทึกและส่งข้อมูล", "เปิดกล้อง", "ส่งออกไฟล์"

---

## 3. Key Product Decisions & Trade-Offs

- **การตัดส่วนอุปกรณ์ BLS ออก**: มุ่งเน้นการตรวจสภาพวิศวกรรมตัวรถและความปลอดภัยในการขับขี่ (Vehicle Roadworthiness) ตามที่ผู้ใช้สั่งการ ช่วยให้เจ้าหน้าที่ตรวจรถเสร็จสิ้นได้อย่างกระชับและตรงจุด
- **การจัดเก็บข้อมูลแบบ Dual-Store (Local + Google Sheets)**:
  - *เหตุผล*: เจ้าหน้าที่ในพื้นที่อาจมีสัญญาณอินเทอร์เน็ตไม่เสถียร ระบบจึงบันทึกข้อมูลและรูปภาพในเครื่องทันทีก่อน (IndexedDB / LocalStorage) และซิงค์แถวข้อมูลไปยัง Google Sheets ผ่าน Google Sheets API ทันทีที่เชื่อมต่อได้
- **การจัดการรูปภาพและเอกสาร**:
  - *แนวทาง*: แปลงรูปถ่าย 4 ด้านและเอกสารแนบเป็น High-Quality Compressed Data URLs เพื่อแสดงผลในระบบได้รวดเร็วทันใจ พร้อมบันทึกลิงก์/ข้อมูลสรุปลงใน Google Sheets แถวที่ตรวจ
- **โหมดเปิดกล้องสด (Camera Access) พร้อม Fallback อัปโหลดไฟล์**:
  - *แนวทาง*: ใช้ HTML5 `navigator.mediaDevices.getUserMedia` เพื่อเปิดกล้องหน้า/หลังของสมาร์ตโฟนได้โดยตรง โดยมีปุ่มสลับกล้องและปุ่มถ่าย พร้อมช่อง File Input แบบดั้งเดิมเป็นทางเลือกสำรอง

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BLS Ambulance Inspection System                      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────────┐           ┌────────────────────────────────┐
│   Field EMT / Staff View      │           │      Admin Fleet Console       │
├───────────────────────────────┤           ├────────────────────────────────┤
│ • Shift & Vehicle Selection   │           │ • Daily Fleet Status Dashboard │
│ • 4-Side Camera / Upload      │           │ • Inspection History & Filter  │
│ • Vehicle 7-Category Checklist│           │ • Detailed Inspection Modal    │
│ • Signed Document Upload      │           │ • Vehicle Fleet Management     │
│ • Save & Submit Inspection    │           │ • Google Sheets Sync Status    │
└───────────────────────────────┘           └────────────────────────────────┘
          │                                                   │
          └─────────────────────────┬─────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Client-Side State & Storage Layer                    │
│   • Auth / Role State (Admin / Staff)                                  │
│   • Vehicles Store (BLS Ambulance Registry)                            │
│   • Inspection Records (IndexedDB / LocalStorage Persistent DB)        │
│   • Camera Capture & Watermark Canvas Utility                          │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Google Workspace Integration Layer                      │
│   • Google OAuth Sign-in & Token Management                            │
│   • Google Sheets API v4 Integration (Automated Append Row & Sync)     │
│   • Structured Columns: Timestamp, Vehicle, Inspector, Shift, Results  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models

```typescript
// รถกู้ชีพ BLS ในกองยานพาหนะ
interface AmbulanceVehicle {
  id: string;
  code: string;            // รหัสรถ เช่น 'BLS-01'
  plateNumber: string;     // ทะเบียน เช่น '1กข 4589 กทม.'
  brandModel: string;      // ยี่ห้อ/รุ่น เช่น 'Toyota Commuter 3.0 D4D'
  year: string;            // ปี เช่น '2023'
  status: 'available' | 'issue_found' | 'maintenance'; // สถานะความพร้อม
  currentOdometer: number; // เลขไมล์ล่าสุด
  imageUrl?: string;       // รูปถ่ายประจำรถ
  notes?: string;
}

// ข้อมูลการตรวจสภาพรถประจำเวร
interface InspectionRecord {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  plateNumber: string;
  inspectorName: string;   // ชื่อผู้ตรวจ (Uploader Name)
  inspectorRole: 'staff' | 'admin';
  uploadTimestamp: string; // วันที่และเวลาตรวจ (Upload Timestamp)
  shift: '24hr' | 'morning' | 'afternoon' | 'night'; // รอบเวร
  shiftLabel: string;      // เช่น 'เวร 24 ชม. (08:00 - 08:00 น.)'
  odometerReading: number; // เลขไมล์ขณะตรวจ
  photos: {
    front: string;         // รูปด้านหน้า (Data URL)
    rear: string;          // รูปด้านหลัง
    left: string;          // รูปด้านซ้าย
    right: string;         // รูปด้านขวา
  };
  vehicleChecklist: {
    itemId: string;
    category: string;      // ไฟตัวรถ, สัญญาณไฟฉุกเฉิน, กระจก, ของเหลว, แบตเตอรี่, เสียง, ยาง
    title: string;
    standard: string;      // เกณฑ์มาตรฐาน
    status: 'pass' | 'warning' | 'fail';
    issueNotes?: string;   // ปัญหาที่พบ/หมายเหตุ
  }[];
  documentAttachment?: {
    name: string;
    type: 'pdf' | 'image';
    dataUrl: string;
  };
  overallStatus: 'normal' | 'issue_found' | 'needs_repair';
  googleSheetsSyncStatus: 'synced' | 'pending' | 'failed' | 'not_connected';
  googleSheetsRowIndex?: number;
}
```

### Google Sheets Integration Strategy
1. **OAuth Setup**: ใช้ `set_up_oauth` เพื่อขอ Scopes `https://www.googleapis.com/auth/spreadsheets` และ `https://www.googleapis.com/auth/drive.file`
2. **Auto-Sheet Creation / Binding**: ผู้ใช้สามารถสร้าง Google Sheets ใหม่ หรือระบุ Spreadsheet ID ที่มีอยู่
3. **Structured Export Header**:
   - คอลัมน์ประกอบด้วย: Timestamp, Shift, Vehicle Code, License Plate, Inspector Name, Overall Status, Odometer, Lights Status, Emergency Siren Status, Fluids & Battery, Tires, Major Issues, Document Name, System Record ID
4. **Resilient Sync Queue**: มีสถานะแจ้งให้ทราบชัดเจนว่าข้อมูลซิงค์ลง Google Sheets สำเร็จแล้วหรือไม่

---

## 5. Implementation Steps & Verification Plan

1. **OAuth & Google Workspace Initialization**: เรียกใช้เครื่องมือ `set_up_oauth` สำหรับสิทธิ์ Google Sheets เพื่อรองรับการเชื่อมต่อกับชีตตามคำขอของผู้ใช้
2. **Setup Dependencies & Assets**: ตรวจสอบไอคอน `lucide-react` และโครงสร้าง CSS Tailwind v4
3. **Core Mock Data & Seed Storage**: ใส่ข้อมูลเริ่มต้นรถกู้ชีพ BLS ประจำศูนย์ (BLS-01, BLS-02, BLS-03) พร้อมรายการตรวจมาตรฐานครบ 7 หมวด 19 รายการ
4. **Build Inspection Form & Live Camera Module**: สร้างคอมโพเนนต์ถ่ายภาพ 4 ด้านพร้อมตัวเปิดกล้องสดและตัวอัปโหลดไฟล์, ตารางเช็คลิสต์ 7 หมวด 19 รายการ, และส่วนแนบเอกสารเซ็นชื่อ
5. **Build Admin Dashboard & Fleet Management**: สร้างหน้าสรุปสถานะรถประจำวัน, ตารางค้นหา/กรองประวัติการตรวจ, หน้าต่างดูรายละเอียดรูป 4 ด้าน และส่วนเพิ่ม/แก้ไขรถในระบบ
6. **Build Google Sheets Sync Engine**: เชื่อมต่อการส่งข้อมูลขึ้น Google Sheets API พร้อมแสดงสถานะและลิงก์เปิดชีต
7. **Verification & Linting**: ตรวจสอบการคอมไพล์ผ่าน `compile_applet` และตรวจสอบความถูกต้องของโค้ดผ่าน `lint_applet` ให้ผ่าน 100% ปราศจากข้อผิดพลาด
