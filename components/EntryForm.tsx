
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShiftType, PlatformType, OrderType, ProductionOrder, ProductionEntry, PalletType } from '../types';
import { SHIFTS, PLATFORMS, ORDER_CONFIGS } from '../constants';
import { calculateOrderTonnage, generateId, formatTonnage } from '../utils/calculations';
import { 
  Plus, Trash2, Save, Loader2, Info, Calculator, Globe, Package, Tag, Sunrise, Sun, 
  Moon, X, FileText, LockOpen, Container, Layers2, ArrowsUpFromLine, Factory, 
  ChevronDown, ChevronUp, MapPin, ClipboardList, User, Truck
} from 'lucide-react';

interface EntryFormProps {
  onSubmit: (entry: Omit<ProductionEntry, 'id' | 'submittedAt'>) => void;
  draft: Partial<ProductionEntry> | null;
  onDraftChange: (draft: Partial<ProductionEntry>) => void;
  editingEntry?: ProductionEntry | null;
  onCancelEdit?: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit, draft, onDraftChange, editingEntry, onCancelEdit }) => {
  const [operatorName, setOperatorName] = useState(editingEntry?.operatorName || draft?.operatorName || '');
  const [date, setDate] = useState(editingEntry?.date || draft?.date || new Date().toISOString().split('T')[0]);
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
  const [newBlNumber, setNewBlNumber] = useState<string>('');
  const [newTcNumber, setNewTcNumber] = useState<string>('');
  const [newSealNumber, setNewSealNumber] = useState<string>('');
  const [newTruckMatricule, setNewTruckMatricule] = useState<string>('');
  const [newOrderCount, setNewOrderCount] = useState<number>(0);
  const [newOrderWeight, setNewOrderWeight] = useState<number>(ORDER_CONFIGS[OrderType.EXPORT].defaultWeight);
  const [newPalletType, setNewPalletType] = useState<PalletType>(ORDER_CONFIGS[OrderType.EXPORT].defaultPallet);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (articleDropdownRef.current && !articleDropdownRef.current.contains(event.target as Node)) {
        setIsArticleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state if editingEntry or draft changes
  useEffect(() => {
    if (editingEntry) {
      setOperatorName(editingEntry.operatorName);
      setDate(editingEntry.date);
      setShift(editingEntry.shift);
      setPlatform(editingEntry.platform);
      setOrders(editingEntry.orders);
      setNotes(editingEntry.notes || '');
    } else if (draft?.platform) {
      setPlatform(draft.platform);
    }
  }, [editingEntry, draft?.platform]);

  // Handle Category Change
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
  };

  // Auto-save draft
  useEffect(() => {
    if (editingEntry) return;
    const timeout = setTimeout(() => {
      onDraftChange({
        operatorName,
        date,
        shift,
        platform,
        orders,
        notes,
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [operatorName, date, shift, platform, orders, notes, onDraftChange, editingEntry]);

  const livePreviewTonnage = useMemo(() => {
    return calculateOrderTonnage(newOrderType, newOrderCount || 0, newOrderWeight);
  }, [newOrderType, newOrderCount, newOrderWeight]);

  const handleAddOrder = () => {
    if (newOrderCount <= 0) return;

    const newOrder: ProductionOrder = {
      id: generateId(),
      type: newOrderType,
      articleCode: newArticleCode,
      opsName: newOpsName || undefined,
      blNumber: newOrderType === OrderType.EXPORT ? newBlNumber : undefined,
      tcNumber: newOrderType === OrderType.EXPORT ? newTcNumber : undefined,
      sealNumber: newOrderType === OrderType.EXPORT ? newSealNumber : undefined,
      truckMatricule: newOrderType === OrderType.LOCAL ? newTruckMatricule : undefined,
      count: newOrderCount,
      weightPerUnit: newOrderWeight,
      columns: ORDER_CONFIGS[newOrderType].columns,
      palletType: newPalletType,
      calculatedTonnage: livePreviewTonnage,
      timestamp: Date.now(),
    };

    setOrders([newOrder, ...orders]);
    setNewOrderCount(0);
    setNewOpsName('');
    setNewBlNumber('');
    setNewTcNumber('');
    setNewSealNumber('');
    setNewTruckMatricule('');
  };

  const removeOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const totalTonnage = orders.reduce((sum, o) => sum + o.calculatedTonnage, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName || orders.length === 0) {
      alert("Please ensure operator name is set and at least one order is added.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        date,
        shift,
        platform,
        operatorName,
        orders,
        totalTonnage,
        notes,
      });
      setIsSubmitting(false);
    }, 800);
  };

  const getShiftIcon = (s: ShiftType) => {
    if (s.includes('Morning')) return <Sunrise size={18} />;
    if (s.includes('AfterNoon')) return <Sun size={18} />;
    return <Moon size={18} />;
  };

  const categories = [
    { type: OrderType.EXPORT, icon: Globe, label: 'Export', color: 'bg-indigo-600' },
    { type: OrderType.LOCAL, icon: Factory, label: 'Local', color: 'bg-emerald-600' },
    { type: OrderType.DEBARDAGE, icon: ArrowsUpFromLine, label: 'Débardage', color: 'bg-amber-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Session Metadata Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[10px] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Session Info</h3>
              {editingEntry && (
                <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-[10px] border border-amber-200">EDITING MODE</div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Operator</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                  <input
                    required
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Enter full name..."
                    className="w-full h-12 pl-12 pr-6 py-4 rounded-[10px] bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 h-12 rounded-[10px] bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</label>
                  <div className="px-4 h-12 flex items-center justify-center rounded-[10px] bg-indigo-50 border-2 border-indigo-100 font-black text-indigo-700 text-center">
                    {platform}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Selection</label>
                <div className="space-y-2">
                  {SHIFTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-[10px] border-2 transition-all text-left ${
                        shift === s 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' 
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <div className={shift === s ? 'text-white' : 'text-slate-400'}>
                        {getShiftIcon(s)}
                      </div>
                      <span className="text-xs font-black uppercase tracking-tight">{s.split(' ')[0]} {s.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[10px] p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                <h4 className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px]">Calculated Session Output</h4>
                <div className="text-5xl font-black tracking-tighter text-white tabular-nums">{formatTonnage(totalTonnage).split(' ')[0]} <span className="text-xl text-indigo-400">TONNES</span></div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || orders.length === 0}
                className={`w-full py-5 rounded-[10px] font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                  editingEntry 
                    ? 'bg-amber-600 hover:bg-amber-500' 
                    : 'bg-indigo-600 hover:bg-indigo-500'
                } disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {editingEntry ? 'UPDATE SESSION' : 'FINALIZE & SUBMIT'}
              </button>

              {editingEntry && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="w-full py-3 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors"
                >
                  Discard Changes
                </button>
              )}
            </div>
            <Calculator className="absolute -right-8 -bottom-8 text-white/5 w-48 h-48 pointer-events-none" />
          </div>
        </div>

        {/* Dynamic Entry Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[10px] border border-slate-200 shadow-sm space-y-10">
            
            {/* Category Selector */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Production Category</label>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => handleCategoryChange(cat.type)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-[10px] border-2 transition-all ${
                      newOrderType === cat.type 
                        ? `border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-4 ring-indigo-50` 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <cat.icon size={28} className={newOrderType === cat.type ? 'text-indigo-600' : 'text-slate-300'} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Article Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList size={14} className="text-indigo-500" /> Article Code
                </label>
                <div className="relative" ref={articleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsArticleDropdownOpen(!isArticleDropdownOpen)}
                    className="w-full h-[60px] px-6 bg-white border-2 border-slate-200 rounded-[10px] flex items-center justify-between font-black text-2xl text-slate-900 shadow-sm hover:border-indigo-600 transition-all"
                  >
                    {newArticleCode}
                    <ChevronDown className={`text-slate-300 transition-transform ${isArticleDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isArticleDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[10px] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                      {ORDER_CONFIGS[newOrderType].articles.map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setNewArticleCode(code);
                            setIsArticleDropdownOpen(false);
                          }}
                          className={`w-full px-6 py-4 text-left font-black text-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${
                            newArticleCode === code ? 'text-indigo-600 bg-indigo-50' : 'text-slate-900'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ops Name / Destination */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-500" /> Ops / Destination
                </label>
                <input
                  type="text"
                  value={newOpsName}
                  onChange={(e) => setNewOpsName(e.target.value)}
                  placeholder="e.g. Kinshasa 4412"
                  className="w-full h-[60px] px-6 bg-white border-2 border-slate-200 rounded-[10px] font-black text-xl text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all placeholder:text-slate-200"
                />
              </div>
            </div>

            {/* Tracking Fields based on category */}
            {(newOrderType === OrderType.EXPORT || newOrderType === OrderType.LOCAL) && (
              <div className="p-8 bg-indigo-50/50 rounded-[10px] border-2 border-indigo-100 border-dashed animate-in zoom-in-95 duration-300">
                {newOrderType === OrderType.EXPORT ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> BL Number</label>
                      <input type="text" value={newBlNumber} onChange={(e) => setNewBlNumber(e.target.value)} placeholder="N° BL..." className="w-full px-4 py-3 rounded-[10px] bg-white border-2 border-slate-100 font-bold focus:border-indigo-600 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Container size={12}/> TC Number</label>
                      <input type="text" value={newTcNumber} onChange={(e) => setNewTcNumber(e.target.value)} placeholder="N° TC..." className="w-full px-4 py-3 rounded-[10px] bg-white border-2 border-slate-100 font-bold focus:border-indigo-600 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><LockOpen size={12}/> Seal Number</label>
                      <input type="text" value={newSealNumber} onChange={(e) => setNewSealNumber(e.target.value)} placeholder="N° Plombe..." className="w-full px-4 py-3 rounded-[10px] bg-white border-2 border-slate-100 font-bold focus:border-indigo-600 outline-none" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck size={12}/> Entry Truck Matricule</label>
                    <input type="text" value={newTruckMatricule} onChange={(e) => setNewTruckMatricule(e.target.value)} placeholder="e.g. 1234AB/01" className="w-full px-6 py-4 rounded-[10px] bg-white border-2 border-slate-100 font-black text-xl text-slate-900 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-200" />
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Weight Configuration */}
            <div className={`grid grid-cols-1 ${newOrderType === OrderType.LOCAL ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8`}>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {newOrderType === OrderType.DEBARDAGE ? 'Nombre de COL' : 'Qty (Trucks)'}
                </label>
                <div className="flex items-center h-[76px] bg-white border-2 border-slate-200 rounded-[10px] overflow-hidden group focus-within:border-indigo-600 transition-all">
                  <button type="button" onClick={() => setNewOrderCount(c => Math.max(0, c - 1))} className="w-16 h-full flex items-center justify-center hover:bg-slate-50 border-r border-slate-100 transition-colors"><ChevronDown size={24}/></button>
                  <input type="number" value={newOrderCount || ''} onChange={(e) => setNewOrderCount(Number(e.target.value))} placeholder="0" className="flex-1 w-full text-center font-black text-3xl outline-none" />
                  <button type="button" onClick={() => setNewOrderCount(c => c + 1)} className="w-16 h-full flex items-center justify-center hover:bg-slate-50 border-l border-slate-100 transition-colors"><ChevronUp size={24}/></button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight (T/Unit)</label>
                <div className="grid grid-cols-2 gap-3 h-[76px]">
                  {[1.1, 1.2].map(w => (
                    <button
                      key={w}
                      type="button"
                      disabled={ORDER_CONFIGS[newOrderType].fixedWeight && w !== 1.2}
                      onClick={() => setNewOrderWeight(w)}
                      className={`rounded-[10px] border-2 font-black text-xl transition-all ${
                        newOrderWeight === w 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-4 ring-indigo-50' 
                          : 'border-slate-100 bg-slate-50 text-slate-300 disabled:opacity-25'
                      }`}
                    >
                      {w}T
                    </button>
                  ))}
                </div>
              </div>

              {/* Pallet Config Logic: Only EXPORT and DEBARDAGE, LOCAL is hidden */}
              {newOrderType !== OrderType.LOCAL && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pallet Config</label>
                  <div className="grid grid-cols-2 gap-3 h-[76px]">
                    {newOrderType === OrderType.EXPORT ? (
                      // Normal Avec/Sans options for Export
                      [PalletType.AVEC_PALET, PalletType.SANS_PALET].map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setNewPalletType(pt)}
                          className={`rounded-[10px] border-2 font-black text-[10px] uppercase transition-all px-2 ${
                            newPalletType === pt 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-4 ring-indigo-50' 
                              : 'border-slate-100 bg-slate-50 text-slate-300'
                          }`}
                        >
                          {pt.split(' ')[0]} <br/> {pt.split(' ')[1]}
                        </button>
                      ))
                    ) : (
                      // Only 'Palet Plastic' for Debardage
                      <button
                        type="button"
                        onClick={() => setNewPalletType(PalletType.PALET_PLASTIC)}
                        className={`col-span-2 rounded-[10px] border-2 font-black text-[10px] uppercase transition-all px-2 ${
                          newPalletType === PalletType.PALET_PLASTIC 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-4 ring-indigo-50' 
                            : 'border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                      >
                        Palet <br/> Plastic
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddOrder}
              disabled={newOrderCount <= 0}
              className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-[10px] font-black text-xl tracking-wide shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
              <Plus size={32} className="stroke-[3px]" />
              ADD TO LOG
            </button>
          </div>

          {/* Orders Visualization */}
          <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">Shift Transactions</h4>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations:</span>
                 <div className="bg-white border-2 border-slate-200 px-4 py-1 rounded-[10px] font-black text-indigo-600">{orders.length}</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-8 py-4 text-left">Article / Source</th>
                    <th className="px-8 py-4 text-left">Category</th>
                    <th className="px-8 py-4 text-center">Qty</th>
                    <th className="px-8 py-4 text-center">W/Unit</th>
                    <th className="px-8 py-4 text-right">Tonnage</th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <Package size={48} />
                          <p className="font-black uppercase tracking-widest text-xs">No records initialized for this shift</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg leading-none mb-2">{order.articleCode}</span>
                            <div className="flex gap-2">
                               {order.opsName && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-[10px] text-[9px] font-black uppercase tracking-tighter">OPS: {order.opsName}</span>}
                               {order.type === OrderType.EXPORT && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-[10px] text-[9px] font-black uppercase tracking-tighter">TRACKED SHIPMENT</span>}
                               {order.type === OrderType.LOCAL && order.truckMatricule && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-[10px] text-[9px] font-black uppercase tracking-tighter">TRUCK: {order.truckMatricule}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="inline-flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-[10px] ${
                               order.type === OrderType.EXPORT ? 'bg-indigo-500' :
                               order.type === OrderType.LOCAL ? 'bg-emerald-500' : 'bg-amber-500'
                             }`} />
                             <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">{order.type}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="font-black text-slate-900 text-2xl">{order.count}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="font-black text-indigo-600 text-base">{order.weightPerUnit}T</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-slate-900 text-2xl">
                          {formatTonnage(order.calculatedTonnage)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            type="button"
                            onClick={() => removeOrder(order.id)}
                            className="p-3 bg-slate-100 text-slate-400 rounded-[10px] hover:bg-rose-100 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[10px] border border-slate-200 shadow-sm space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Info size={14} className="text-indigo-500" /> Operational Remarks
             </label>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Enter any production observations, downtime reasons, or shift handover notes..."
               className="w-full h-32 p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[10px] outline-none font-medium text-slate-700 transition-all resize-none shadow-inner"
             />
          </div>
        </div>
      </div>
    </form>
  );
};

export default EntryForm;
