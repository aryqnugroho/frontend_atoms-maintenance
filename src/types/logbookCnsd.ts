/**
 * Type definitions for Logbook CNSD (CNS & Automation) module.
 */

export interface CnsdEquipment {
  id: number;
  category: string;
  name: string;
  is_measurement: boolean;
  unit: string | null;
  order: number;
}

export interface ManagerOnDutyEntry {
  shift: 'pagi' | 'siang' | 'malam';
  name: string;
  user_id: number;
}

export interface LogbookCnsdSummary {
  id: number;
  date: string;
  is_signed: boolean;
  manager_signed_by_name: string | null;
  manager_signed_at: string | null;
  notes_count: number;
  created_by_name: string | null;
  created_at: string;
  /** Manager Teknik on duty, sorted pagi → siang → malam. */
  managers_on_duty: ManagerOnDutyEntry[];
}

export interface LogbookCnsdItem {
  id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_order: number;
  /** true → item uses numeric value input (e.g. °C) instead of S/US toggle. */
  is_measurement: boolean;
  unit: string | null;
  status_pagi: 'S' | 'US' | null;
  status_siang: 'S' | 'US' | null;
  status_malam: 'S' | 'US' | null;
  value_pagi: string | null;
  value_siang: string | null;
  value_malam: string | null;
}

export interface LogbookCnsdNote {
  id: number;
  shift: 'pagi' | 'siang' | 'malam';
  time: string | null;
  activity: string;
}

export interface PersonnelShiftInfo {
  roster_available: boolean;
  manager: { name: string; user_id: number } | null;
  supervisor: { name: string; user_id: number } | null;
  technicians: Array<{ name: string; user_id: number }>;
}

export interface LogbookCnsdDetail {
  id: number;
  date: string;
  is_signed: boolean;
  manager_signature: string | null;
  manager_signed_by_id: number | null;
  manager_signed_by_name: string | null;
  manager_signed_by_role: string | null;
  manager_signed_at: string | null;
  created_by: { id: number; name: string } | null;
  created_at: string;
  items_by_category: Record<string, LogbookCnsdItem[]>;
  notes: LogbookCnsdNote[];
  personnel_on_duty?: {
    pagi: PersonnelShiftInfo;
    siang: PersonnelShiftInfo;
    malam: PersonnelShiftInfo;
  };
}
