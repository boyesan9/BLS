import { InspectionRecord } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

const DEFAULT_SHEET_TITLE = 'บันทึกการตรวจรถกู้ชีพ_BLS';

const HEADERS = [
  'วัน-เวลาที่ตรวจ',
  'รอบเวร',
  'รหัสรถ',
  'เลขทะเบียน',
  'ผู้ตรวจเช็ค',
  'สถานะรวม',
  'เลขไมล์ (กม.)',
  'ไฟตัวรถ (8 รายการ)',
  'ไฟฉุกเฉิน (7 รายการ)',
  'กระจกมองหลัง/ข้าง',
  'ระบบของเหลว (3 รายการ)',
  'สภาพแบตเตอรี่',
  'สัญญาณเสียง',
  'สภาพยางรถ',
  'ปัญหาที่พบ / หมายเหตุ',
  'เอกสารแนบ',
  'รูป 4 ด้าน',
  'รหัสบันทึก (ID)',
];

export async function createInspectionSpreadsheet(
  accessToken: string,
  title = 'ระบบตรวจสภาพรถกู้ชีพ BLS - บันทึกส่วนกลาง'
): Promise<SheetCreationResult> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: DEFAULT_SHEET_TITLE,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Spreadsheet ได้');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(DEFAULT_SHEET_TITLE)}!A1:R1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [HEADERS],
      }),
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

export function formatRecordForSheet(record: InspectionRecord): (string | number)[] {
  // Group checklist categories
  const getCatSummary = (catId: number) => {
    const items = record.vehicleChecklist.filter((c) => c.categoryId === catId);
    if (!items.length) return '-';
    const fails = items.filter((i) => i.status === 'fail');
    const warns = items.filter((i) => i.status === 'warning');
    if (fails.length > 0) {
      return `❌ ไม่ผ่าน (${fails.map((f) => f.subTitle).join(', ')})`;
    }
    if (warns.length > 0) {
      return `⚠️ เฝ้าระวัง (${warns.map((w) => w.subTitle).join(', ')})`;
    }
    return `✅ ปกติ (${items.length}/${items.length})`;
  };

  const lights = getCatSummary(1);
  const emergency = getCatSummary(2);
  const mirrors = getCatSummary(3);
  const fluids = getCatSummary(4);
  const battery = getCatSummary(5);
  const sound = getCatSummary(6);
  const tires = getCatSummary(7);

  const statusLabel =
    record.overallStatus === 'normal'
      ? 'ปกติ (พร้อมปฏิบัติการ)'
      : record.overallStatus === 'issue_found'
      ? 'พบข้อบกพร่อง (เฝ้าระวัง)'
      : 'งดใช้งาน (ส่งซ่อมบำรุง)';

  const issuesList = record.vehicleChecklist
    .filter((i) => i.status !== 'pass' || (i.issueNotes && i.issueNotes.trim() !== ''))
    .map((i) => `[${i.subTitle}: ${i.status.toUpperCase()}] ${i.issueNotes || 'ไม่ได้ระบุหมายเหตุ'}`)
    .join(' | ');

  const fullNotes = [issuesList, record.summaryNotes].filter(Boolean).join(' --- ');

  let docInfo = record.documentAttachment
    ? `แนบเอกสาร: ${record.documentAttachment.name} (${record.documentAttachment.type.toUpperCase()})`
    : 'ไม่มีเอกสารแนบ';
  if (record.driveLinks?.documentUrl) {
    docInfo += ` | ลิงก์ Drive: ${record.driveLinks.documentUrl}`;
  }

  const photosCount = [
    record.photos.front,
    record.photos.rear,
    record.photos.left,
    record.photos.right,
  ].filter(Boolean).length;

  let photosSummary = photosCount ? `ถ่ายครบ 4 ด้าน (${photosCount}/4)` : 'ไม่ครบ';
  if (record.driveLinks?.folderUrl) {
    photosSummary += ` | ลิงก์ Drive: ${record.driveLinks.folderUrl}`;
  }

  return [
    record.uploadTimestamp,
    record.shiftLabel,
    record.vehicleCode,
    record.plateNumber,
    record.inspectorName,
    statusLabel,
    record.odometerReading || 0,
    lights,
    emergency,
    mirrors,
    fluids,
    battery,
    sound,
    tires,
    fullNotes || 'ไม่มีปัญหาที่พบ',
    docInfo,
    photosSummary,
    record.id,
  ];
}

export async function appendInspectionToSheet(
  spreadsheetId: string,
  record: InspectionRecord,
  accessToken: string,
  targetSheet = DEFAULT_SHEET_TITLE
): Promise<{ success: boolean; updatedRange?: string }> {
  const rowValues = formatRecordForSheet(record);

  // Append row
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    targetSheet
  )}!A:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `เกิดข้อผิดพลาดในการเพิ่มข้อมูลลง Google Sheets (${response.status})`);
  }

  const result = await response.json();
  return {
    success: true,
    updatedRange: result.updates?.updatedRange,
  };
}
