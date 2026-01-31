
import { OrderType, ProductionEntry, SummaryStats } from '../types';
import { ORDER_CONFIGS } from '../constants';

export const calculateOrderTonnage = (
  type: OrderType,
  count: number,
  weight: number
): number => {
  const config = ORDER_CONFIGS[type];
  return parseFloat((count * config.columns * weight).toFixed(2));
};

export const formatTonnage = (value: number): string => {
  return (value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' T';
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
    uniqueDossiers: 0
  };

  if (entries.length === 0) return stats;

  const dossierSet = new Set<string>();

  entries.forEach((entry) => {
    stats.totalTonnage += Number(entry.total_tonnage);
    
    // Safety check if orders exists
    if (entry.orders && Array.isArray(entry.orders)) {
      entry.orders.forEach((order) => {
        if (order.dossier_number) dossierSet.add(order.dossier_number);
        if (order.order_type === OrderType.EXPORT) stats.exportTonnage += Number(order.calculated_tonnage);
        if (order.order_type === OrderType.LOCAL) stats.localTonnage += Number(order.calculated_tonnage);
        if (order.order_type === OrderType.DEBARDAGE) stats.debardageTonnage += Number(order.calculated_tonnage);
      });
    }
  });

  stats.averageTonnage = stats.totalTonnage / entries.length;
  stats.uniqueDossiers = dossierSet.size;

  return stats;
};
