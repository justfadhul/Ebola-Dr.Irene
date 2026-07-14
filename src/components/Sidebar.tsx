'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useStore, type Language } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { generateTestData } from '@/lib/testData';
import { parseCsv, autoSuggestMapping } from '@/lib/csv';
import { DOMAINS, FACILITY_LEVELS } from '@/lib/domains';

type Section = 'data' | 'view' | 'outbreak';

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState<Record<Section, boolean>>({
    data: true,
    view: false,
    outbreak: false,
  });
  const toggle = (s: Section) => setOpen((o) => ({ ...o, [s]: !o[s] }));

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-80 max-w-[85vw] shrink-0 border-r border-slate-200 bg-white h-screen overflow-y-auto transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}
    >
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="font-bold text-slate-800 text-sm leading-snug">
          🦠 {t('appTitle')}
        </div>
        {/* Close button — mobile drawer only */}
        <button
          onClick={onClose}
          className="lg:hidden shrink-0 p-1 rounded hover:bg-slate-100 text-slate-500"
          aria-label={t('closeMenu')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <SectionHeader
        icon="📂"
        title={t('dataSource')}
        open={open.data}
        onClick={() => toggle('data')}
      />
      {open.data && <DataSourceSection />}
      <SectionHeader
        icon="🔍"
        title={t('viewControls')}
        open={open.view}
        onClick={() => toggle('view')}
      />
      {open.view && <ViewControlsSection />}
      <SectionHeader
        icon="🚨"
        title={t('outbreakSettings')}
        open={open.outbreak}
        onClick={() => toggle('outbreak')}
      />
      {open.outbreak && <OutbreakSettingsSection />}
    </aside>
  );
}

function SectionHeader({
  icon,
  title,
  open,
  onClick,
}: {
  icon: string;
  title: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 text-left font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100"
    >
      <span>
        {icon} {title}
      </span>
      <span className="text-slate-400">{open ? '▲' : '▼'}</span>
    </button>
  );
}

function DataSourceSection() {
  const t = useT();
  const { language, setLanguage, loadData, dataSourceLabel, dataLoaded, clearData } =
    useStore();
  const [mode, setMode] = useState<'standard' | 'custom' | 'kobo'>('standard');
  const [status, setStatus] = useState<string>('');

  const onFile = (file: File, custom: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const mapping = custom
        ? autoSuggestMapping(Papa.parse(text, { header: true, preview: 1 }).meta.fields ?? [])
        : {};
      const { rows, errors } = parseCsv(text, mapping);
      if (rows.length === 0) {
        setStatus(t('statusNoRows'));
        return;
      }
      loadData(rows, file.name);
      setStatus(
        `✅ ${rows.length} ${t('assessmentsLoaded')}${errors.length ? ` (${errors.length} ${t('warnings')})` : ''}.`,
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-3 space-y-4 border-b border-slate-200">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">🌐 {t('language')}</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
      </label>

      <div className="space-y-1.5 text-sm">
        {(
          [
            ['standard', `📄 ${t('csvStandard')}`],
            ['custom', `🔧 ${t('csvCustom')}`],
            ['kobo', `🌐 ${t('koboApi')}`],
          ] as const
        ).map(([val, label]) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === val}
              onChange={() => setMode(val)}
            />
            {label}
          </label>
        ))}
      </div>

      {mode !== 'kobo' && (
        <label className="block">
          <span className="text-xs font-medium text-slate-600">{t('uploadCsv')}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], mode === 'custom')}
            className="mt-1 w-full text-xs"
          />
        </label>
      )}

      {mode === 'kobo' && (
        <p className="text-xs text-slate-500">{t('koboPlanned')}</p>
      )}

      <button
        onClick={() => {
          loadData(generateTestData(), 'Test Data (fabricated)');
          setStatus(t('testDataLoaded'));
        }}
        className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-700"
      >
        🧪 {t('loadTestData')}
      </button>

      {status && <p className="text-xs text-slate-600">{status}</p>}
      {dataLoaded && (
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <span>📊 {dataSourceLabel}</span>
          <button onClick={clearData} className="text-red-600 hover:underline">
            {t('clearData')}
          </button>
        </div>
      )}
    </div>
  );
}

function distinct<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function ViewControlsSection() {
  const t = useT();
  const { data, filters, setFilters } = useStore();

  const provinces = useMemo(() => distinct(data.map((d) => d.province)).sort(), [data]);
  const districts = useMemo(
    () =>
      distinct(
        data
          .filter((d) => !filters.provinces.length || filters.provinces.includes(d.province))
          .map((d) => d.district),
      ).sort(),
    [data, filters.provinces],
  );

  const toggleIn = (key: 'provinces' | 'districts' | 'facilityLevels', v: string) => {
    const cur = filters[key];
    setFilters({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as never);
  };

  return (
    <div className="p-3 space-y-4 border-b border-slate-200 text-sm">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">{t('includeAfter')}</span>
        <input
          type="date"
          value={filters.includeAfter ?? ''}
          onChange={(e) => setFilters({ includeAfter: e.target.value || undefined })}
          className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5"
        />
      </label>

      <fieldset>
        <legend className="text-xs font-medium text-slate-600 mb-1">{t('province')}</legend>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {provinces.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.provinces.includes(p)}
                onChange={() => toggleIn('provinces', p)}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-slate-600 mb-1">{t('district')}</legend>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {districts.map((p) => (
            <label key={p} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.districts.includes(p)}
                onChange={() => toggleIn('districts', p)}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-slate-600 mb-1">{t('facilityLevel')}</legend>
        <div className="flex gap-3">
          {FACILITY_LEVELS.map((lv) => (
            <label key={lv} className="flex items-center gap-1.5 capitalize">
              <input
                type="checkbox"
                checked={filters.facilityLevels.includes(lv)}
                onChange={() => toggleIn('facilityLevels', lv)}
              />
              {lv}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 font-medium text-slate-700">
          <input
            type="checkbox"
            checked={filters.useCustomBaseline}
            onChange={(e) => setFilters({ useCustomBaseline: e.target.checked })}
          />
          {t('customBaseline')}
        </label>
        {filters.useCustomBaseline && (
          <div className="mt-2 space-y-2">
            <input
              type="date"
              value={filters.baselineAnchorDate ?? ''}
              onChange={(e) => setFilters({ baselineAnchorDate: e.target.value || undefined })}
              className="w-full border border-slate-300 rounded px-2 py-1.5"
            />
            <label className="block text-xs text-slate-600">
              {t('weeksBuffer')} {filters.baselineBufferWeeks}
              <input
                type="range"
                min={0}
                max={12}
                value={filters.baselineBufferWeeks}
                onChange={(e) => setFilters({ baselineBufferWeeks: Number(e.target.value) })}
                className="w-full"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function OutbreakSettingsSection() {
  const t = useT();
  const { outbreakDomains, setOutbreakDomains } = useStore();
  const toggle = (id: string) =>
    setOutbreakDomains(
      outbreakDomains.includes(id)
        ? outbreakDomains.filter((x) => x !== id)
        : [...outbreakDomains, id],
    );
  return (
    <div className="p-3 border-b border-slate-200 text-sm">
      <p className="text-xs text-slate-500 mb-2">{t('outbreakDomainsHelp')}</p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {DOMAINS.map((d) => (
          <label key={d.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={outbreakDomains.includes(d.id)}
              onChange={() => toggle(d.id)}
            />
            {d.order}. {d.label}
          </label>
        ))}
      </div>
    </div>
  );
}
