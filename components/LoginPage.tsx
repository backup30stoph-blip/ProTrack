
import React, { useState } from 'react';
import { Lock, User, BarChart3, Loader2, ShieldCheck, Info } from 'lucide-react';

interface LoginPageProps {
  onLogin: (operator: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!operatorId || !password) {
      setError('Please enter all credentials');
      return;
    }

    setIsLoading(true);

    // Simulate API authentication
    setTimeout(() => {
      setIsLoading(false);
      onLogin(operatorId);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-[10px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">
        
        {/* Left Panel: Branding & Info */}
        <div className="md:w-5/12 bg-indigo-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-[10px] -mr-32 -mt-32 rotate-12 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2 bg-emerald-500 rounded-[10px] shadow-lg shadow-emerald-500/20">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter">ProTrack</h1>
            </div>
            
            <h2 className="text-2xl font-bold leading-tight mb-6">
              Production <br />
              Management System
            </h2>
            <p className="text-indigo-200 font-medium text-sm leading-relaxed mb-8">
              Secure access portal for shift operators and production managers to track real-time operational data.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-xs font-black text-indigo-300 uppercase tracking-widest">
              <ShieldCheck size={16} /> Encrypted Session
            </div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
              v1.0.2 • Terminal ID: PX-992
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="md:w-7/12 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Login</h3>
            <p className="text-slate-500 text-sm font-medium">Enter your credentials to access the console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator ID</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="e.g. OP-4412"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[10px] outline-none font-bold text-slate-800 transition-all focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Code</label>
                <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">Request Reset</button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[10px] outline-none font-bold text-slate-800 transition-all focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-[10px] text-xs font-bold flex items-center gap-3 border border-rose-100 animate-in fade-in slide-in-from-top-2">
                <Info size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-[10px] shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Access System'
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
