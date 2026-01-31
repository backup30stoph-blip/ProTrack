
import React, { useState } from 'react';
import { LayoutDashboard, PlusCircle, History, Settings, BarChart3, PanelLeftClose, PanelLeftOpen, ClipboardList } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'dashboard' | 'entry' | 'history' | 'settings' | 'program';
  setActiveView: (view: 'dashboard' | 'entry' | 'history' | 'settings' | 'program') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'New Entry', icon: PlusCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'program', label: 'Program', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Sidebar with Cosumar Gradient */}
      <aside 
        className={`hidden md:flex bg-gradient-to-b from-cosumar-blue to-cosumar-dark text-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shadow-2xl z-50 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className={`p-6 flex items-center justify-between border-b border-white/10 h-[73px]`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-cosumar-gold rounded-xl shrink-0">
              <BarChart3 className="w-6 h-6 text-cosumar-blue" />
            </div>
            {!isCollapsed && (
              <h1 className="font-black text-xl tracking-tighter animate-in fade-in slide-in-from-left-2 duration-300">
                PRO<span className="text-cosumar-gold">TRACK</span>
              </h1>
            )}
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center transition-all duration-300 group ${
                isCollapsed ? 'justify-center px-0 py-4' : 'px-5 py-3.5 justify-start gap-4'
              } rounded-xl ${
                activeView === item.id 
                  ? 'bg-cosumar-gold text-cosumar-blue shadow-lg scale-[1.02] font-black' 
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon 
                size={22} 
                className={`shrink-0 transition-transform ${activeView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              {!isCollapsed && (
                <span className="text-sm tracking-wide animate-in fade-in slide-in-from-left-1 duration-200">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className={`p-8 text-[10px] font-bold text-white/40 border-t border-white/10 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {!isCollapsed && <span className="uppercase tracking-widest">Powered by Cosumar Logic</span>}
        </div>
      </aside>

      {/* Main Content with soft header */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-30 flex items-center justify-between h-[73px]">
          <div className="flex items-center gap-3 md:hidden">
            <div className="p-2 bg-cosumar-blue rounded-lg">
              <BarChart3 className="w-5 h-5 text-cosumar-gold" />
            </div>
            <h1 className="font-black text-xl text-cosumar-blue">PRO<span className="text-cosumar-gold">TRACK</span></h1>
          </div>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] hidden md:block">
            SYSTEM // {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Status</span>
                <span className="text-xs font-bold text-cosumar-blue">Operational</span>
             </div>
             <div className="h-2.5 w-2.5 rounded-full bg-cosumar-gold shadow-[0_0_10px_#ffcc00] animate-pulse"></div>
          </div>
        </header>
        
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-cosumar-blue border-t border-white/10 px-6 py-4 flex justify-around md:hidden z-40 shadow-[0_-10px_25px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1.5 transition-all ${
              activeView === item.id ? 'text-cosumar-gold scale-110' : 'text-white/60'
            }`}
          >
            <item.icon size={22} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
