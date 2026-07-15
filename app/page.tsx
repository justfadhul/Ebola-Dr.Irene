'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ScoreLegend } from '@/components/ScoreLegend';
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

  const tabs: [TabId, string, string, string][] = [
    ['response', '🚨', t('tabResponse'), t('subtabResponse')],
    ['summary', '🌐', t('tabSummary'), t('subtabSummary')],
    ['deepdive', '🏥', t('tabDeepDive'), t('subtabDeepDive')],
  ];
  const active = tabs.find(([id]) => id === activeTab)!;

  return (
    <div className="lg:flex bg-canvas">
      {/* Mobile backdrop — tap to dismiss the drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 h-screen overflow-y-auto bg-canvas">
        {/* Breadcrumb bar */}
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-surface/90 backdrop-blur border-b border-hairline px-3 sm:px-5 h-12">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden shrink-0 p-1.5 -ml-1 rounded-lg hover:bg-black/[0.04] text-ink"
            aria-label={t('openMenu')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-subtle hidden sm:inline">{t('appShort')}</span>
            <span className="text-subtle hidden sm:inline" aria-hidden="true">›</span>
            <span className="font-medium text-ink truncate">
              <span aria-hidden="true">{active[1]}</span> {active[2]}
            </span>
          </nav>
        </div>

        <div className="px-3 sm:px-5 py-4 sm:py-5">
          {/* Page header */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">{active[2]}</h1>
            <p className="text-sm text-subtle mt-0.5">{active[3]}</p>
          </div>

          {/* Attio-style segmented tabs */}
          <div
            className="flex gap-1 mb-5 overflow-x-auto border-b border-hairline"
            role="tablist"
            aria-label={t('appTitle')}
          >
            {tabs.map(([id, icon, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'border-accent text-ink'
                    : 'border-transparent text-subtle hover:text-ink'
                }`}
              >
                <span aria-hidden="true">{icon}</span> {label}
              </button>
            ))}
          </div>

          {!dataLoaded ? (
            <div className="card p-12 text-center text-subtle max-w-lg mx-auto mt-10">
              <div className="text-4xl mb-3" aria-hidden="true">📂</div>
              <p>{t('noData')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScoreLegend />
              {activeTab === 'response' ? (
                <OutbreakResponseTab />
              ) : activeTab === 'summary' ? (
                <SummaryViewTab />
              ) : (
                <FacilityDeepDiveTab />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
