
import React, { useState, useMemo } from 'react';
import { ProductionEntry, ShiftType, PlatformType, OrderType } from '../types';
import { formatTonnage } from '../utils/calculations';
import { SHIFTS, PLATFORMS } from '../constants';
import { 
  Search, Calendar, Filter, Trash2, ChevronRight, FileDown, 
  Clock, User, Package, Tag, AlertTriangle, ChevronUp, ChevronDown, X,
  Truck, Globe, ShoppingCart, Sunrise, Sun, Moon, Edit3, FileText, Container, LockOpen, Layers2, ArrowsUpFromLine, Factory
} from 'lucide-react';

interface HistoryViewProps {
  entries: ProductionEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: ProductionEntry) => void;
}

type SortField = 'date' | 'shift' | 'platform' | 'operator' | 'tonnage';
type SortOrder = 'asc' | 'desc';

const HistoryView: React.FC<HistoryViewProps> = ({ entries, onDelete, onEdit }) => {
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
      const matchesSearch = 
        entry.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesShift = filterShift === 'All' || entry.shift === filterShift;
      const matchesPlatform = filterPlatform === 'All' || entry.platform === filterPlatform;
      return matchesSearch && matchesShift && matchesPlatform;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'shift':
          comparison = SHIFTS.indexOf(a.shift) - SHIFTS.indexOf(b.shift);
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'operator':
          comparison = a.operatorName.localeCompare(b.operatorName);
          break;
        case 'tonnage':
          comparison = a.totalTonnage - b.totalTonnage;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, searchTerm, filterShift, filterPlatform, sortField, sortOrder]);

  const exportCSV = () => {
    // Detailed headers reflecting all data in Shift Breakdown card
    const headers = [
      'Date', 
      'Shift', 
      'Platform', 
      'Operator', 
      'Category', 
      'Article Code', 
      'Ops/Destination', 
      'N BL',
      'N TC',
      'N Plombe',
      'Truck Matricule',
      'Qty (Units)', 
      'Weight/Unit (T)', 
      'Columns', 
      'Pallet Config', 
      'Line Tonnage', 
      'Shift Notes'
    ];

    const rows: string[][] = [];

    filteredAndSortedEntries.forEach(entry => {
      // Create a row for every single order in the shift
      entry.orders.forEach(order => {
        rows.push([
          entry.date,
          entry.shift.split(' 06h00')[0].split(' 14h00')[0].split(' 22h00')[0].trim(), // Clean shift name
          entry.platform,
          `"${entry.operatorName.replace(/"/g, '""')}"`, // Escape quotes for CSV safety
          order.type,
          order.articleCode,
          `"${(order.opsName || 'N/A').replace(/"/g, '""')}"`,
          `"${(order.blNumber || 'N/A').replace(/"/g, '""')}"`,
          `"${(order.tcNumber || 'N/A').replace(/"/g, '""')}"`,
          `"${(order.sealNumber || 'N/A').replace(/"/g, '""')}"`,
          `"${(order.truckMatricule || 'N/A').replace(/"/g, '""')}"`,
          order.count.toString(),
          order.weightPerUnit.toString(),
          order.columns.toString(),
          order.palletType,
          order.calculatedTonnage.toFixed(2),
          `"${(entry.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"` // Escape and flatten notes
        ]);
      });
    });

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    a.href = url;
    a.download = `protrack-detailed-report-${timestamp}.csv`;
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
    if (s.includes('Morning')) return <Sunrise size={size} />;
    if (s.includes('AfterNoon')) return <Sun size={size} />;
    return <Moon size={size} />;
  };

  const SortHeader = ({ field, label, icon: Icon }: { field: SortField, label: string, icon?: React.ElementType }) => {
    const isActive = sortField === field;
    return (
      <button 
        onClick={() => handleSort(field)}
        className={`flex items-center gap-2 px-4 py-3 rounded-[10px] transition-all hover:bg-white hover:shadow-sm whitespace-nowrap ${
          isActive ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'
        }`}
      >
        {Icon && <Icon size={14} className={isActive ? 'text-indigo-500' : 'text-slate-300'} />}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        {isActive && (
          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by operator or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 py-3 rounded-[10px] border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
            {/* Shift Filter - Horizontal Scroll with Gradients */}
            <div className="relative group/scroll">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-100 group-hover/scroll:opacity-100 transition-opacity"></div>
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
            </div>

            {/* Platform Filter - Horizontal Scroll with Gradients */}
            <div className="relative group/scroll">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-100 group-hover/scroll:opacity-100 transition-opacity"></div>
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
      </div>

      {/* Sorting Header Bar */}
      <div className="flex items-center justify-between px-2 bg-slate-100/50 rounded-[10px] border border-slate-200/50">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <SortHeader field="date" label="Date" icon={Calendar} />
          <SortHeader field="shift" label="Shift" icon={Clock} />
          <SortHeader field="platform" label="Platform" />
          <SortHeader field="operator" label="Operator" icon={User} />
          <SortHeader field="tonnage" label="Tonnage" />
        </div>
        <div className="hidden lg:block pr-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          {filteredAndSortedEntries.length} entries filtered
        </div>
      </div>

      {/* Grid of Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[10px] border border-dashed border-slate-300 flex flex-col items-center justify-center opacity-40">
            <Search size={48} className="mb-4" />
            <p className="font-bold uppercase tracking-widest text-sm text-center px-4">No records match your filters</p>
          </div>
        ) : (
          filteredAndSortedEntries.map((entry) => (
            <div 
              key={entry.id} 
              className="group bg-white rounded-[10px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-500" />
                      <span className="font-black text-slate-800 tracking-tight">{entry.date}</span>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-[10px] font-black text-sm whitespace-nowrap ${sortField === 'tonnage' ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-50' : 'bg-emerald-50 text-emerald-700'}`}>
                    {formatTonnage(entry.totalTonnage)}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 my-5">
                  <div className={`space-y-1 p-3 rounded-[10px] border transition-colors ${sortField === 'shift' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {getShiftIcon(entry.shift)}
                      <span className="text-[9px] font-black uppercase tracking-tight">Shift Time Range</span>
                    </div>
                    <div className="text-[11px] font-black text-slate-700 leading-snug">{entry.shift}</div>
                  </div>
                  <div className={`space-y-1 p-3 rounded-[10px] border transition-colors ${sortField === 'platform' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[9px] font-black uppercase tracking-tight">Production Platform</span>
                    </div>
                    <div className="text-xs font-black text-slate-700">{entry.platform}</div>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all ${sortField === 'operator' ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                   <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shadow-inner ${sortField === 'operator' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                      <User size={20} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</div>
                      <div className="text-sm font-black text-slate-800 truncate">{entry.operatorName}</div>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setSelectedEntry(entry)}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onEdit(entry)}
                    title="Edit shift"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[10px] transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => setEntryToDelete(entry)}
                    title="Delete record"
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-[10px] transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Delete Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[10px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[10px] flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
                <AlertTriangle size={40} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Entry?</h3>
              <p className="text-slate-500 mb-8 font-medium">
                Are you sure you want to permanently remove this record? This action cannot be undone.
              </p>
              
              <div className="bg-slate-50 rounded-[10px] p-5 mb-8 text-left space-y-3 border border-slate-100 shadow-inner">
                <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest">Operator</span>
                  <span className="text-slate-800">{entryToDelete.operatorName}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="text-slate-800">{entryToDelete.date}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black pt-2 border-t border-slate-200/50">
                  <span className="text-slate-400 uppercase tracking-widest">Production</span>
                  <span className="text-emerald-600 font-black">{formatTonnage(entryToDelete.totalTonnage)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setEntryToDelete(null)}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-[10px] transition-all uppercase tracking-widest text-xs"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-[10px] shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  CONFIRM
                </button>
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
                  <button 
                    onClick={() => {
                      const entry = selectedEntry;
                      setSelectedEntry(null);
                      onEdit(entry);
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 p-3 rounded-[10px] transition-all text-indigo-600 active:scale-95"
                    title="Edit entry"
                  >
                    <Edit3 size={24} />
                  </button>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="bg-slate-100 hover:bg-slate-200 p-3 rounded-[10px] transition-all text-slate-500 active:scale-95"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                 <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</div>
                   <div className="font-black text-slate-800">{selectedEntry.date}</div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform</div>
                   <div className="font-black text-slate-800">{selectedEntry.platform}</div>
                 </div>
                 <div className="p-4 bg-indigo-50/50 rounded-[10px] border border-indigo-100 col-span-2 md:col-span-1">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Output</div>
                   <div className="text-2xl font-black text-emerald-600">{formatTonnage(selectedEntry.totalTonnage)}</div>
                 </div>
              </div>
              
              <div className="mb-10 p-6 bg-slate-900 rounded-[10px] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform">
                  {getShiftIcon(selectedEntry.shift, 80)}
                </div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Shift Schedule</div>
                <div className="font-black text-xl tracking-tight">{selectedEntry.shift}</div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Operation Log</h4>
                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-[10px]">{selectedEntry.orders.length} OPERATIONS</span>
                </div>

                <div className="space-y-4">
                  {selectedEntry.orders.map((order, idx) => (
                    <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[10px] shadow-sm hover:shadow-md transition-all space-y-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-[10px] shadow-sm ${
                            order.type === OrderType.EXPORT ? 'bg-indigo-600 text-white' : 
                            order.type === OrderType.LOCAL ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {order.type === OrderType.EXPORT ? <Globe size={20} /> : order.type === OrderType.LOCAL ? <Factory size={20} /> : <ArrowsUpFromLine size={20} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg leading-none mb-1 flex items-center gap-2">
                              {order.articleCode}
                            </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {order.opsName && (
                                <span className="text-[10px] font-black text-indigo-500 flex items-center gap-1.5 uppercase tracking-tighter">
                                  <Tag size={12} className="text-indigo-400" /> {order.opsName}
                                </span>
                              )}
                              {order.type === OrderType.EXPORT && (order.blNumber || order.tcNumber || order.sealNumber) && (
                                <div className="flex gap-2">
                                  {order.blNumber && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><FileText size={10}/> BL: {order.blNumber}</span>}
                                  {order.tcNumber && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><Container size={10}/> TC: {order.tcNumber}</span>}
                                  {order.sealNumber && <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1"><LockOpen size={10}/> S: {order.sealNumber}</span>}
                                </div>
                              )}
                              {order.type === OrderType.LOCAL && order.truckMatricule && (
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1"><Truck size={10}/> TRUCK: {order.truckMatricule}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contribution</div>
                          <div className="text-xl font-black text-slate-900">{formatTonnage(order.calculatedTonnage)}</div>
                        </div>
                      </div>
                      
                      {/* Technical Specs Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 rounded-[10px] overflow-hidden border border-slate-100">
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center group/spec">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                              {order.type === OrderType.DEBARDAGE ? 'Quantity (COL)' : 'Quantity (Trucks)'}
                            </span>
                            <span className="text-xs font-black text-slate-800">{order.count} Units</span>
                         </div>
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center group/spec">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Weight (T per unit)</span>
                            <span className="text-xs font-black text-emerald-600">{order.weightPerUnit} T</span>
                         </div>
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center group/spec">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1">Pallet Config <Layers2 size={10}/></span>
                            <span className="text-xs font-black text-slate-800">{order.palletType}</span>
                         </div>
                         <div className="bg-slate-50/80 p-3 flex justify-between items-center group/spec">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Standard Load</span>
                            <span className="text-xs font-black text-slate-800">{order.columns} {order.type === OrderType.DEBARDAGE ? 'UNIT' : 'COL'}</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntry.notes && (
                <div className="mt-10 p-6 bg-indigo-50/30 rounded-[10px] border border-indigo-100/50 relative">
                  <Tag className="absolute -top-3 -left-3 p-1.5 bg-indigo-500 text-white rounded-[10px] shadow-lg" size={24} />
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Shift Handover & Incidents</div>
                  <p className="text-slate-700 font-medium leading-relaxed italic text-sm">"{selectedEntry.notes}"</p>
                </div>
              )}

              <button 
                onClick={() => setSelectedEntry(null)}
                className="w-full mt-12 bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[10px] transition-all shadow-xl active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
              >
                DISMISS DETAILS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
