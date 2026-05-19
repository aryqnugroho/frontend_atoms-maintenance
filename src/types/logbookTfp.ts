/**
 * Type definitions for Logbook TFP module.
 */

export interface TfpEquipment {
  id: number;
  category: string;
  name: string;
  order: number;
}

export interface ManagerOnDutyEntry {
  shift: 'pagi' | 'siang' | 'malam';
  name: string;
  user_id: number;
}

export interface LogbookTfpSummary {
  id: number;
  date: string;
  is_signed: boolean;
  manager_signed_by_name: string | null;
  manager_signed_at: string | null;
  notes_count: number;
  created_by_name: string | null;
  created_at: string;
  /** All Manager Teknik on duty for the logbook date, sorted pagi → siang → malam. */
  managers_on_duty: ManagerOnDutyEntry[];
}

export interface LogbookTfpItem {
  id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_order: number;
  status_pagi: 'S' | 'US' | null;
  status_siang: 'S' | 'US' | null;
  status_malam: 'S' | 'US' | null;
}

export interface LogbookTfpNote {
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

export interface LogbookTfpDetail {
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
  items_by_category: Record<string, LogbookTfpItem[]>;
  notes: LogbookTfpNote[];
  /** Populated on GET detail — from rostering */
  personnel_on_duty?: {
    pagi: PersonnelShiftInfo;
    siang: PersonnelShiftInfo;
    malam: PersonnelShiftInfo;
  };
}
