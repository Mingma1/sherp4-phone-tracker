export interface ParsedDiagnosticResult {
  model?: string;
  imei?: string;
  serialNumber?: string;
  batteryHealth?: number;
  storageCapacity?: string;
  color?: string;
  diagnosticInfo: Record<string, string>;
}

export function parse3uDump(text: string): ParsedDiagnosticResult {
  const lines = text.split(/\r?\n/);
  const info: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match Key (alphanumeric/dots) followed by at least two spaces or tab, then Value
    const match = trimmed.match(/^([A-Za-z0-9_\.]+)\s{2,}(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (key && val) {
        info[key] = val;
      }
    } else {
      // Fallback: match first whitespace separation if it looks like Key Value
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const key = parts[0];
        const val = parts.slice(1).join(' ');
        if (key && val && !key.includes(':') && !key.includes('=')) {
          info[key] = val;
        }
      }
    }
  }

  // Modern Apple ProductType lookup table
  const modelLookup: Record<string, string> = {
    'iPhone16,2': 'iPhone 15 Pro Max',
    'iPhone16,1': 'iPhone 15 Pro',
    'iPhone15,5': 'iPhone 15 Plus',
    'iPhone15,4': 'iPhone 15',
    'iPhone15,3': 'iPhone 14 Pro Max',
    'iPhone15,2': 'iPhone 14 Pro',
    'iPhone14,8': 'iPhone 14 Plus',
    'iPhone14,7': 'iPhone 14',
    'iPhone14,6': 'iPhone SE (3rd Gen)',
    'iPhone14,3': 'iPhone 13 Pro Max',
    'iPhone14,2': 'iPhone 13 Pro',
    'iPhone14,5': 'iPhone 13',
    'iPhone14,4': 'iPhone 13 mini',
    'iPhone13,4': 'iPhone 12 Pro Max',
    'iPhone13,3': 'iPhone 12 Pro',
    'iPhone13,2': 'iPhone 12',
    'iPhone13,1': 'iPhone 12 mini',
    'iPhone12,8': 'iPhone SE (2nd Gen)',
    'iPhone12,5': 'iPhone 11 Pro Max',
    'iPhone12,3': 'iPhone 11 Pro',
    'iPhone12,1': 'iPhone 11',
    'iPhone11,8': 'iPhone XR',
    'iPhone11,6': 'iPhone XS Max',
    'iPhone11,4': 'iPhone XS Max',
    'iPhone11,2': 'iPhone XS',
    'iPhone10,3': 'iPhone X',
    'iPhone10,6': 'iPhone X',
    'iPhone10,2': 'iPhone 8 Plus',
    'iPhone10,5': 'iPhone 8 Plus',
    'iPhone10,1': 'iPhone 8',
    'iPhone10,4': 'iPhone 8',
  };

  const productType = info['ProductType'] || info['DeviceClass'];
  let model = info['ModelNumber'] || 'Unknown Model';
  if (productType && modelLookup[productType]) {
    model = `${modelLookup[productType]}${info['ModelNumber'] ? ` (${info['ModelNumber']})` : ''}`;
  } else if (info['DeviceName'] && info['DeviceName'].includes('iPhone')) {
    model = info['DeviceName'];
  }

  const imei = info['InternationalMobileEquipmentIdentity'] || info['InternationalMobileEquipmentIdentity2'] || info['IMEI'] || info['IMEI1'] || '';
  const serialNumber = info['SerialNumber'] || info['BasebandSerialNumber'] || info['ChipSerialNo'] || '';
  
  let storageCapacity = info['StorageCapacity'] || info['DiskCapacity'] || info['TotalDiskCapacity'];
  
  let batteryHealth: number | undefined = undefined;
  const bhRaw = info['BatteryHealth'] || info['BatteryLife'] || info['BatteryCurrentCapacity'];
  if (bhRaw) {
    const parsed = parseInt(bhRaw.replace('%', ''), 10);
    if (!isNaN(parsed)) batteryHealth = parsed;
  }

  let color = info['DeviceColor'] || info['DeviceEnclosureColor'];
  if (color === '1') color = 'Dark/Black';
  if (color === '2') color = 'Silver/White';
  if (color === '3') color = 'Gold';
  if (info['RegionInfo']) {
    color = color ? `${color} (${info['RegionInfo']})` : info['RegionInfo'];
  }

  return {
    model,
    imei,
    serialNumber,
    batteryHealth,
    storageCapacity,
    color,
    diagnosticInfo: info,
  };
}
