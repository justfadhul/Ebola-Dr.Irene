'use client';

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

  const tabs: [TabId, string, string][] = [
    ['response', '🚨', t('tabResponse')],
    ['summary', '🌐', t('tabSummary')],
    ['deepdive', '🏥', t('tabDeepDive')],
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4">
          <nav className="flex gap-1">
            {tabs.map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
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

        <div className="p-4">
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
