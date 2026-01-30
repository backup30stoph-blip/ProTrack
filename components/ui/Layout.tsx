
import React, { useState } from 'react';
import { LayoutDashboard, PlusCircle, History, Settings, BarChart3, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'dashboard' | 'entry' | 'history' | 'settings';
  setActiveView: (view: 'dashboard' | 'entry' | 'history' | 'settings') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'New Entry', icon: PlusCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside 
        className={`hidden md:flex bg-indigo-900 text-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-indigo-800 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-6 flex items-center justify-between border-b border-indigo-800/50 h-[73px]`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg shrink-0">
              <BarChart3 className="w-8 h-8 text-emerald-400" />
            </div>
            {!isCollapsed && (
              <h1 className="font-bold text-xl tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
                ProTrack
              </h1>
            )}
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-indigo-800 rounded-lg text-indigo-300 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center transition-all duration-200 group ${
                isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3 justify-start gap-3'
              } rounded-[10px] ${
                activeView === item.id 
                  ? 'bg-indigo-700 text-white shadow-lg' 
                  : 'text-indigo-100 hover:bg-indigo-800/50 hover:text-white'
              }`}
            >
              <item.icon 
                size={20} 
                className={`shrink-0 transition-transform ${
                  activeView === item.id ? 'text-white' : 'text-indigo-300 group-hover:scale-110'
                }`} 
              />
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-200">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className={`p-6 text-xs text-indigo-300 border-t border-indigo-800/50 overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {!isCollapsed && <span className="whitespace-nowrap">&copy; 2026 ProTrack v1.0.2</span>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex items-center justify-between h-[73px]">
          <div className="flex items-center gap-2 md:hidden">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="font-bold text-lg text-slate-800">ProTrack</h1>
          </div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider hidden md:block">
            {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-[10px] bg-emerald-500 animate-pulse"></div>
             <span className="text-sm font-medium text-slate-600">System Ready</span>
          </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around md:hidden z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeView === item.id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
