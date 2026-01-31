
import { OrderType, ShiftType, PlatformType, PalletType } from './types';

export const ORDER_CONFIGS = {
  [OrderType.EXPORT]: {
    columns: 20,
    defaultWeight: 1.1,
    articles: ['4301', '4302'],
    fixedWeight: false,
    defaultPallet: PalletType.AVEC_PALET
  },
  [OrderType.LOCAL]: {
    columns: 22,
    defaultWeight: 1.2,
    articles: ['4300', '4318', '4312', '4303'],
    fixedWeight: true,
    defaultPallet: PalletType.AVEC_PALET
  },
  [OrderType.DEBARDAGE]: {
    columns: 1,
    defaultWeight: 1.2,
    articles: ['4303'],
    fixedWeight: true,
    defaultPallet: PalletType.PLASTIQUE
  },
};

export const SHIFTS = [
  ShiftType.MORNING,
  ShiftType.AFTERNOON,
  ShiftType.NIGHT
];

export const PLATFORMS = [
  PlatformType.BIG_BAG,
  PlatformType.FIFTY_KG
];

export const STORAGE_KEY = 'protrack_production_data';
export const DRAFT_KEY = 'protrack_submission_draft';
