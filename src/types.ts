export interface Phone {
  id: string;
  createdAt: number;
  model: string;
  imei: string;
  serialNumber?: string;
  storageCapacity?: string;
  color?: string;
  batteryHealth?: number;
  
  // Buy Info
  buyPrice: number;
  buyDate: string;
  buyLocation?: string;
  sellerName?: string;
  sellerNumber?: string;
  
  // Sell Info
  sellPrice?: number;
  sellDate?: string;
  sellLocation?: string;
  buyerName?: string;
  buyerNumber?: string;
  
  physicalCondition?: string;
  status: 'In Stock' | 'Sold' | 'Personal Use' | 'On Sale';
  imageUrl?: string;
  reportUrl?: string;
  remarks?: string;
  diagnosticInfo?: Record<string, string>;
}

export interface Expense {
  id: string;
  phoneId: string;
  category: 'Repair' | 'Misc';
  description: string;
  amount: number;
  date: string;
}

export interface InventoryStats {
  totalProfit: number;
  totalInStock: number;
  capitalInvested: number;
  soldCount: number;
}
