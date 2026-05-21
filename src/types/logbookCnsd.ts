/**
 * Type definitions for Logbook CNSD (CNS & Automation) module.
 * Mirror dari logbookTfp.ts dengan tambahan field measurement (value_*).
 */

export type ShiftKey = 'pagi' | 'siang' | 'malam';

export interface CnsdEquipment {
  id: number;
  category: string;
  name: string;
  is_measurement: boolean;
  unit: string | null;
  order: number;
}

export interface ManagerOnDutyEntry {
  shift: ShiftKey;
  name: string;
  user_id: number;
}

export interface LogbookCnsdSummary {
  id: number;
  date: string;
  is_signed_pagi: boolean;
  is_signed_siang: boolean;
  is_signed_malam: boolean;
  is_fully_signed: boolean;
  signed_count: number;
  notes_count: number;
  created_by_name: string | null;
  created_at: string;
  managers_on_duty: ManagerOnDutyEntry[];
}

export interface LogbookCnsdItem {
  id: number;
  equipment_id: number;
  equipment_name: string;
  equipment_order: number;
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
  shift: ShiftKey;
  time: string | null;
  activity: string;
}

export interface PersonnelShiftInfo {
  roster_available: boolean;
  manager: { name: string; user_id: number } | null;
  supervisor: { name: string; user_id: number } | null;
  technicians: Array<{ name: string; user_id: number }>;
}

export interface ManagerShiftSignature {
  signature: string | null;
  signed_by_id: number | null;
  signed_by_name: string | null;
  signed_by_role: string | null;
  signed_at: string | null;
}

export interface LogbookCnsdDetail {
  id: number;
  date: string;
  is_signed_pagi: boolean;
  is_signed_siang: boolean;
  is_signed_malam: boolean;
  is_fully_signed: boolean;
  manager_signatures: Record<ShiftKey, ManagerShiftSignature>;
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
