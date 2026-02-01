
export enum PlatformType {
  BIG_BAG = 'BIG_BAG',
  FIFTY_KG = '50KG'
}

export enum OrderType {
  EXPORT = 'EXPORT',
  LOCAL = 'LOCAL',
  DEBARDAGE = 'DEBARDAGE'
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  NIGHT = 'NIGHT'
}

export enum PalletType {
  AVEC_PALET = 'AVEC_PALET',
  SANS_PALET = 'SANS_PALET',
  PLASTIQUE = 'PLASTIQUE'
}

// Matches 'production_orders' table
export interface ProductionOrder {
  id?: string;
  entry_id?: string;
  order_type: OrderType;
  article_code: string;
  dossier_number?: string;
  sap_code?: string;
  maritime_agent?: string;
  ops_name?: string;
  bl_number?: string;
  tc_number?: string;
  seal_number?: string;
  truck_matricule?: string;
  order_count: number;
  unit_weight: number; 
  configured_columns: number;
  pallet_type: PalletType;
  calculated_tonnage: number;
  created_at?: string;
}

// Matches 'production_entries' table
export interface ProductionEntry {
  id: string;
  entry_date: string;
  shift: ShiftType;
  platform: PlatformType;
  operator_name: string;
  notes?: string;
  total_tonnage: number;
  total_orders: number;
  orders: ProductionOrder[]; // Joined property
  submitted_at?: string;
}

export interface SummaryStats {
  totalTonnage: number;
  averageTonnage: number;
  exportTonnage: number;
  localTonnage: number;
  debardageTonnage: number;
  entryCount: number;
  uniqueDossiers: number;
}

// Matches 'master_program' table
export interface MasterProgramEntry {
  id: number;
  pic: string;
  dossier_number: string;
  sap_code: string;
  destination: string;
  nbre: number;
  qte: number;
  maritime: string;
  date_debut: string;
  date_limite: string;
  comments: string;
}
