
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShiftType, PlatformType, OrderType, ProductionOrder, ProductionEntry, PalletType, MasterProgramEntry } from '../types';
import { SHIFTS, PLATFORMS, ORDER_CONFIGS } from '../constants';
import { calculateOrderTonnage, generateId, formatTonnage } from '../utils/calculations';
import { 
  Plus, Trash2, Save, Loader2, Info, Calculator, Globe, Package, Tag, Sunrise, Sun, 
  Moon, X, FileText, LockOpen, Container, Layers2, ArrowsUpFromLine, Factory, 
  ChevronDown, ChevronUp, MapPin, ClipboardList, User, Truck, Hash, Bookmark, Ship, Search, RefreshCw, AlertCircle, MessageSquare
} from 'lucide-react';

interface EntryFormProps {
  onSubmit: (entry: Omit<ProductionEntry, 'id' | 'submitted_at' | 'total_tonnage' | 'total_orders'>) => void;
  draft: Partial<ProductionEntry> | null;
  onDraftChange: (draft: Partial<ProductionEntry>) => void;
  editingEntry?: ProductionEntry | null;
  onCancelEdit?: () => void;
  entries: ProductionEntry[];
  masterProgram: MasterProgramEntry[];
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, draft, onDraftChange, editingEntry, onCancelEdit, entries, masterProgram }) => {
  const [operatorName, setOperatorName] = useState(editingEntry?.operator_name || draft?.operator_name || '');
  const [date, setDate] = useState(editingEntry?.entry_date || draft?.entry_date || new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<ShiftType>(editingEntry?.shift || draft?.shift || ShiftType.MORNING);
  const [platform, setPlatform] = useState<PlatformType>(editingEntry?.platform || draft?.platform || PlatformType.BIG_BAG);
  const [orders, setOrders] = useState<ProductionOrder[]>(editingEntry?.orders || draft?.orders || []);
  const [notes, setNotes] = useState(editingEntry?.notes || draft?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Order Form state
  const [newOrderType, setNewOrderType] = useState<OrderType>(OrderType.EXPORT);
  const [newArticleCode, setNewArticleCode] = useState<string>(ORDER_CONFIGS[OrderType.EXPORT].articles[0]);
  const [isArticleDropdownOpen, setIsArticleDropdownOpen] = useState(false);
  const articleDropdownRef = useRef<HTMLDivElement>(null);

  const [newOpsName, setNewOpsName] = useState<string>('');
  const [newDossierNumber, setNewDossierNumber] = useState<string>('');
  const [newSapCode, setNewSapCode] = useState<string>('');
  const [newMaritimeAgent, setNewMaritimeAgent] = useState<string>('');
  const [newBlNumber, setNewBlNumber] = useState<string>('');
  const [newTcNumber, setNewTcNumber] = useState<string>('');
  const [newSealNumber, setNewSealNumber] = useState<string>('');
  const [newTruckMatricule, setNewTruckMatricule] = useState<string>('');
  const [newOrderCount, setNewOrderCount] = useState<number>(0);
  const [newOrderWeight, setNewOrderWeight] = useState<number>(ORDER_CONFIGS[OrderType.EXPORT].defaultWeight);
  const [newPalletType, setNewPalletType] = useState<PalletType>(ORDER_CONFIGS[OrderType.EXPORT].defaultPallet);
  const [dossierComments, setDossierComments] = useState<string | null>(null);

  const totalTonnage = orders.reduce((sum, o) => sum + Number(o.calculated_tonnage), 0);

  const categories = [
    { type: OrderType.EXPORT, label: 'Export', icon: Globe },
    { type: OrderType.LOCAL, label: 'Local', icon: Factory },
    { type: OrderType.DEBARDAGE, label: 'Debardage', icon: ArrowsUpFromLine },
  ];

  // Auto-save draft effect
  useEffect(() => {
    // Only save draft if we are not in editing mode
    if (!editingEntry) {
      const draftPayload = {
        entry_date: date,
        shift,
        platform,
        operator_name: operatorName,
        orders,
        notes,
        total_tonnage: totalTonnage,
        total_orders: orders.length
      };
      
      const timeoutId = setTimeout(() => {
        onDraftChange(draftPayload);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [date, shift, platform, operatorName, orders, notes, totalTonnage, editingEntry, onDraftChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (articleDropdownRef.current && !articleDropdownRef.current.contains(event.target as Node)) {
        setIsArticleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingEntry) {
      setOperatorName(editingEntry.operator_name);
      setDate(editingEntry.entry_date);
      setShift(editingEntry.shift);
      setPlatform(editingEntry.platform);
      setOrders(editingEntry.orders);
      setNotes(editingEntry.notes || '');
    }
  }, [editingEntry]);

  // Dossier Lookup and Auto-fill
  const handleDossierLookup = () => {
    if (!newDossierNumber) return;
    
    // Look up in passed props using SQL columns
    const dossierData = masterProgram.find(d => 
      d.dossier_number.toLowerCase() === newDossierNumber.toLowerCase() || 
      d.sap_code === newDossierNumber
    );

    if (dossierData) {
      setNewOpsName(dossierData.destination);
      setNewSapCode(dossierData.sap_code);
      setNewMaritimeAgent(dossierData.maritime);
      setNewDossierNumber(dossierData.dossier_number);
      setDossierComments(dossierData.comments);
    } else {
      setDossierComments(null);
      alert("Dossier ID not found in Master Program. Please enter data manually.");
    }
  };

  // Calculate Remaining Balance for the selected Dossier
  const dossierBalance = useMemo(() => {
    if (newOrderType !== OrderType.EXPORT || !newDossierNumber) return null;

    const target = masterProgram.find(d => d.dossier_number === newDossierNumber);
    if (!target) return null;

    let producedUnits = 0;
    entries.forEach(entry => {
      if (entry.orders) {
        entry.orders.forEach(order => {
          if (order.dossier_number === newDossierNumber) {
            producedUnits += order.order_count;
          }
        });
      }
    });

    orders.forEach(order => {
      if (order.dossier_number === newDossierNumber) {
        producedUnits += order.order_count;
      }
    });

    return {
      planned: target.nbre,
      produced: producedUnits,
      remaining: Math.max(0, target.nbre - producedUnits)
    };
  }, [newOrderType, newDossierNumber, entries, orders, masterProgram]);

  const handleCategoryChange = (type: OrderType) => {
    const config = ORDER_CONFIGS[type];
    setNewOrderType(type);
    setNewArticleCode(config.articles[0]);
    setNewOrderWeight(config.defaultWeight);
    setNewPalletType(config.defaultPallet);
    setNewBlNumber('');
    setNewTcNumber('');
    setNewSealNumber('');
    setNewTruckMatricule('');
    setNewOpsName('');
    setNewDossierNumber('');
    setNewSapCode('');
    setNewMaritimeAgent('');
    setDossierComments(null);
  };

  const livePreviewTonnage = useMemo(() => {
    return calculateOrderTonnage(newOrderType, newOrderCount || 0, newOrderWeight);
  }, [newOrderType, newOrderCount, newOrderWeight]);

  const handleAddOrder = () => {
    if (newOrderCount <= 0) return;

    const newOrder: ProductionOrder = {
      // id: generated by DB
      order_type: newOrderType,
      article_code: newArticleCode,
      dossier_number: newDossierNumber || undefined,
      sap_code: newSapCode || undefined,
      maritime_agent: newMaritimeAgent || undefined,
      ops_name: newOpsName || undefined,
      bl_number: newOrderType === OrderType.EXPORT ? newBlNumber : undefined,
      tc_number: newOrderType === OrderType.EXPORT ? newTcNumber : undefined,
      seal_number: newOrderType === OrderType.EXPORT ? newSealNumber : undefined,
      truck_matricule: newOrderType === OrderType.LOCAL ? newTruckMatricule : undefined,
      order_count: newOrderCount,
      unit_weight: newOrderWeight,
      configured_columns: ORDER_CONFIGS[newOrderType].columns,
      pallet_type: newPalletType,
      calculated_tonnage: livePreviewTonnage,
    };

    setOrders([newOrder, ...orders]);
    setNewOrderCount(0);
    setNewOpsName('');
    setNewDossierNumber('');
    setNewSapCode('');
    setNewMaritimeAgent('');
    setNewBlNumber('');
    setNewTcNumber('');
    setNewSealNumber('');
    setNewTruckMatricule('');
    setDossierComments(null);
  };

  const removeOrder = (idx: number) => {
    setOrders(orders.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName || orders.length === 0) {
      alert("Please ensure operator name is set and at least one order is added.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Submit entry without total_tonnage/total_orders as triggers handle that
      onSubmit({
        entry_date: date,
        shift,
        platform,
        operator_name: operatorName,
        orders,
        notes,
      });
      setIsSubmitting(false);
    }, 800);
  };

  const getShiftIcon = (s: ShiftType) => {
    if (s.includes('MORNING')) return <Sunrise size={18} />;
    if (s.includes('AFTERNOON')) return <Sun size={18} />;
    return <Moon size={18} />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-16 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Sidebar Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
            <h3 className="font-black text-cosumar-blue text-lg tracking-widest uppercase border-l-4 border-cosumar-gold pl-4">Session Context</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift Operator</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cosumar-blue" size={18} />
                  <input
                    required
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full h-14 pl-12 pr-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-cosumar-blue focus:bg-white outline-none font-bold text-slate-700 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift Options</label>
                <div className="grid grid-cols-1 gap-2">
                  {SHIFTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`flex items-center gap-3 px-4 h-12 rounded-xl border-2 transition-all font-bold text-sm ${
                        shift === s 
                          ? 'border-cosumar-blue bg-cosumar-blue/5 text-cosumar-blue shadow-sm' 
                          : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {getShiftIcon(s)}
                      {s.split(' ')[0]} {s.includes('Shift') ? 'Shift' : ''}
                      <span className="ml-auto text-[10px] opacity-50 font-medium">{s.split(' ').slice(-3).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shift Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 h-14 rounded-xl bg-slate-50 border-2 border-transparent focus:border-cosumar-blue focus:bg-white outline-none font-bold text-slate-700 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform</label>
                  <div className="px-4 h-14 flex items-center justify-center rounded-xl bg-cosumar-blue/5 border-2 border-cosumar-blue/10 font-black text-cosumar-blue text-xs uppercase tracking-widest">{platform}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cosumar-dark rounded-2xl p-10 text-white relative overflow-hidden shadow-2xl group">
            <div className="relative z-10 space-y-8">
              <div className="space-y-1">
                <h4 className="text-cosumar-gold font-black uppercase tracking-[0.3em] text-[10px]">Session Output Calculation</h4>
                <div className="text-6xl font-black tracking-tighter tabular-nums flex items-baseline gap-2">
                  {formatTonnage(totalTonnage).split(' ')[0]} 
                  <span className="text-2xl text-cosumar-gold/50 tracking-normal font-bold">T</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || orders.length === 0}
                className="w-full py-6 rounded-xl bg-cosumar-gold hover:bg-[#ffe04d] text-cosumar-blue font-black text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed uppercase"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {editingEntry ? 'Update Session' : 'Commit Shift'}
              </button>
            </div>
            <Calculator className="absolute -right-12 -bottom-12 text-white/5 w-64 h-64 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>

        {/* Builder Panel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm space-y-10">
            <div className="flex flex-col items-center gap-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Production Category</label>
              <div className="grid grid-cols-3 gap-4 w-full">
                {categories.map((cat) => (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => handleCategoryChange(cat.type)}
                    className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      newOrderType === cat.type 
                        ? `border-cosumar-blue bg-cosumar-blue/5 text-cosumar-blue shadow-lg scale-[1.05]` 
                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <cat.icon size={28} className={newOrderType === cat.type ? 'text-cosumar-blue' : 'text-slate-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><ClipboardList size={14} className="text-cosumar-gold"/> SKU / Article Code</label>
                <div className="relative" ref={articleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsArticleDropdownOpen(!isArticleDropdownOpen)}
                    className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent hover:border-cosumar-blue/30 rounded-xl flex items-center justify-between font-black text-2xl text-slate-700 transition-all"
                  >
                    {newArticleCode} <ChevronDown size={24} className="text-slate-300"/>
                  </button>
                  {isArticleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {ORDER_CONFIGS[newOrderType].articles.map(code => (
                        <button key={code} type="button" onClick={() => { setNewArticleCode(code); setIsArticleDropdownOpen(false); }} className="w-full px-8 py-5 text-left font-black text-xl hover:bg-cosumar-blue hover:text-white transition-colors">{code}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><MapPin size={14} className="text-cosumar-gold"/> Destination</label>
                <input type="text" value={newOpsName} onChange={(e) => setNewOpsName(e.target.value)} placeholder="e.g. Bassens" className="w-full h-16 px-8 bg-slate-50 border-2 border-transparent focus:border-cosumar-blue focus:bg-white rounded-xl font-black text-2xl text-slate-700 outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Hash size={14} className="text-cosumar-gold"/> DOSSIER ID</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={newDossierNumber} 
                      onChange={(e) => setNewDossierNumber(e.target.value)}
                      onBlur={handleDossierLookup}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleDossierLookup(); } }}
                      placeholder="8267/EXPSU" 
                      className="w-full bg-slate-50 h-14 px-5 border-2 border-transparent focus:border-cosumar-blue focus:bg-white rounded-xl text-slate-700 font-bold outline-none transition-all pr-12" 
                    />
                    <button 
                      type="button"
                      onClick={handleDossierLookup}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-cosumar-blue transition-colors"
                      title="Auto-fill from Master Program"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Bookmark size={14} className="text-cosumar-gold"/> SAP ORDER</label>
                <input type="text" value={newSapCode} onChange={(e) => setNewSapCode(e.target.value)} placeholder="21456406" className="w-full bg-slate-50 h-14 px-5 border-2 border-transparent focus:border-cosumar-blue focus:bg-white rounded-xl text-slate-700 font-bold" />
              </div>
            </div>

            {/* Dossier Notification Banner */}
            {dossierComments && (
              <div className="p-6 bg-cosumar-blue/5 border-2 border-cosumar-blue/10 border-dashed rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500 flex gap-4">
                <div className="w-12 h-12 bg-cosumar-blue text-white rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-cosumar-blue uppercase tracking-[0.2em] mb-1">Loading Instructions</h5>
                  <p className="text-slate-600 font-bold text-sm leading-relaxed">{dossierComments}</p>
                </div>
              </div>
            )}

            {newOrderType === OrderType.EXPORT && (
              <div className="p-8 bg-cosumar-blue/[0.02] rounded-2xl border-2 border-cosumar-blue/10 border-dashed space-y-8 animate-in zoom-in-95">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">MARITIME AGENT</label>
                  <input type="text" value={newMaritimeAgent} onChange={(e) => setNewMaritimeAgent(e.target.value)} className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={12}/> BL NUMBER</label>
                    <input type="text" value={newBlNumber} onChange={(e) => setNewBlNumber(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Container size={12}/> TC NUMBER</label>
                    <input type="text" value={newTcNumber} onChange={(e) => setNewTcNumber(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><LockOpen size={12}/> SEAL NUMBER</label>
                    <input type="text" value={newSealNumber} onChange={(e) => setNewSealNumber(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-gray-700" />
                  </div>
                </div>
              </div>
            )}

            {newOrderType === OrderType.LOCAL && (
              <div className="p-8 bg-cosumar-blue/[0.02] rounded-2xl border-2 border-cosumar-blue/10 border-dashed animate-in zoom-in-95">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3"><Truck size={14} className="inline mr-2"/> ENTRY TRUCK MATRICULE</label>
                <input type="text" value={newTruckMatricule} onChange={(e) => setNewTruckMatricule(e.target.value)} placeholder="0000-A-01" className="w-full px-8 py-5 rounded-xl bg-white border border-slate-200 font-black text-2xl text-cosumar-blue outline-none focus:border-cosumar-blue transition-all" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {newOrderType === OrderType.DEBARDAGE ? 'QTY (COLUMNS)' : 'QTY (TRUCKS)'}
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center h-20 bg-slate-50 rounded-2xl overflow-hidden border-2 border-transparent focus-within:border-cosumar-blue transition-all">
                    <button type="button" onClick={() => setNewOrderCount(c => Math.max(0, c - 1))} className="w-20 h-full flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronDown size={28}/></button>
                    <input type="number" value={newOrderCount || ''} onChange={(e) => setNewOrderCount(Number(e.target.value))} placeholder="0" className="flex-1 h-full bg-white text-center font-black text-3xl text-slate-700 outline-none" />
                    <button type="button" onClick={(e) => setNewOrderCount(c => c + 1)} className="w-20 h-full flex items-center justify-center hover:bg-slate-200 transition-colors"><ChevronUp size={28}/></button>
                  </div>
                  {dossierBalance && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cosumar-blue/5 rounded-lg border border-cosumar-blue/10">
                       <AlertCircle size={12} className="text-cosumar-blue" />
                       <span className="text-[9px] font-bold text-cosumar-blue uppercase tracking-widest">
                         Restant: {dossierBalance.remaining} / {dossierBalance.planned}
                       </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">UNIT WEIGHT (T)</label>
                <div className="grid grid-cols-2 gap-4 h-20">
                  {[1.1, 1.2].map(w => (
                    <button key={w} type="button" disabled={ORDER_CONFIGS[newOrderType].fixedWeight && w !== 1.2} onClick={() => setNewOrderWeight(w)} className={`rounded-2xl border-2 font-black text-2xl transition-all ${newOrderWeight === w ? 'border-cosumar-blue bg-cosumar-blue text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-400 disabled:opacity-20'}`}>{w}T</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PALLET SYSTEM</label>
                <div className="grid grid-cols-2 gap-4 h-20">
                  {newOrderType === OrderType.DEBARDAGE ? (
                    <div className="col-span-2 flex items-center justify-center px-6 bg-slate-100 border-2 border-slate-200 rounded-2xl font-black text-slate-500 text-[10px] uppercase tracking-[0.1em] text-center">
                      FIXED: {newPalletType}
                    </div>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setNewPalletType(PalletType.AVEC_PALET)} 
                        className={`rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all px-2 ${newPalletType === PalletType.AVEC_PALET ? 'border-cosumar-blue bg-cosumar-blue text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        WITH PALLET
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setNewPalletType(PalletType.SANS_PALET)} 
                        className={`rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all px-2 ${newPalletType === PalletType.SANS_PALET ? 'border-cosumar-blue bg-cosumar-blue text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        NO PALLET
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button type="button" onClick={handleAddOrder} disabled={newOrderCount <= 0} className="w-full py-8 bg-cosumar-blue hover:bg-cosumar-dark text-white rounded-2xl font-black text-xl tracking-[0.1em] shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-[0.98] disabled:opacity-20 uppercase">
              <Plus size={36} strokeWidth={3} /> ADD TO TRANSACTION LOG
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-black text-cosumar-blue uppercase tracking-widest text-sm">Operation Batch Log</h4>
              <div className="bg-cosumar-gold/20 px-5 py-2 rounded-full font-black text-cosumar-blue text-xs uppercase tracking-widest">{orders.length} Records</div>
            </div>
            <div className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <div className="px-10 py-24 text-center opacity-20 flex flex-col items-center gap-6">
                  <Package size={64} strokeWidth={1} />
                  <p className="font-black uppercase tracking-[0.3em] text-xs">No transactions in current buffer</p>
                </div>
              ) : (
                orders.map((order, idx) => (
                  <div key={idx} className="p-8 flex items-center justify-between group hover:bg-cosumar-blue/[0.02] transition-colors">
                    <div className="flex gap-6 items-center">
                       <div className={`p-4 rounded-xl ${order.order_type === OrderType.EXPORT ? 'bg-cosumar-blue text-white' : order.order_type === OrderType.LOCAL ? 'bg-cosumar-gold text-cosumar-blue' : 'bg-cosumar-sky text-white'}`}>
                         {order.order_type === OrderType.EXPORT ? <Globe size={24}/> : order.order_type === OrderType.LOCAL ? <Factory size={24}/> : <ArrowsUpFromLine size={24}/>}
                       </div>
                       <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-2xl tracking-tighter mb-1">{order.article_code}</span>
                        <div className="flex flex-wrap gap-3">
                          {order.dossier_number && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">REF: {order.dossier_number}</span>}
                          {order.ops_name && <span className="px-3 py-1 bg-cosumar-blue/10 text-cosumar-blue rounded-lg text-[10px] font-black uppercase tracking-tighter">TO: {order.ops_name}</span>}
                          <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-widest">{order.pallet_type === PalletType.AVEC_PALET ? 'W/ Pallet' : order.pallet_type === PalletType.SANS_PALET ? 'No Pallet' : 'Plastic'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-10">
                       <div className="text-right">
                         <div className="text-[10px] font-black text-slate-300 uppercase mb-1 tracking-widest">Calculated</div>
                         <div className="font-black text-slate-900 text-2xl tracking-tighter">{formatTonnage(order.calculated_tonnage)}</div>
                       </div>
                       <button onClick={() => removeOrder(idx)} className="p-4 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EntryForm;
