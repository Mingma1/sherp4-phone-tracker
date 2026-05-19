// OCR functionality has been deprecated in favor of robust manual input.
export interface OCRResult {
  model?: string;
  imei?: string;
  serialNumber?: string;
  batteryHealth?: number;
  storageCapacity?: string;
}

