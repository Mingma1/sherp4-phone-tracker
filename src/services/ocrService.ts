import { createWorker } from 'tesseract.js';

export interface OCRResult {
  model?: string;
  imei?: string;
  serialNumber?: string;
  batteryHealth?: number;
  storageCapacity?: string;
}

export async function scan3uReport(imageFile: File): Promise<OCRResult> {
  try {
    // Try Gemini OCR via Backend
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
    });
    reader.readAsDataURL(imageFile);
    const base64 = await base64Promise;

    const response = await fetch('/api/scan-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: imageFile.type
      })
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend OCR failed, falling back to Tesseract', err);
  }

  // Fallback to Tesseract
  const worker = await createWorker('eng');
  
  const { data: { text } } = await worker.recognize(imageFile);
  await worker.terminate();

  const results: OCRResult = {};

  // Simple heuristic regex for 3uTools typical fields
  const imeiMatch = text.match(/IMEI[ \t:]+([A-Z0-9]{15})/i);
  if (imeiMatch) results.imei = imeiMatch[1];

  const snMatch = text.match(/Serial Number[ \t:]+([A-Z0-9]+)/i);
  if (snMatch) results.serialNumber = snMatch[1];

  const modelMatch = text.match(/Product Model[ \t:]+([^\n\r]+)/i);
  if (modelMatch) results.model = modelMatch[1].trim();

  const bhMatch = text.match(/Battery [ \t]*Life[ \t:]+([0-9]+)%/i) || text.match(/Battery [ \t]*Health[ \t:]+([0-9]+)%/i);
  if (bhMatch) results.batteryHealth = parseInt(bhMatch[1], 10);

  const storageMatch = text.match(/HDD [ \t]*Capacity[ \t:]+([0-9]+[ \t]*(GB|TB))/i) || text.match(/Capacity[ \t:]+([0-9]+[ \t]*(GB|TB))/i);
  if (storageMatch) results.storageCapacity = storageMatch[1].trim();

  return results;
}
