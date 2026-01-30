
import React, { useState, useEffect } from 'react';
import Layout from './components/ui/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import HistoryView from './components/HistoryView';
import LoginPage from './components/LoginPage';
import { useProductionData } from './hooks/useProductionData';
import { ProductionEntry, PlatformType } from './types';
import { ChevronRight, Factory, Package, Settings, LogOut } from 'lucide-react';

type ViewType = 'dashboard' | 'entry' | 'history' | 'settings';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentOperator, setCurrentOperator] = useState<string>('');
  
  const { entries, addEntry, updateEntry, deleteEntry, draft, saveDraft } = useProductionData();

  // Check for existing session
  useEffect(() => {
    const savedOperator = localStorage.getItem('protrack_session_operator');
    if (savedOperator) {
      setIsAuthenticated(true);
      setCurrentOperator(savedOperator);
    }
  }, []);

  const handleLogin = (operator: string) => {
    localStorage.setItem('protrack_session_operator', operator);
    setIsAuthenticated(true);
    setCurrentOperator(operator);
  };

  const handleLogout = () => {
    localStorage.removeItem('protrack_session_operator');
    setIsAuthenticated(false);
    setCurrentOperator('');
  };

  const handleEntrySubmit = (entryData: any) => {
    if (editingEntry) {
      updateEntry({ ...entryData, id: editingEntry.id, submittedAt: editingEntry.submittedAt });
      setEditingEntry(null);
    } else {
      addEntry(entryData);
    }
    setSelectedPlatform(null);
    setActiveView('history');
  };

  const handleEditClick = (entry: ProductionEntry) => {
    setEditingEntry(entry);
    setSelectedPlatform(entry.platform);
    setActiveView('entry');
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setSelectedPlatform(null);
    setActiveView('history');
  };

  const handleNavChange = (view: ViewType) => {
    if (view === 'entry') {
      if (!editingEntry) {
        setSelectedPlatform(null);
      }
    }
    setActiveView(view);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderEntryFlow = () => {
    if (editingEntry || selectedPlatform) {
      return (
        <EntryForm 
          onSubmit={handleEntrySubmit} 
          draft={selectedPlatform ? { ...draft, platform: selectedPlatform } : draft} 
          onDraftChange={saveDraft}
          editingEntry={editingEntry}
          onCancelEdit={handleCancelEdit}
        />
      );
    }

    return (
      <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-[10px] text-[10px] font-black uppercase tracking-[0.25em] mb-6 border border-indigo-100 shadow-sm">
            <Factory size={14} /> New Production Shift
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
            Choose Your <span className="text-indigo-600">Line</span>
          </h2>
          <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Select the active packaging platform to initialize shift tracking and automated tonnage calculations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <button
            onClick={() => setSelectedPlatform(PlatformType.BIG_BAG)}
            className="group relative bg-white rounded-[10px] border-4 border-slate-100 p-6 md:p-12 hover:border-indigo-600 transition-all duration-500 shadow-xl hover:shadow-indigo-200/50 flex flex-col items-center text-center overflow-hidden active:scale-[0.97]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[10px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-full aspect-square mb-10 relative z-10">
              <div className="absolute inset-0 bg-slate-50 rounded-[10px] rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-inner"></div>
              <img 
                src="https://lh3.googleusercontent.com/gg-dl/AOI_d_99MCKFDOKgNyLXupxb5913utWRgvn3kVtSNmM1dFB4_YDNclCB8PGhk4X7eVjjCPepKDArfjfnLw661OVmlfTvizLWL67tm64xtzWVBHKM8hnaieoOjAMa-OXTnLvuMeUFu9wvleqRXI5DhCoAHiw3TSA4jlkWxqofwnzrklJ8y4KKTQ=s1024-rj" 
                alt="Big Bag Platform" 
                className="relative z-20 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
              />
            </div>
            <div className="relative z-10 space-y-3 mb-10">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">BIG BAG</h3>
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Package size={16} />
                <p className="font-bold text-xs uppercase tracking-[0.15em]">Industrial Bulk Load</p>
              </div>
            </div>
            <div className="relative z-10 mt-auto w-full py-6 bg-slate-900 text-white group-hover:bg-indigo-600 rounded-[10px] font-black transition-all duration-300 flex items-center justify-center gap-3 text-sm tracking-[0.2em] shadow-lg shadow-slate-900/20">
              INITIALIZE LINE <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setSelectedPlatform(PlatformType.FIFTY_KG)}
            className="group relative bg-white rounded-[10px] border-4 border-slate-100 p-6 md:p-12 hover:border-indigo-600 transition-all duration-500 shadow-xl hover:shadow-indigo-200/50 flex flex-col items-center text-center overflow-hidden active:scale-[0.97]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[10px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-full aspect-square mb-10 relative z-10">
              <div className="absolute inset-0 bg-slate-50 rounded-[10px] -rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-inner"></div>
              <img 
                src="https://lh3.googleusercontent.com/gg-dl/AOI_d_-cWSk6tT9w_svrDvQG-4GwE7oG75zF7YLGXXaKTMj45efyNfj2awUctL3k0T44UUcXYNnpyr3xjlCvJ5XpmCjCXJbz-o0awSt6HR8X5HJbh0UIx7YksroTRVBmKNTIT3WpbTKIpa332Vnx_J1IOnLyQVWEGSKOf1l5gstBPO224vW3=s1024-rj" 
                alt="50kg Platform" 
                className="relative z-20 w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
              />
            </div>
            <div className="relative z-10 space-y-3 mb-10">
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">50KG SACK</h3>
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Package size={16} />
                <p className="font-bold text-xs uppercase tracking-[0.15em]">Standard Production</p>
              </div>
            </div>
            <div className="relative z-10 mt-auto w-full py-6 bg-slate-900 text-white group-hover:bg-indigo-600 rounded-[10px] font-black transition-all duration-300 flex items-center justify-center gap-3 text-sm tracking-[0.2em] shadow-lg shadow-slate-900/20">
              INITIALIZE LINE <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="mt-16 text-center">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="group inline-flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to System Overview
          </button>
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard entries={entries} />;
      case 'entry':
        return renderEntryFlow();
      case 'history':
        return <HistoryView entries={entries} onDelete={deleteEntry} onEdit={handleEditClick} />;
      case 'settings':
        return (
          <div className="bg-white p-12 rounded-[10px] border border-slate-200 animate-in zoom-in-95 duration-500 max-w-4xl mx-auto shadow-sm">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/3 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[10px] flex items-center justify-center mb-6 shadow-inner border border-indigo-100">
                  <Settings size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Settings</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8">
                  System configuration & user session management.
                </p>
              </div>
              
              <div className="md:w-2/3 space-y-8">
                <div className="bg-slate-50 p-6 rounded-[10px] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Session</h4>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-[10px] flex items-center justify-center font-black">
                        {currentOperator.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 uppercase tracking-tight">{currentOperator}</div>
                        <div className="text-[10px] text-emerald-600 font-black uppercase">Standard Access</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-rose-600 rounded-[10px] text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 transition-all"
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[10px] border border-slate-100 flex items-center justify-between text-white">
                  <div className="text-left">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Architecture</div>
                    <div className="text-sm font-black tracking-tight">Enterprise Stable Node</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Version</div>
                    <div className="text-sm font-mono font-black text-indigo-300">v1.0.2-rev4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard entries={entries} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={handleNavChange}>
      {renderView()}
    </Layout>
  );
};

export default App;
