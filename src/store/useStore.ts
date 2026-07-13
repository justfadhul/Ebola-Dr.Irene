'use client';

import { create } from 'zustand';
import type { Assessment, TimeAxis } from '@/lib/types';
import { DEFAULT_FILTERS, type Filters } from '@/lib/selectors';
import { DOMAIN_IDS } from '@/lib/domains';

export type Language = 'en' | 'fr' | 'es';
export type TabId = 'response' | 'summary' | 'deepdive';

interface AppState {
  language: Language;
  activeTab: TabId;
  data: Assessment[];
  dataLoaded: boolean;
  dataSourceLabel: string;
  filters: Filters;
  timeAxis: TimeAxis;
  /** Domain subset used by Outbreak Response calculations. */
  outbreakDomains: string[];
  /** Facility Deep Dive selection. */
  selectedFacilityId: string | null;

  setLanguage: (l: Language) => void;
  setActiveTab: (t: TabId) => void;
  loadData: (rows: Assessment[], label: string) => void;
  clearData: () => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  setTimeAxis: (t: TimeAxis) => void;
  setOutbreakDomains: (ids: string[]) => void;
  setSelectedFacility: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  language: 'en',
  activeTab: 'response',
  data: [],
  dataLoaded: false,
  dataSourceLabel: '',
  filters: DEFAULT_FILTERS,
  timeAxis: 'reportingDate',
  outbreakDomains: DOMAIN_IDS,
  selectedFacilityId: null,

  setLanguage: (language) => set({ language }),
  setActiveTab: (activeTab) => set({ activeTab }),
  loadData: (rows, label) =>
    set({
      data: rows,
      dataLoaded: rows.length > 0,
      dataSourceLabel: label,
      filters: DEFAULT_FILTERS,
      outbreakDomains: DOMAIN_IDS,
      selectedFacilityId: null,
    }),
  clearData: () =>
    set({ data: [], dataLoaded: false, dataSourceLabel: '', selectedFacilityId: null }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setTimeAxis: (timeAxis) => set({ timeAxis }),
  setOutbreakDomains: (outbreakDomains) => set({ outbreakDomains }),
  setSelectedFacility: (selectedFacilityId) => set({ selectedFacilityId }),
}));
