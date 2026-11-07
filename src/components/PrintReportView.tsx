import React, { useState } from 'react';
import { InspectionRecord } from '../types';
import { Printer, X, ExternalLink, Shield, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface PrintReportViewProps {
  record: InspectionRecord;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ record, onClose }) => {
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const categories = Array.from(new Set(record.vehicleChecklist.map((i) => i.categoryId))).map((catId) => {
    const items = record.vehicleChecklist.filter((i) => i.categoryId === catId);
    return {
      id: catId,
      title: items[0]?.categoryTitle || `หมวดที่ ${catId}`,
      items,
    };
  });

  const generateReportHtml = () => {
    const statusText =
      record.overallStatus === 'normal'
        ? 'พร้อมปฏิบัติการ (ปกติ)'
        : record.overallStatus === 'issue_found'
        ? 'พบข้อบกพร่อง (เฝ้าระวัง)'
        : 'งดใช้งาน (ส่งซ่อมบำรุง)';

    const rowsHtml = categories
      .map(
        (cat) => `
        <tr style="background:#f1f5f9; font-weight:bold;">
          <td colspan="4" style="padding:6px 10px; border:1px solid #cbd5e1; font-size:11px;">${cat.title}</td>
        </tr>
        ${cat.items
          .map(
            (item, idx) => `
          <tr>
            <td style="padding:5px 8px; border:1px solid #cbd5e1; text-align:center; font-size:11px;">${cat.id}.${idx + 1}</td>
            <td style="padding:5px 8px; border:1px solid #cbd5e1; font-size:11px;">
              <strong>${item.subTitle}</strong> <span style="color:#64748b;">(เกณฑ์: ${item.standard})</span>
            </td>
            <td style="padding:5px 8px; border:1px solid #cbd5e1; text-align:center; font-weight:bold; font-size:11px; color:${
              item.status === 'pass' ? '#16a34a' : item.status === 'warning' ? '#d97706' : '#dc2626'
            };">
              ${item.status === 'pass' ? '✓ พร้อมใช้งาน' : item.status === 'warning' ? '⚠ เฝ้าระวัง' : '✗ ชำรุด/ไม่ผ่าน'}
            </td>
            <td style="padding:5px 8px; border:1px solid #cbd5e1; font-size:10px; color:#475569;">${item.issueNotes || '-'}</td>
          </tr>
        `
          )
          .join('')}
      `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <title>ใบรายงานผลการตรวจสภาพรถ_${record.vehicleCode}_${record.plateNumber}</title>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #0369a1;
      margin: 0 0 2px 0;
    }
    .sub {
      font-size: 10px;
      color: #64748b;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 6px;
    }
    .card strong { color: #334155; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .photos {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .photo-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 3px;
      text-align: center;
      border-radius: 4px;
    }
    .photo-box img {
      width: 100%;
      height: 85px;
      object-fit: cover;
      border-radius: 2px;
      display: block;
    }
    .photo-label {
      font-size: 9px;
      font-weight: 600;
      margin-top: 2px;
      color: #334155;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 14px;
    }
    .sign-box {
      border: 1px dashed #94a3b8;
      padding: 10px;
      text-align: center;
      border-radius: 6px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">ใบรายงานผลการตรวจเช็คสภาพความพร้อมรถกู้ชีพส่วนกลาง (BLS Inspection Certificate)</div>
    <div class="sub">กองยานพาหนะและระบบการแพทย์ฉุกเฉิน · ตรวจรับ-ส่งมอบรถประจำเวร 24 ชั่วโมง</div>
  </div>

  <div class="grid">
    <div class="card">
      <div><strong>รหัสรถ:</strong> <span style="font-weight:bold; color:#0284c7;">${record.vehicleCode}</span> · <strong>ทะเบียน:</strong> ${record.plateNumber}</div>
      <div><strong>เลขไมล์ขณะตรวจ:</strong> ${record.odometerReading ? record.odometerReading.toLocaleString() : '-'} กม.</div>
      <div><strong>สถานะความพร้อม:</strong> <span style="font-weight:bold; color:${record.overallStatus === 'normal' ? '#16a34a' : record.overallStatus === 'issue_found' ? '#d97706' : '#dc2626'};">${statusText}</span></div>
    </div>
    <div class="card">
      <div><strong>ผู้ตรวจเช็ค:</strong> ${record.inspectorName} (${record.inspectorRole === 'admin' ? 'Admin' : 'พนักงานประจำเวร'})</div>
      <div><strong>รอบเวร:</strong> ${record.shiftLabel}</div>
      <div><strong>วัน-เวลาตรวจ:</strong> ${record.uploadTimestamp} (ID: ${record.id})</div>
    </div>
  </div>

  <div style="font-weight:bold; margin-bottom:4px; font-size:10px; color:#475569;">
    ภาพถ่ายสภาพตัวรถ 4 ด้าน (Timestamp Watermarked):
  </div>
  <div class="photos">
    <div class="photo-box">
      <img src="${record.photos.front}" alt="ด้านหน้า" />
      <div class="photo-label">ด้านหน้า (Front)</div>
    </div>
    <div class="photo-box">
      <img src="${record.photos.rear}" alt="ด้านหลัง" />
      <div class="photo-label">ด้านหลัง (Rear)</div>
    </div>
    <div class="photo-box">
      <img src="${record.photos.left}" alt="ด้านซ้าย" />
      <div class="photo-label">ด้านซ้าย (Left Side)</div>
    </div>
    <div class="photo-box">
      <img src="${record.photos.right}" alt="ด้านขวา" />
      <div class="photo-label">ด้านขวา (Right Side)</div>
    </div>
  </div>

  <div style="font-weight:bold; margin-bottom:4px; font-size:10px; color:#475569;">
    รายการตรวจเช็คสภาพตัวรถ 7 หมวด 19 รายการ:
  </div>
  <table>
    <thead>
      <tr style="background:#0f172a; color:#ffffff;">
        <th style="padding:6px; border:1px solid #cbd5e1; width:7%; text-align:center;">ลำดับ</th>
        <th style="padding:6px; border:1px solid #cbd5e1; width:53%; text-align:left;">รายการตรวจเช็ค / เกณฑ์มาตรฐาน</th>
        <th style="padding:6px; border:1px solid #cbd5e1; width:18%; text-align:center;">ผลตรวจ</th>
        <th style="padding:6px; border:1px solid #cbd5e1; width:22%; text-align:left;">ปัญหาที่พบ / หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  ${
    record.summaryNotes
      ? `<div style="margin-bottom:8px; padding:6px 10px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-size:10px;">
          <strong>หมายเหตุสรุปจากผู้ตรวจ:</strong> ${record.summaryNotes}
         </div>`
      : ''
  }

  ${
    record.documentAttachment
      ? `<div style="margin-bottom:8px; padding:4px 8px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:4px; font-size:10px; color:#166534;">
          <strong>เอกสารแนบ:</strong> ${record.documentAttachment.name} (${record.documentAttachment.type.toUpperCase()})
         </div>`
      : ''
  }

  <div class="sign-grid">
    <div class="sign-box">
      <div style="height:25px;"></div>
      <div>ลงชื่อ..............................................................</div>
      <div style="margin-top:4px; font-weight:600;">( ${record.inspectorName} )</div>
      <div style="font-size:9px; color:#64748b;">เจ้าหน้าที่ผู้ตรวจเช็คสภาพรถ</div>
    </div>
    <div class="sign-box">
      <div style="height:25px;"></div>
      <div>ลงชื่อ..............................................................</div>
      <div style="margin-top:4px; font-weight:600;">( .............................................................. )</div>
      <div style="font-size:9px; color:#64748b;">หัวหน้างาน/ผู้ดูแลระบบยานพาหนะส่วนกลาง</div>
    </div>
  </div>
</body>
</html>`;
  };

  // Primary: Hidden iframe print (100% reliable in sandboxed iframes)
  const handlePrintViaIframe = () => {
    try {
      setPrintStatus('กำลังเตรียมเอกสารสั่งพิมพ์...');
      const htmlContent = generateReportHtml();

      const printFrame = document.createElement('iframe');
      printFrame.setAttribute(
        'style',
        'visibility:hidden; height:0; width:0; position:absolute; left:-9999px; bottom:0;'
      );
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        // Allow images to load in the hidden iframe
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            setPrintStatus('เปิดหน้าต่างสั่งพิมพ์แล้ว');
          } catch (printErr) {
            console.warn('Iframe print error:', printErr);
            // Fallback to window.print
            window.print();
          } finally {
            setTimeout(() => {
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
              setPrintStatus(null);
            }, 3000);
          }
        }, 500);
      }
    } catch (e: any) {
      console.error('Print failure:', e);
      window.print();
    }
  };

  // Secondary: Standalone Window (if user prefers open in new tab)
  const handleOpenStandaloneTab = () => {
    try {
      const htmlContent = generateReportHtml();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        handlePrintViaIframe();
      }
    } catch (e) {
      handlePrintViaIframe();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 bg-slate-50 dark:border-slate-800 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                พิมพ์ใบรายงานผลการตรวจสภาพรถกู้ชีพ BLS
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                รถ {record.vehicleCode} ({record.plateNumber}) · ตรวจวันที่ {record.uploadTimestamp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {printStatus && (
              <span className="text-xs font-medium text-sky-600 dark:text-sky-400 animate-pulse">
                {printStatus}
              </span>
            )}

            <button
              type="button"
              onClick={handlePrintViaIframe}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 active:scale-95 transition-all"
              title="สั่งพิมพ์โดยตรงผ่านระบบพิมพ์ของเครื่อง"
            >
              <Printer className="h-4 w-4" />
              <span>สั่งพิมพ์ทันที</span>
            </button>

            <button
              type="button"
              onClick={handleOpenStandaloneTab}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="เปิดในแท็บใหม่เพื่อดูตัวอย่างก่อนพิมพ์"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>เปิดในแท็บใหม่</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Preview Sheet */}
        <div className="max-h-[80vh] overflow-y-auto p-8 space-y-6 bg-white text-slate-900">
          {/* Certificate Header */}
          <div className="border-b-2 border-sky-600 pb-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              ใบรายงานผลการตรวจเช็คสภาพความพร้อมรถกู้ชีพฉุกเฉิน (BLS)
            </h2>
            <p className="text-xs text-slate-500">
              กองยานพาหนะและระบบการแพทย์ฉุกเฉินส่วนกลาง · บันทึกตรวจรับสภาพประจำเวร
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-slate-600">รหัสรถ:</span>{' '}
                <span className="font-mono font-bold text-sky-700">{record.vehicleCode}</span> ·{' '}
                <span className="font-semibold text-slate-600">ทะเบียน:</span> {record.plateNumber}
              </p>
              <p>
                <span className="font-semibold text-slate-600">เลขไมล์ตรวจ:</span>{' '}
                <span className="font-mono tabular-nums">{record.odometerReading?.toLocaleString() || '-'}</span> กม.
              </p>
              <p>
                <span className="font-semibold text-slate-600">สถานะความพร้อม:</span>{' '}
                <span className="font-bold text-emerald-700">
                  {record.overallStatus === 'normal'
                    ? 'พร้อมปฏิบัติการ (ปกติ)'
                    : record.overallStatus === 'issue_found'
                    ? 'พบข้อบกพร่อง (เฝ้าระวัง)'
                    : 'งดใช้งาน (ส่งซ่อม)'}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p>
                <span className="font-semibold text-slate-600">ผู้ตรวจเช็ค:</span> {record.inspectorName}{' '}
                ({record.inspectorRole === 'admin' ? 'Admin' : 'พนักงานประจำเวร'})
              </p>
              <p>
                <span className="font-semibold text-slate-600">รอบเวร:</span> {record.shiftLabel}
              </p>
              <p>
                <span className="font-semibold text-slate-600">วัน-เวลาตรวจ:</span>{' '}
                <span className="font-mono tabular-nums">{record.uploadTimestamp}</span>
              </p>
            </div>
          </div>

          {/* 4-Side Photos Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              ภาพถ่ายสภาพรถ 4 ด้าน (Timestamp Watermarked)
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'ด้านหน้า (Front)', url: record.photos.front },
                { label: 'ด้านหลัง (Rear)', url: record.photos.rear },
                { label: 'ด้านซ้าย (Left)', url: record.photos.left },
                { label: 'ด้านขวา (Right)', url: record.photos.right },
              ].map((p, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-1 text-center bg-slate-50">
                  <img
                    src={p.url}
                    alt={p.label}
                    className="h-24 w-full rounded object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="mt-1 block text-[10px] font-bold text-slate-700">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Category Checklist Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              ผลการตรวจสภาพตัวรถ 7 หมวด 19 รายการ
            </h4>
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="border border-slate-200 p-2 text-center w-12">ลำดับ</th>
                  <th className="border border-slate-200 p-2 text-left">รายการตรวจเช็ค / เกณฑ์มาตรฐาน</th>
                  <th className="border border-slate-200 p-2 text-center w-28">ผลตรวจ</th>
                  <th className="border border-slate-200 p-2 text-left w-48">ปัญหาที่พบ / หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, cIdx) => (
                  <React.Fragment key={cat.id}>
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-200 px-3 py-1.5 text-slate-800">
                        {cat.title}
                      </td>
                    </tr>
                    {cat.items.map((item, iIdx) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="border border-slate-200 p-2 text-center font-mono text-[11px]">
                          {cIdx + 1}.{iIdx + 1}
                        </td>
                        <td className="border border-slate-200 p-2">
                          <span className="font-semibold">{item.subTitle}</span>{' '}
                          <span className="text-[11px] text-slate-500">(เกณฑ์: {item.standard})</span>
                        </td>
                        <td className="border border-slate-200 p-2 text-center">
                          {item.status === 'pass' && (
                            <span className="font-bold text-emerald-600">✓ พร้อมใช้งาน</span>
                          )}
                          {item.status === 'warning' && (
                            <span className="font-bold text-amber-600">⚠ เฝ้าระวัง</span>
                          )}
                          {item.status === 'fail' && (
                            <span className="font-bold text-red-600">✗ ชำรุด</span>
                          )}
                        </td>
                        <td className="border border-slate-200 p-2 text-[11px] text-slate-600">
                          {item.issueNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
              <div className="h-10" />
              <p className="text-xs">ลงชื่อ..............................................................</p>
              <p className="mt-1 font-semibold text-xs">( {record.inspectorName} )</p>
              <p className="text-[11px] text-slate-400">เจ้าหน้าที่ผู้ตรวจเช็คสภาพรถ</p>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
              <div className="h-10" />
              <p className="text-xs">ลงชื่อ..............................................................</p>
              <p className="mt-1 font-semibold text-xs">( .............................................................. )</p>
              <p className="text-[11px] text-slate-400">ผู้ดูแลระบบ/หัวหน้างานยานพาหนะ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
