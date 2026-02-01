
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ProductionEntry } from '../types';
import { calculateSummaryStats, formatTonnage } from '../utils/calculations';
import { TrendingUp, Package, Truck, ArrowUpRight, Hash } from 'lucide-react';

interface DashboardProps {
  entries: ProductionEntry[];
  isLoading?: boolean;
}

const BRAND_COLORS = ['#004b9d', '#00a4e4', '#ffcc00'];

const Dashboard: React.FC<DashboardProps> = ({ entries, isLoading }) => {
  const stats = useMemo(() => calculateSummaryStats(entries), [entries]);

  const chartData = useMemo(() => {
    // Ensure we are accessing the correct snake_case properties from the DB
    return [...entries]
      .reverse()
      .slice(-10)
      .map(e => ({
        date: new Date(e.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tonnage: Number(e.total_tonnage), // Ensure number type
        shift: e.shift.split(' ')[0]
      }));
  }, [entries]);

  const pieData = [
    { name: 'Export', value: stats.exportTonnage },
    { name: 'Local', value: stats.localTonnage },
    { name: 'Debardage', value: stats.debardageTonnage },
  ].filter(d => d.value > 0);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Production" value={formatTonnage(stats.totalTonnage)} subtext={`${stats.entryCount} sessions`} icon={<Package size={24} />} color="bg-cosumar-blue text-white" />
        <StatCard label="Avg per Shift" value={formatTonnage(stats.averageTonnage)} subtext="Efficiency rating" icon={<TrendingUp size={24} />} color="bg-cosumar-gold text-cosumar-blue" />
        <StatCard label="Live Dossiers" value={stats.uniqueDossiers.toString()} subtext="System master data" icon={<Hash size={24} />} color="bg-cosumar-sky text-white" />
        <StatCard label="System Status" value="Active" subtext="All lines operational" icon={<ArrowUpRight size={24} />} color="bg-white text-cosumar-blue border border-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Production Performance</h3>
            <span className="text-[10px] font-black text-slate-300">Last 10 Records</span>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTonnage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004b9d" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#004b9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="tonnage" stroke="#004b9d" strokeWidth={4} fill="url(#colorTonnage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 text-sm mb-8 uppercase tracking-widest text-center">Output Distribution</h3>
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" stroke="none">
                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-4 mt-6">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}></div>
                      <span className="text-slate-500">{d.name}</span>
                    </div>
                    <span className="text-cosumar-blue">{((d.value / stats.totalTonnage) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
               <Package size={48} className="mb-2 opacity-20"/>
               <span className="text-xs font-black uppercase tracking-widest opacity-40">No Data Available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon, color }: any) => (
  <div className={`p-8 rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] flex flex-col bg-white border border-slate-100 relative overflow-hidden group`}>
    <div className={`p-4 rounded-xl mb-6 w-fit ${color} shadow-lg transition-transform group-hover:rotate-6`}>
      {icon}
    </div>
    <div className="space-y-1 relative z-10">
      <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{label}</h4>
      <div className="text-3xl font-black text-slate-900 tracking-tighter">{value}</div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{subtext}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-900 group-hover:scale-125 transition-transform">
       {/* Clone to add size prop */}
       {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 120 })}
    </div>
  </div>
);

export default Dashboard;
