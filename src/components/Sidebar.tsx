'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useStore, type Language } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { generateTestData } from '@/lib/testData';
import { parseCsv, autoSuggestMapping, type ColumnMapping } from '@/lib/csv';
import { fetchKoboAssessments, KoboError, type KoboErrorCode } from '@/lib/kobo';
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
  // Custom mapping: hold the file until the user confirms the column mapping.
  const [pending, setPending] = useState<{ text: string; headers: string[]; name: string } | null>(
    null,
  );
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const commit = (text: string, m: ColumnMapping, name: string) => {
    const { rows, errors } = parseCsv(text, m);
    if (rows.length === 0) {
      setStatus(t('statusNoRows'));
      return false;
    }
    loadData(rows, name);
    setStatus(
      `✅ ${rows.length} ${t('assessmentsLoaded')}${errors.length ? ` (${errors.length} ${t('warnings')})` : ''}.`,
    );
    return true;
  };

  const onFile = (file: File, custom: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (custom) {
        // Show the mapping panel with auto-suggested guesses; don't parse yet.
        const headers = Papa.parse(text, { header: true, preview: 1 }).meta.fields ?? [];
        setMapping(autoSuggestMapping(headers));
        setPending({ text, headers, name: file.name });
        setStatus('');
      } else {
        setPending(null);
        commit(text, {}, file.name);
      }
    };
    reader.readAsText(file);
  };

  const applyMapping = () => {
    if (pending && commit(pending.text, mapping, pending.name)) setPending(null);
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

      {mode === 'custom' && pending && (
        <CustomMappingPanel
          headers={pending.headers}
          mapping={mapping}
          setMapping={setMapping}
          onApply={applyMapping}
        />
      )}

      {mode === 'kobo' && <KoboSection onLoaded={setStatus} />}

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

function KoboSection({ onLoaded }: { onLoaded: (s: string) => void }) {
  const t = useT();
  const loadData = useStore((s) => s.loadData);
  const [serverUrl, setServerUrl] = useState('');
  const [assetUid, setAssetUid] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  const errMsg = (code: KoboErrorCode) =>
    ({
      missing: t('koboErrMissing'),
      auth: t('koboErrAuth'),
      network: t('koboErrNetwork'),
      server: t('koboErrServer'),
      empty: t('koboErrEmpty'),
    })[code];

  const fetchNow = async () => {
    setBusy(true);
    setProgress('');
    onLoaded('');
    try {
      const rows = await fetchKoboAssessments({ serverUrl, assetUid, token }, (n, total) =>
        setProgress(`${n}/${total}`),
      );
      loadData(rows, `Kobo: ${assetUid.trim()}`);
      onLoaded(`✅ ${rows.length} ${t('assessmentsLoaded')}.`);
    } catch (e) {
      onLoaded(errMsg(e instanceof KoboError ? e.code : 'server'));
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    type: 'text' | 'password' = 'text',
  ) => (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        className="mt-1 w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
      />
    </label>
  );

  return (
    <div className="space-y-2">
      {field(t('koboServerUrl'), serverUrl, setServerUrl)}
      {field(t('koboAssetUid'), assetUid, setAssetUid)}
      {field(t('koboToken'), token, setToken, 'password')}
      <button
        type="button"
        onClick={fetchNow}
        disabled={busy}
        className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? `${t('koboFetching')} ${progress}` : `⬇️ ${t('koboFetch')}`}
      </button>
      <p className="text-[11px] text-slate-500 leading-snug">{t('koboCorsNote')}</p>
    </div>
  );
}

type StdKey = Exclude<keyof ColumnMapping, 'domains'>;

function CustomMappingPanel({
  headers,
  mapping,
  setMapping,
  onApply,
}: {
  headers: string[];
  mapping: ColumnMapping;
  setMapping: (m: ColumnMapping) => void;
  onApply: () => void;
}) {
  const t = useT();
  const [showDomains, setShowDomains] = useState(false);

  const fields: { key: StdKey; label: string }[] = [
    { key: 'facilityName', label: t('mapFacilityName') },
    { key: 'reportingDate', label: t('mapReportingDate') },
    { key: 'facilityId', label: t('mapFacilityId') },
    { key: 'province', label: t('province') },
    { key: 'district', label: t('district') },
    { key: 'subdistrict', label: t('subdistrict') },
    { key: 'facilityLevel', label: t('facilityLevel') },
    { key: 'totalScore', label: t('totalScore') },
    { key: 'latitude', label: t('mapLatitude') },
    { key: 'longitude', label: t('mapLongitude') },
  ];

  const setField = (key: StdKey, val: string) =>
    setMapping({ ...mapping, [key]: val || undefined });
  const setDomain = (id: string, val: string) => {
    const domains = { ...(mapping.domains ?? {}) };
    if (val) domains[id] = val;
    else delete domains[id];
    setMapping({ ...mapping, domains });
  };

  const canApply = !!mapping.facilityName && !!mapping.reportingDate;

  const sel = (value: string | undefined, onChange: (v: string) => void) => (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 w-full border border-slate-300 rounded px-1.5 py-1 text-xs"
    >
      <option value="">{t('colNone')}</option>
      {headers.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2 space-y-2">
      <div className="text-xs font-semibold text-slate-700">{t('mapTitle')}</div>
      <p className="text-[11px] text-slate-500 leading-snug">{t('mapHelp')}</p>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[11px] text-slate-600">{f.label}</span>
            {sel(mapping[f.key], (v) => setField(f.key, v))}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowDomains((s) => !s)}
        className="text-[11px] text-slate-500 hover:text-slate-700 underline"
      >
        {showDomains ? '▲' : '▼'} {t('domainColumns')} ({DOMAINS.length})
      </button>
      {showDomains && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {DOMAINS.map((d) => (
            <label key={d.id} className="block">
              <span className="text-[11px] text-slate-600">
                {d.order}. {d.label}
              </span>
              {sel(mapping.domains?.[d.id], (v) => setDomain(d.id, v))}
            </label>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        className="w-full bg-slate-800 text-white rounded py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-40"
      >
        {t('applyMapping')}
      </button>
    </div>
  );
}

function ViewControlsSection() {
  const t = useT();
  const { data, filters, setFilters } = useStore();
  const [facilitySearch, setFacilitySearch] = useState('');

  const inGeo = (d: { province: string; district: string; subdistrict: string }) =>
    (!filters.provinces.length || filters.provinces.includes(d.province)) &&
    (!filters.districts.length || filters.districts.includes(d.district)) &&
    (!filters.subdistricts.length || filters.subdistricts.includes(d.subdistrict));

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
  const subdistricts = useMemo(
    () =>
      distinct(
        data
          .filter(
            (d) =>
              (!filters.provinces.length || filters.provinces.includes(d.province)) &&
              (!filters.districts.length || filters.districts.includes(d.district)),
          )
          .map((d) => d.subdistrict),
      ).sort(),
    [data, filters.provinces, filters.districts],
  );

  // One entry per facility (respecting the geography filters above), for the
  // exclude list. Checked = included; unchecking adds the id to excludedFacilityIds.
  const facilities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const d of data) if (inGeo(d) && !seen.has(d.facilityId)) seen.set(d.facilityId, d.facilityName);
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters.provinces, filters.districts, filters.subdistricts]);

  const shownFacilities = facilities.filter((f) =>
    f.name.toLowerCase().includes(facilitySearch.toLowerCase()),
  );

  const toggleIn = (
    key: 'provinces' | 'districts' | 'subdistricts' | 'facilityLevels',
    v: string,
  ) => {
    const cur = filters[key];
    setFilters({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as never);
  };

  const toggleFacility = (id: string) => {
    const cur = filters.excludedFacilityIds;
    setFilters({
      excludedFacilityIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
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

      {subdistricts.length > 0 && (
        <fieldset>
          <legend className="text-xs font-medium text-slate-600 mb-1">{t('subdistrict')}</legend>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {subdistricts.map((p) => (
              <label key={p} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.subdistricts.includes(p)}
                  onChange={() => toggleIn('subdistricts', p)}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
      )}

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

      <fieldset>
        <legend className="text-xs font-medium text-slate-600 mb-1">
          {t('facilitiesFilter')}
          {filters.excludedFacilityIds.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ excludedFacilityIds: [] })}
              className="ml-2 text-slate-400 hover:text-slate-600 underline"
            >
              {t('reset')}
            </button>
          )}
        </legend>
        <input
          type="search"
          value={facilitySearch}
          onChange={(e) => setFacilitySearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="mb-1 w-full border border-slate-300 rounded px-2 py-1 text-xs"
        />
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {shownFacilities.map((f) => (
            <label key={f.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!filters.excludedFacilityIds.includes(f.id)}
                onChange={() => toggleFacility(f.id)}
              />
              <span className="truncate">{f.name}</span>
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
