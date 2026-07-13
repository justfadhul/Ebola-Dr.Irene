'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { OutbreakResponseTab } from '@/components/tabs/OutbreakResponseTab';
import { SummaryViewTab } from '@/components/tabs/SummaryViewTab';
import { FacilityDeepDiveTab } from '@/components/tabs/FacilityDeepDiveTab';
import { useStore, type TabId } from '@/store/useStore';
import { useT } from '@/lib/i18n';

export default function Home() {
  const t = useT();
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const dataLoaded = useStore((s) => s.dataLoaded);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: [TabId, string, string][] = [
    ['response', '🚨', t('tabResponse')],
    ['summary', '🌐', t('tabSummary')],
    ['deepdive', '🏥', t('tabDeepDive')],
  ];

  return (
    <div className="lg:flex">
      {/* Mobile backdrop — tap to dismiss the drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 h-screen overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-stretch bg-white border-b border-slate-200 px-2 sm:px-4">
          {/* Hamburger opens the sidebar drawer — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden shrink-0 self-center p-1.5 mr-1 rounded hover:bg-slate-100 text-slate-700"
            aria-label={t('openMenu')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === id
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4">
          {!dataLoaded ? (
            <div className="card p-10 text-center text-slate-500 max-w-xl mx-auto mt-10">
              <div className="text-4xl mb-3">📂</div>
              <p>{t('noData')}</p>
            </div>
          ) : activeTab === 'response' ? (
            <OutbreakResponseTab />
          ) : activeTab === 'summary' ? (
            <SummaryViewTab />
          ) : (
            <FacilityDeepDiveTab />
          )}
        </div>
      </main>
    </div>
  );
}
