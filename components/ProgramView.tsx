
import React, { useState, useMemo } from 'react';
import { ProductionEntry, MasterProgramEntry } from '../types';
import { 
  Search, Hash, Bookmark, MapPin, Ship, Package, 
  ChevronRight, Calendar, Info, ClipboardList, TrendingUp, 
  CheckCircle2, Clock, Info as InfoIcon 
} from 'lucide-react';
import { formatTonnage } from '../utils/calculations';

interface ProgramViewProps {
  entries: ProductionEntry[];
  masterProgram: MasterProgramEntry[];
}

const ProgramView: React.FC<ProgramViewProps> = ({ entries, masterProgram }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate actual production progress for each dossier in the Master Program
  const dossierProgress = useMemo(() => {
    return masterProgram.map(target => {
      let producedTonnage = 0;
      let producedUnits = 0;
      const history: { date: string; operator: string; qty: number; tonnage: number }[] = [];

      entries.forEach(entry => {
        if (entry.orders) {
          entry.orders.forEach(order => {
            // Match by Dossier ID or SAP Code
            const isMatch = (order.dossier_number === target.dossier_number) || 
                            (order.sap_code === target.sap_code);
            
            if (isMatch) {
              producedTonnage += Number(order.calculated_tonnage);
              producedUnits += order.order_count;
              history.push({
                date: entry.entry_date,
                operator: entry.operator_name,
                qty: order.order_count,
                tonnage: Number(order.calculated_tonnage)
              });
            }
          });
        }
      });

      const percent = Math.min(100, Math.round((producedTonnage / target.qte) * 100));

      return {
        ...target,
        producedTonnage,
        producedUnits,
        history,
        percent
      };
    }).filter(d => {
      const s = searchTerm.toLowerCase();
      return (
        d.dossier_number.toLowerCase().includes(s) ||
        d.sap_code.toLowerCase().includes(s) ||
        d.destination.toLowerCase().includes(s) ||
        d.maritime.toLowerCase().includes(s)
      );
    });
  }, [entries, searchTerm, masterProgram]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-cosumar-blue rounded-2xl flex items-center justify-center text-cosumar-gold shadow-xl">
            <ClipboardList size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-cosumar-blue tracking-tighter">Export Program</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Master Target Tracking System</p>
          </div>
        </div>
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
          <input
            type="text"
            placeholder="Search Dossier, SAP, or Dest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-cosumar-blue outline-none font-black text-xl text-slate-700 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {dossierProgress.length === 0 ? (
          <div className="bg-white p-24 rounded-2xl border border-dashed border-slate-200 text-center opacity-30">
            <Hash size={64} className="mx-auto mb-6 text-slate-300" />
            <p className="font-black uppercase tracking-[0.4em] text-xs">No dossiers found matching your search</p>
          </div>
        ) : (
          dossierProgress.map((d, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all border-l-[12px] border-l-cosumar-blue flex flex-col lg:flex-row group relative">
              
              <div className="p-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-4 space-y-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Program Reference</span>
                    <div className="text-3xl font-black text-cosumar-blue tracking-tighter flex items-center gap-3">
                      <Hash size={24} className="text-cosumar-gold shrink-0" /> {d.dossier_number}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-400">
                      <Bookmark size={16} className="shrink-0" /> SAP: <span className="text-slate-600 font-black">{d.sap_code}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Production Progress</span>
                      <span className={d.percent === 100 ? "text-emerald-500" : "text-cosumar-blue"}>{d.percent}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <div 
                        className={`h-full transition-all duration-1000 ${d.percent === 100 ? 'bg-emerald-500' : 'bg-cosumar-blue'}`}
                        style={{ width: `${d.percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                       <span className="flex items-center gap-1"><Package size={10}/> Target: {d.qte}T</span>
                       <span className="flex items-center gap-1 font-black text-slate-600"><TrendingUp size={10}/> Done: {d.producedTonnage.toFixed(2)}T</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 grid grid-cols-2 gap-y-10 gap-x-6">
                  <DetailItem icon={<MapPin size={14} className="text-cosumar-gold"/>} label="Destination" value={d.destination} />
                  <DetailItem icon={<Ship size={14} className="text-cosumar-gold"/>} label="Logistics / PIC" value={d.maritime} subValue={`Manager: ${d.pic}`} />
                  <DetailItem icon={<Calendar size={14} className="text-cosumar-gold"/>} label="Window" value={`${d.date_debut} - ${d.date_limite}`} />
                  <DetailItem icon={<InfoIcon size={14} className="text-cosumar-gold"/>} label="Planned Units" value={`${d.nbre} Containers / Trucks`} />
                </div>

                <div className="md:col-span-3 lg:border-l border-slate-50 lg:pl-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recent Activity</span>
                    <Clock size={14} className="text-cosumar-gold" />
                  </div>
                  <div className="space-y-4">
                    {d.history.length === 0 ? (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-xl">
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em]">Awaiting Prod</span>
                      </div>
                    ) : (
                      d.history.slice(-3).reverse().map((h, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold p-3 bg-slate-50 rounded-xl hover:bg-cosumar-blue/5 transition-colors">
                           <span className="text-slate-400">{h.date}</span>
                           <span className="text-cosumar-blue">{formatTonnage(h.tonnage)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {d.history.length > 0 && (
                    <button className="w-full py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-cosumar-blue transition-colors flex items-center justify-center gap-2">
                      View Full Trail <ChevronRight size={14}/>
                    </button>
                  )}
                </div>
              </div>

              {d.percent === 100 && (
                <div className="absolute top-4 right-4 animate-in zoom-in-50">
                  <CheckCircle2 size={32} className="text-emerald-500 drop-shadow-md" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center gap-4 text-slate-400 italic text-sm">
        <Info size={18} className="shrink-0" />
        <p>This program logic automatically tracks production progress by matching "Dossier ID" or "SAP Order" fields entered during shift sessions against the Master Program data.</p>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value, subValue }: any) => (
  <div className="space-y-2">
     <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">{icon} {label}</span>
     <div className="font-black text-slate-800 text-sm tracking-tight">{value}</div>
     {subValue && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{subValue}</div>}
  </div>
);

export default ProgramView;
