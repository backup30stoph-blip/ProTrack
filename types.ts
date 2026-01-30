
export enum PlatformType {
  BIG_BAG = 'Big Bag',
  FIFTY_KG = '50kg'
}

export enum OrderType {
  EXPORT = 'Export',
  LOCAL = 'Local',
  DEBARDAGE = 'Debardage'
}

export enum ShiftType {
  MORNING = 'Morning Shift 06h00 to 14h00',
  AFTERNOON = 'AfterNoon 14h00 to 22h00',
  NIGHT = 'Night 22h00 to 06h00'
}

export enum PalletType {
  AVEC_PALET = 'Avec Palet',
  SANS_PALET = 'Sans Palet',
  PALET_PLASTIC = 'Palet Plastic'
}

export interface ProductionOrder {
  id: string;
  type: OrderType;
  articleCode: string;
  opsName?: string;
  blNumber?: string;
  tcNumber?: string;
  sealNumber?: string;
  truckMatricule?: string;
  count: number;
  weightPerUnit: number; // in Tonnes
  columns: number;
  palletType: PalletType;
  calculatedTonnage: number;
  timestamp: number;
}

export interface ProductionEntry {
  id: string;
  date: string;
  shift: ShiftType;
  platform: PlatformType;
  operatorName: string;
  orders: ProductionOrder[];
  totalTonnage: number;
  submittedAt: number;
  notes?: string;
}

export interface SummaryStats {
  totalTonnage: number;
  averageTonnage: number;
  exportTonnage: number;
  localTonnage: number;
  debardageTonnage: number;
  entryCount: number;
}
