import React, { useState } from 'react';
import { Header } from './components/Header';
import { LiveSimulator } from './components/LiveSimulator';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { PhysicsVisualizer } from './components/PhysicsVisualizer';
import { ConfigModal } from './components/ConfigModal';

export function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'benchmark' | 'physics' | 'config'>('simulator');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'simulator' && <LiveSimulator />}
        {activeTab === 'benchmark' && <BenchmarkRunner />}
        {activeTab === 'physics' && <PhysicsVisualizer />}
        {activeTab === 'config' && <ConfigModal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Drift-Sense | SEM Metrology & Sub-Pixel Localization | SEMICON India 2026</span>
          <span className="font-mono text-[11px] text-slate-600">Normalized Cross-Correlation & Center-Bias Algorithm</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
