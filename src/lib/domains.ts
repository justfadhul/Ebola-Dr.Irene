// IPC domains from the WHO IPC Rapid Assessment Tool (RAT).
// Schema is derived from the User Guide's test-data description (~18 domains).
// When the canonical RAT export column names are available, align `csvKey`
// with the real column headers so "Standard CSV" upload works without mapping.

export interface DomainDef {
  id: string;
  order: number;
  /** Default English short label shown in charts/tables. */
  label: string;
  /** Column key expected in a "standard" CSV upload. */
  csvKey: string;
}

export const DOMAINS: DomainDef[] = [
  { id: 'ipc_committee', order: 1, label: 'IPC Committee', csvKey: 'domain_ipc_committee' },
  { id: 'staff_training', order: 2, label: 'Staff Training', csvKey: 'domain_staff_training' },
  { id: 'hand_hygiene', order: 3, label: 'Hand Hygiene', csvKey: 'domain_hand_hygiene' },
  { id: 'screening_triage', order: 4, label: 'Screening / Triage', csvKey: 'domain_screening_triage' },
  { id: 'isolation', order: 5, label: 'Isolation', csvKey: 'domain_isolation' },
  { id: 'ppe', order: 6, label: 'PPE', csvKey: 'domain_ppe' },
  { id: 'injection_safety', order: 7, label: 'Injection Safety', csvKey: 'domain_injection_safety' },
  { id: 'env_cleaning', order: 8, label: 'Env. Cleaning', csvKey: 'domain_env_cleaning' },
  { id: 'decontamination', order: 9, label: 'Decontamination', csvKey: 'domain_decontamination' },
  { id: 'post_exposure', order: 10, label: 'Post-exposure', csvKey: 'domain_post_exposure' },
  { id: 'patient_mgmt', order: 11, label: 'Patient Mgmt', csvKey: 'domain_patient_mgmt' },
  { id: 'patient_placement', order: 12, label: 'Patient Placement', csvKey: 'domain_patient_placement' },
  { id: 'sanitation', order: 13, label: 'Sanitation', csvKey: 'domain_sanitation' },
  { id: 'water_supply', order: 14, label: 'Water Supply', csvKey: 'domain_water_supply' },
  { id: 'waste_solid', order: 15, label: 'Waste Mgmt (Solid)', csvKey: 'domain_waste_solid' },
  { id: 'waste_liquid', order: 16, label: 'Waste Mgmt (Liquid)', csvKey: 'domain_waste_liquid' },
  { id: 'dead_body_mgmt', order: 17, label: 'Dead Body Mgmt', csvKey: 'domain_dead_body_mgmt' },
];

export const DOMAIN_IDS = DOMAINS.map((d) => d.id);

export const domainById = (id: string): DomainDef | undefined =>
  DOMAINS.find((d) => d.id === id);

export const FACILITY_LEVELS = ['primary', 'secondary', 'tertiary'] as const;
export type FacilityLevel = (typeof FACILITY_LEVELS)[number];
