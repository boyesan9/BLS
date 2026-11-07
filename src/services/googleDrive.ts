import { GoogleDriveLinks, InspectionRecord } from '../types';

// Convert base64 data URL to Blob
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const isBase64 = parts[0].includes(';base64');
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  if (isBase64) {
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return {
      blob: new Blob([uint8Array], { type: mimeType }),
      mimeType,
    };
  } else {
    const decoded = decodeURIComponent(parts[1]);
    return {
      blob: new Blob([decoded], { type: mimeType }),
      mimeType,
    };
  }
}

// Find or create inspection media folder in Google Drive
export async function getOrCreateInspectionFolder(
  accessToken: string,
  folderName = 'BLS_Ambulance_Inspections_Media'
): Promise<{ folderId: string; folderUrl: string }> {
  // Search for existing folder
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return {
        folderId: data.files[0].id,
        folderUrl: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`,
      };
    }
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้างโฟลเดอร์ใน Google Drive ได้');
  }

  const folderData = await createRes.json();
  return {
    folderId: folderData.id,
    folderUrl: folderData.webViewLink || `https://drive.google.com/drive/folders/${folderData.id}`,
  };
}

// Upload a single file to Google Drive using multipart upload
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  dataUrl: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  const { blob, mimeType } = dataUrlToBlob(dataUrl);

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType,
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new Blob([
    delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n`,
  ]);

  const body = new Blob([metadataBlob, blob, new Blob([closeDelimiter])]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `เกิดข้อผิดพลาดในการอัปโหลดไฟล์ ${fileName} ไปยัง Google Drive`);
  }

  const result = await uploadRes.json();
  return {
    fileId: result.id,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
  };
}

// Upload all media (4-side photos and attached document) for an inspection record
export async function uploadInspectionMediaToDrive(
  accessToken: string,
  record: InspectionRecord
): Promise<GoogleDriveLinks> {
  const { folderId, folderUrl } = await getOrCreateInspectionFolder(accessToken);
  const links: GoogleDriveLinks = {
    folderId,
    folderUrl,
  };

  const safeCode = record.vehicleCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeId = record.id.slice(-6);

  // Upload 4 side photos
  const photoKeys: Array<keyof typeof record.photos> = ['front', 'rear', 'left', 'right'];
  for (const key of photoKeys) {
    const photoDataUrl = record.photos[key];
    if (photoDataUrl && photoDataUrl.startsWith('data:')) {
      const fileName = `${safeCode}_${key.toUpperCase()}_${safeId}.jpg`;
      try {
        const uploaded = await uploadFileToDrive(accessToken, fileName, photoDataUrl, folderId);
        if (key === 'front') links.frontPhotoUrl = uploaded.webViewLink;
        if (key === 'rear') links.rearPhotoUrl = uploaded.webViewLink;
        if (key === 'left') links.leftPhotoUrl = uploaded.webViewLink;
        if (key === 'right') links.rightPhotoUrl = uploaded.webViewLink;
      } catch (e) {
        console.warn(`Failed to upload ${key} photo to Google Drive`, e);
      }
    }
  }

  // Upload document attachment if present
  if (record.documentAttachment && record.documentAttachment.dataUrl.startsWith('data:')) {
    const docName = `${safeCode}_DOC_${record.documentAttachment.name}`;
    try {
      const uploadedDoc = await uploadFileToDrive(
        accessToken,
        docName,
        record.documentAttachment.dataUrl,
        folderId
      );
      links.documentUrl = uploadedDoc.webViewLink;
    } catch (e) {
      console.warn('Failed to upload document attachment to Google Drive', e);
    }
  }

  return links;
}
