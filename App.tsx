
import React, { useState, useEffect } from 'react';
import Layout from './components/ui/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import HistoryView from './components/HistoryView';
import ProgramView from './components/ProgramView';
import { useProductionData } from './hooks/useProductionData';
import { useMasterProgram } from './hooks/useMasterProgram';
import { ProductionEntry, PlatformType } from './types';
import { ChevronRight, Package, Settings } from 'lucide-react';

type ViewType = 'dashboard' | 'entry' | 'history' | 'settings' | 'program';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [editingEntry, setEditingEntry] = useState<ProductionEntry | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);

  const { entries, isLoading: isEntriesLoading, addEntry, updateEntry, deleteEntry, draft, saveDraft } =
    useProductionData();
    
  const { masterProgram, isLoading: isProgramLoading } = useMasterProgram();

  const handleEntrySubmit = (entryData: any) => {
    if (editingEntry) {
      updateEntry({ 
        ...entryData, 
        id: editingEntry.id, 
        submitted_at: editingEntry.submitted_at 
      });
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

  const isLoading = isEntriesLoading || isProgramLoading;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard entries={entries} isLoading={isLoading} />;

      case 'entry':
        if (editingEntry || selectedPlatform) {
          return (
            <EntryForm
              onSubmit={handleEntrySubmit}
              entries={entries}
              draft={selectedPlatform ? { ...draft, platform: selectedPlatform } : draft}
              onDraftChange={saveDraft}
              editingEntry={editingEntry}
              onCancelEdit={() => {
                setEditingEntry(null);
                setSelectedPlatform(null);
                setActiveView('history');
              }}
              masterProgram={masterProgram}
            />
          );
        }

        return (
          <div className="max-w-6xl mx-auto py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <button
                onClick={() => setSelectedPlatform(PlatformType.BIG_BAG)}
                className="bg-white rounded-[20px] border-4 p-12 shadow-xl flex flex-col items-center"
              >
                <Package size={80} />
                <h3 className="text-3xl font-black">BIG BAG</h3>
              </button>

              <button
                onClick={() => setSelectedPlatform(PlatformType.FIFTY_KG)}
                className="bg-white rounded-[20px] border-4 p-12 shadow-xl flex flex-col items-center"
              >
                <Package size={60} />
                <h3 className="text-3xl font-black">50KG SACK</h3>
              </button>
            </div>
          </div>
        );

      case 'history':
        return (
          <HistoryView
            entries={entries}
            onDelete={deleteEntry}
            onEdit={handleEditClick}
            isLoading={isLoading}
          />
        );

      case 'program':
        return <ProgramView entries={entries} masterProgram={masterProgram} />;

      case 'settings':
        return (
          <div className="bg-white p-12 rounded-[10px] text-center max-w-2xl mx-auto">
            <Settings size={48} className="mx-auto mb-8" />
            <h3 className="text-3xl font-black">System Settings</h3>
          </div>
        );

      default:
        return <Dashboard entries={entries} isLoading={isLoading} />;
    }
  };

  return <Layout activeView={activeView} setActiveView={setActiveView}>{renderView()}</Layout>;
};

export default App;
