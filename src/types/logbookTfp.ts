/**
 * Type definitions for Logbook TFP module.
 *
 * Signatures: 3 slot per shift (pagi/siang/malam). Each shift's Manager
 * Teknik can only sign their own slot.
 */

export type ShiftKey = 'pagi' | 'siang' | 'malam';

export interface TfpEquipment {
  id: number;
  category: string;
  name: string;
  order: number;
}

export interface ManagerOnDutyEntry {
  shift: ShiftKey;
  name: string;
  user_id: number;
}

export interface LogbookTfpSummary {
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

export interface LogbookTfpDetail {
  id: number;
  date: string;
  is_signed_pagi: boolean;
  is_signed_siang: boolean;
  is_signed_malam: boolean;
  is_fully_signed: boolean;
  manager_signatures: Record<ShiftKey, ManagerShiftSignature>;
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
