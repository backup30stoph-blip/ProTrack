
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ProductionEntry } from '../types';
import { calculateSummaryStats, formatTonnage } from '../utils/calculations';
import { TrendingUp, Package, Truck, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  entries: ProductionEntry[];
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b'];

const Dashboard: React.FC<DashboardProps> = ({ entries }) => {
  const stats = useMemo(() => calculateSummaryStats(entries), [entries]);

  const chartData = useMemo(() => {
    return [...entries]
      .reverse()
      .slice(-10)
      .map(e => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tonnage: e.totalTonnage,
        shift: e.shift.split(' ')[0]
      }));
  }, [entries]);

  const pieData = [
    { name: 'Export', value: stats.exportTonnage },
    { name: 'Local', value: stats.localTonnage },
    { name: 'Debardage', value: stats.debardageTonnage },
  ].filter(d => d.value > 0);

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-[10px] p-12 text-center border border-slate-200 shadow-sm">
        <div className="bg-indigo-50 w-20 h-20 rounded-[10px] flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">No production data yet</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-8">Start recording shift entries to see analytics and trends across your operations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Total Production" 
          value={formatTonnage(stats.totalTonnage)} 
          subtext={`${stats.entryCount} total entries`}
          icon={<Package className="text-indigo-600" size={24} />}
          color="bg-indigo-50"
        />
        <StatCard 
          label="Avg per Shift" 
          value={formatTonnage(stats.averageTonnage)} 
          subtext="Lifetime average"
          icon={<TrendingUp className="text-emerald-600" size={24} />}
          color="bg-emerald-50"
        />
        <StatCard 
          label="Export Focus" 
          value={formatTonnage(stats.exportTonnage)} 
          subtext={`${((stats.exportTonnage / stats.totalTonnage) * 100).toFixed(1)}% of total`}
          icon={<Truck className="text-amber-600" size={24} />}
          color="bg-amber-50"
        />
        <StatCard 
          label="Operational Units" 
          value={stats.entryCount.toString()} 
          subtext="Shifts tracked"
          icon={<ArrowUpRight className="text-rose-600" size={24} />}
          color="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[10px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 text-lg">Production Trend</h3>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-[10px] font-medium">Last 10 Entries</span>
          </div>
          <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTonnage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 600, color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="tonnage" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTonnage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white p-6 md:p-8 rounded-[10px] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-8">Distribution</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div style={{ width: '100%', height: '250px', minHeight: '250px' }}>
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full mt-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-[10px]" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-slate-600 font-medium">{d.name}</span>
                  </div>
                  <span className="text-slate-900 font-bold">{((d.value / stats.totalTonnage) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; subtextText?: string; subtext: string; icon: React.ReactNode; color: string }> = ({ label, value, subtext, icon, color }) => (
  <div className="bg-white p-6 rounded-[10px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-[10px] ${color} transition-transform group-hover:scale-110`}>
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <h4 className="text-slate-500 font-medium text-sm">{label}</h4>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-slate-400 text-xs font-medium">{subtext}</p>
    </div>
  </div>
);

export default Dashboard;
