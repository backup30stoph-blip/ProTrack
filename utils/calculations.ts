
import { OrderType, ProductionOrder, ProductionEntry, SummaryStats } from '../types';
import { ORDER_CONFIGS } from '../constants';

export const calculateOrderTonnage = (
  type: OrderType,
  count: number,
  weight: number
): number => {
  const config = ORDER_CONFIGS[type];
  // Export: (count × 20 COL × weight)
  // Local: (count × 22 COL × 1.2T)
  // Debardage: (count × 1 COL × 1.2T) -- count here represents Number of COLs
  return parseFloat((count * config.columns * weight).toFixed(2));
};

export const formatTonnage = (value: number): string => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' T';
};

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const calculateSummaryStats = (entries: ProductionEntry[]): SummaryStats => {
  const stats: SummaryStats = {
    totalTonnage: 0,
    averageTonnage: 0,
    exportTonnage: 0,
    localTonnage: 0,
    debardageTonnage: 0,
    entryCount: entries.length,
  };

  if (entries.length === 0) return stats;

  entries.forEach((entry) => {
    stats.totalTonnage += entry.totalTonnage;
    entry.orders.forEach((order) => {
      if (order.type === OrderType.EXPORT) stats.exportTonnage += order.calculatedTonnage;
      if (order.type === OrderType.LOCAL) stats.localTonnage += order.calculatedTonnage;
      if (order.type === OrderType.DEBARDAGE) stats.debardageTonnage += order.calculatedTonnage;
    });
  });

  stats.averageTonnage = stats.totalTonnage / entries.length;

  return stats;
};
