
import React, { useState, useMemo } from 'react';
import { ProductionEntry, ShiftType, PlatformType, OrderType, PalletType } from '../types';
import { formatTonnage } from '../utils/calculations';
import { SHIFTS, PLATFORMS } from '../constants';
import { 
  Search, Calendar, Filter, Trash2, ChevronRight, FileDown, 
  Clock, User, Package, Tag, AlertTriangle, ChevronUp, ChevronDown, X,
  Truck, Globe, ShoppingCart, Sunrise, Sun, Moon, Edit3, FileText, Container, LockOpen, Layers2, ArrowsUpFromLine, Factory,
  ArrowUpDown, ArrowUp, ArrowDown, Hash, Bookmark
} from 'lucide-react';

interface HistoryViewProps {
  entries: ProductionEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: ProductionEntry) => void;
  isLoading?: boolean;
}

type SortField = 'date' | 'shift' | 'platform' | 'operator' | 'tonnage';
type SortOrder = 'asc' | 'desc';

const HistoryView: React.FC<HistoryViewProps> = ({ entries, onDelete, onEdit, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState<ShiftType | 'All'>('All');
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'All'>('All');
  const [selectedEntry, setSelectedEntry] = useState<ProductionEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<ProductionEntry | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); 
    }
  };

  const filteredAndSortedEntries = useMemo(() => {
    let result = entries.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      // Ensure orders is an array before using .some()
      const hasMatchingOrder = Array.isArray(entry.orders) && entry.orders.some(o => 
        (o.article_code && o.article_code.toLowerCase().includes(searchLower)) ||
        (o.dossier_number && o.dossier_number.toLowerCase().includes(searchLower)) ||
        (o.sap_code && o.sap_code.toLowerCase().includes(searchLower)) ||
        (o.ops_name && o.ops_name.toLowerCase().includes(searchLower)) ||
        (o.truck_matricule && o.truck_matricule.toLowerCase().includes(searchLower))
      );

      const matchesSearch = 
        entry.operator_name.toLowerCase().includes(searchLower) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchLower)) ||
        entry.entry_date.includes(searchLower) ||
        hasMatchingOrder;

      const matchesShift = filterShift === 'All' || entry.shift === filterShift;
      const matchesPlatform = filterPlatform === 'All' || entry.platform === filterPlatform;
      return matchesSearch && matchesShift && matchesPlatform;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.entry_date.localeCompare(b.entry_date);
          break;
        case 'shift':
          comparison = SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift);
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'operator':
          comparison = a.operator_name.localeCompare(b.operator_name);
          break;
        case 'tonnage':
          comparison = a.total_tonnage - b.total_tonnage;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, searchTerm, filterShift, filterPlatform, sortField, sortOrder]);

  const exportCSV = () => {
    const headers = [
      'Date', 
      'Shift', 
      'Platform', 
      'Operator', 
      'Category', 
      'Article Code', 
      'N Dossier',
      'CDE SAP',
      'Ops/Destination', 
      'N BL',
      'N TC',
      'N Plombe',
      'Truck Matricule',
      'Qty (Trucks/Cols)', 
      'Weight/Unit (T)', 
      'Columns', 
      'Pallet Config', 
      'Line Tonnage', 
      'Shift Notes'
    ];

    const rows: string[][] = [];

    filteredAndSortedEntries.forEach(entry => {
      if (Array.isArray(entry.orders)) {
        entry.orders.forEach(order => {
          rows.push([
            entry.entry_date,
            entry.shift,
            entry.platform,
            `"${entry.operator_name.replace(/"/g, '""')}"`,
            order.order_type,
            order.article_code,
            `"${(order.dossier_number || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.sap_code || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.ops_name || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.bl_number || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.tc_number || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.seal_number || 'N/A').replace(/"/g, '""')}"`,
            `"${(order.truck_matricule || 'N/A').replace(/"/g, '""')}"`,
            order.order_count.toString(),
            order.unit_weight.toString(),
            order.configured_columns.toString(),
            order.pallet_type,
            Number(order.calculated_tonnage).toFixed(2),
            `"${(entry.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
          ]);
        });
      }
    });

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    a.href = url;
    a.download = `protrack-production-export-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDelete(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  const getShiftIcon = (s: ShiftType, size = 12) => {
    if (s.includes('MORNING')) return <Sunrise size={size} />;
    if (s.includes('AFTERNOON')) return <Sun size={size} />;
    return <Moon size={size} />;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="opacity-30 ml-2" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="ml-2 text-indigo-600" /> 
      : <ArrowDown size={14} className="ml-2 text-indigo-600" />;
  };

  const SortHeaderButton = ({ field, label }: { field: SortField, label: string }) => (
    <button 
      onClick={() => handleSort(field)} 
      className={`flex items-center text-[10px] uppercase tracking-widest font-black transition-colors ${sortField === field ? 'text-indigo-700' : 'text-slate-400 hover:text-indigo-600'}`}
    >
      {label} <SortIcon field={field} />
    </button>
  );

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="bg-white p-6 rounded-[10px] border border-slate-200 h-48 animate-pulse">
           <div className="h-10 w-full bg-slate-100 rounded-[10px] mb-6"></div>
           <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
           <div className="flex gap-2 mb-6">
             {[1,2,3,4].map(i => <div key={i} className="h-8 w-24 bg-slate-100 rounded-[10px]"></div>)}
           </div>
        </div>

        {/* Grid Skeleton (Mobile) */}
        <div className="md:hidden grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[10px] border border-slate-200 h-[280px] p-6 animate-pulse"></div>
          ))}
        </div>

        {/* Table Skeleton (Desktop) */}
        <div className="hidden md:block bg-white rounded-[10px] border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
             {[1,2,3,4,5,6].map(i => <div key={i} className="h-4 bg-slate-200 rounded w-full"></div>)}
          </div>
          {[1,2,3,4,5].map(i => (
             <div key={i} className="p-4 border-b border-slate-50 flex gap-4">
               <div className="h-8 bg-slate-100 rounded w-full"></div>
               <div className="h-8 bg-slate-100 rounded w-full"></div>
               <div className="h-8 bg-slate-100 rounded w-full"></div>
               <div className="h-8 bg-slate-100 rounded w-full"></div>
               <div className="h-8 bg-slate-100 rounded w-full"></div>
               <div className="h-8 bg-slate-100 rounded w-full"></div>
             </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by operator, N° Dossier, SAP, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-[10px] border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              title="Download detailed transaction report"
              className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-[10px] hover:bg-indigo-700 transition-all border border-indigo-700 shadow-lg shadow-indigo-200"
            >
              <FileDown size={18} />
              Export Detailed CSV
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <Filter size={14} /> <span>Filter Operations</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 scroll-smooth">
                <button 
                  onClick={() => setFilterShift('All')}
                  className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${filterShift === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  All Shifts
                </button>
                {SHIFTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterShift(s)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${filterShift === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {getShiftIcon(s, 14)}
                    {s}
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 scroll-smooth">
                <button 
                  onClick={() => setFilterPlatform('All')}
                  className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${filterPlatform === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  All Platforms
                </button>
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPlatform(p)}
                    className={`px-4 py-2.5 rounded-[10px] text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${filterPlatform === p ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {p}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sorting Header Bar (Mobile Only) */}
      <div className="md:hidden flex items-center justify-between px-2 bg-slate-100/50 rounded-[10px] border border-slate-200/50">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button onClick={() => handleSort('date')} className={`px-3 py-2 text-[10px] font-bold rounded ${sortField === 'date' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}>Date</button>
          <button onClick={() => handleSort('shift')} className={`px-3 py-2 text-[10px] font-bold rounded ${sortField === 'shift' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}>Shift</button>
          <button onClick={() => handleSort('tonnage')} className={`px-3 py-2 text-[10px] font-bold rounded ${sortField === 'tonnage' ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}>Tonnage</button>
        </div>
        <div className="pr-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          {filteredAndSortedEntries.length} entries
        </div>
      </div>

      {filteredAndSortedEntries.length === 0 ? (
        <div className="py-20 bg-white rounded-[10px] border border-dashed border-slate-300 flex flex-col items-center justify-center opacity-40">
          <Search size={48} className="mb-4" />
          <p className="font-bold uppercase tracking-widest text-sm text-center px-4">No records match your filters</p>
        </div>
      ) : (
        <>
          {/* Card View (Mobile) */}
          <div className="md:hidden grid grid-cols-1 gap-6">
            {filteredAndSortedEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-[10px] border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{entry.entry_date}</div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                       {getShiftIcon(entry.shift)} {entry.shift.split(' ')[0]}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-[10px] font-black text-sm">
                    {formatTonnage(entry.total_tonnage)}
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-[10px]">
                   <User size={16} className="text-indigo-500" />
                   <span className="font-bold text-sm text-slate-700">{entry.operator_name}</span>
                </div>
                <div className="flex gap-2 mt-auto border-t border-slate-100 pt-4">
                   <button onClick={() => setSelectedEntry(entry)} className="flex-1 py-2 text-xs font-black bg-slate-100 hover:bg-slate-200 rounded-[10px] text-slate-600 uppercase tracking-widest">Details</button>
                   <button onClick={() => onEdit(entry)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-[10px]"><Edit3 size={16}/></button>
                   <button onClick={() => setEntryToDelete(entry)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-[10px]"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Data Grid View (Desktop) */}
          <div className="hidden md:block bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
            {/* Grid Header */}
            <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
               <SortHeaderButton field="date" label="Date" />
               <SortHeaderButton field="shift" label="Shift" />
               <SortHeaderButton field="platform" label="Platform" />
               <div className="col-span-1"><SortHeaderButton field="operator" label="Operator" /></div>
               <div className="text-right"><SortHeaderButton field="tonnage" label="Output (T)" /></div>
               <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</div>
            </div>

            {/* Grid Rows */}
            <div className="divide-y divide-slate-100">
              {filteredAndSortedEntries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-indigo-50/30 transition-colors group">
                  <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" /> {entry.entry_date}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 rounded-[8px] text-indigo-600">
                      {getShiftIcon(entry.shift, 14)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{entry.shift.split(' ')[0]}</span>
                      <span className="text-[10px] font-medium text-slate-400 hidden lg:block">{entry.shift.split(' ').slice(1).join(' ')}</span>
                    </div>
                  </div>

                  <div>
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-xs font-bold ${entry.platform === 'BIG_BAG' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                       {entry.platform}
                     </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                      {entry.operator_name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700 text-sm truncate">{entry.operator_name}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-emerald-600 text-sm">{formatTonnage(entry.total_tonnage)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedEntry(entry)} className="p-2 hover:bg-slate-100 rounded-[8px] text-slate-400 hover:text-indigo-600 transition-colors" title="View Details">
                      <ChevronRight size={18} />
                    </button>
                    <button onClick={() => onEdit(entry)} className="p-2 hover:bg-indigo-50 rounded-[8px] text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => setEntryToDelete(entry)} className="p-2 hover:bg-rose-50 rounded-[8px] text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Delete Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[10px] w-full max-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[10px] flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
                <AlertTriangle size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Entry?</h3>
              <p className="text-slate-500 mb-8 font-medium">
                Are you sure you want to permanently remove this record? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setEntryToDelete(null)} className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-[10px] transition-all uppercase tracking-widest text-xs">CANCEL</button>
                <button onClick={handleConfirmDelete} className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-[10px] shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">CONFIRM</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 flex items-start justify-center p-4 md:p-8"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-white rounded-[10px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">Shift Breakdown</h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="px-2 py-1 bg-slate-100 rounded-[10px] font-black font-mono">ID: {selectedEntry.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const entry = selectedEntry; setSelectedEntry(null); onEdit(entry); }} className="bg-indigo-50 hover:bg-indigo-100 p-3 rounded-[10px] transition-all text-indigo-600 active:scale-95"><Edit3 size={24} /></button>
                  <button onClick={() => setSelectedEntry(null)} className="bg-slate-100 hover:bg-slate-200 p-3 rounded-[10px] transition-all text-slate-500 active:scale-95"><X size={24} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                 <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</div>
                   <div className="font-black text-slate-800">{selectedEntry.entry_date}</div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operator</div>
                   <div className="font-black text-slate-800 truncate">{selectedEntry.operator_name}</div>
                 </div>
                 <div className="p-4 bg-indigo-50/50 rounded-[10px] border border-indigo-100 col-span-2 md:col-span-1">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Output</div>
                   <div className="text-2xl font-black text-emerald-600">{formatTonnage(selectedEntry.total_tonnage)}</div>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Operation Log</h4>
                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-[10px]">{(selectedEntry.orders || []).length} OPERATIONS</span>
                </div>

                <div className="space-y-4">
                  {(selectedEntry.orders || []).map((order, idx) => (
                    <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[10px] shadow-sm hover:shadow-md transition-all space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-[10px] shadow-sm ${order.order_type === OrderType.EXPORT ? 'bg-indigo-600 text-white' : order.order_type === OrderType.LOCAL ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                            {order.order_type === OrderType.EXPORT ? <Globe size={20} /> : order.order_type === OrderType.LOCAL ? <Factory size={20} /> : <ArrowsUpFromLine size={20} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg leading-none mb-1">{order.article_code}</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {order.dossier_number && <span className="text-[10px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-tighter"><Hash size={10}/> {order.dossier_number}</span>}
                              {order.sap_code && <span className="text-[10px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-tighter"><Bookmark size={10}/> {order.sap_code}</span>}
                              {order.ops_name && <span className="text-[10px] font-black text-indigo-500 flex items-center gap-1 uppercase tracking-tighter"><Tag size={10}/> {order.ops_name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-black text-slate-900 text-xl">{formatTonnage(order.calculated_tonnage)}</div>
                      </div>
                      
                      {/* Detailed Specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 rounded-[10px] overflow-hidden border border-slate-100">
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Quantity</span><span className="text-xs font-black text-slate-800">{order.order_count} Units</span></div>
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Weight</span><span className="text-xs font-black text-emerald-600">{order.unit_weight} T</span></div>
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Pallets</span><span className="text-xs font-black text-slate-800">{order.pallet_type}</span></div>
                         {order.order_type === OrderType.EXPORT && order.bl_number && <div className="bg-slate-50/80 p-3 flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">BL Number</span><span className="text-xs font-black text-slate-800">{order.bl_number}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntry.notes && (
                <div className="mt-10 p-6 bg-indigo-50/30 rounded-[10px] border border-indigo-100/50 relative">
                  <Tag className="absolute -top-3 -left-3 p-1.5 bg-indigo-500 text-white rounded-[10px] shadow-lg" size={24} />
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Shift Remarks</div>
                  <p className="text-slate-700 font-medium italic text-sm">"{selectedEntry.notes}"</p>
                </div>
              )}

              <button onClick={() => setSelectedEntry(null)} className="w-full mt-12 bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[10px] transition-all uppercase tracking-[0.2em] text-xs">DISMISS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
