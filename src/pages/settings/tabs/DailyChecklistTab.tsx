import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/common/Skeleton';
import {
  dashboardChecklistService,
  type ChecklistItem,
  type ChecklistModule,
  type ChecklistCreatePayload,
} from '@/services/dashboardChecklistService';
import type { ShiftType } from '@/types';

type SectionKey = 'wajib' | 'pagi' | 'siang' | 'malam';

const SECTION_META: Record<SectionKey, { title: string; subtitle: string; icon: React.FC<{ size?: number; className?: string }>; tone: string; iconBg: string; iconColor: string }> = {
  wajib: { title: 'Wajib di Setiap Shift', subtitle: 'Selalu tampil terlepas shift apa pun.',
           icon: AlertTriangle, tone: 'border-amber-200 bg-amber-50/50',
           iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
  pagi:  { title: 'Shift Pagi',  subtitle: 'Hanya tampil saat shift pagi (07:00 — 13:00).',
           icon: Sun,            tone: 'border-yellow-200 bg-yellow-50/50',
           iconBg: 'bg-yellow-100', iconColor: 'text-yellow-700' },
  siang: { title: 'Shift Siang', subtitle: 'Hanya tampil saat shift siang (13:00 — 19:00).',
           icon: Sunset,         tone: 'border-orange-200 bg-orange-50/50',
           iconBg: 'bg-orange-100', iconColor: 'text-orange-700' },
  malam: { title: 'Shift Malam', subtitle: 'Hanya tampil saat shift malam (19:00 — 07:00).',
           icon: Moon,           tone: 'border-indigo-200 bg-indigo-50/50',
           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-700' },
};

const SECTION_ORDER: SectionKey[] = ['wajib', 'pagi', 'siang', 'malam'];

/**
 * "Harian" tab content. Mirrors the original SettingsChecklistPage content
 * (4 sections × CRUD + reorder) — extracted to a sibling file so the parent
 * page can host a tab navigator for Monthly without becoming unwieldy.
 */
export const DailyChecklistTab: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [modules, setModules] = useState<ChecklistModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [addSection, setAddSection] = useState<SectionKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [its, mods] = await Promise.all([
        dashboardChecklistService.listItems(),
        dashboardChecklistService.listModules(),
      ]);
      setItems(its);
      setModules(mods);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat checklist harian. Coba refresh halaman.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleCreate = async (payload: ChecklistCreatePayload) => {
    try {
      await dashboardChecklistService.createItem(payload);
      await fetchAll();
      flashSuccess('Modul ditambahkan ke checklist.');
      setAddSection(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = (err.response.data as { message?: string })?.message ?? 'Gagal menambahkan modul.';
        setErrorMessage(msg);
      } else {
        setErrorMessage('Gagal menambahkan modul.');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await dashboardChecklistService.deleteItem(deleteTarget.id);
      await fetchAll();
      flashSuccess('Modul dihapus dari checklist.');
    } catch {
      setErrorMessage('Gagal menghapus modul.');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (item: ChecklistItem) => {
    setBusyId(item.id);
    try {
      await dashboardChecklistService.updateItem(item.id, { is_active: !item.is_active });
      await fetchAll();
      flashSuccess(item.is_active ? 'Modul dinonaktifkan.' : 'Modul diaktifkan kembali.');
    } catch {
      setErrorMessage('Gagal mengubah status modul.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (item: ChecklistItem, direction: -1 | 1) => {
    const peers = items
      .filter((i) => i.category === item.category && i.shift_type === item.shift_type)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const idx = peers.findIndex((p) => p.id === item.id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= peers.length) return;

    const reordered = [...peers];
    [reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
    const payload = reordered.map((p, i) => ({ id: p.id, sort_order: i + 1 }));

    setBusyId(item.id);
    try {
      await dashboardChecklistService.reorderItems(payload);
      await fetchAll();
    } catch {
      setErrorMessage('Gagal mengubah urutan.');
    } finally {
      setBusyId(null);
    }
  };

  const sections = useMemo(() => {
    const map: Record<SectionKey, ChecklistItem[]> = {
      wajib: [], pagi: [], siang: [], malam: [],
    };
    for (const item of items) {
      if (item.category === 'wajib') map.wajib.push(item);
      else if (item.shift_type) map[item.shift_type as SectionKey].push(item);
    }
    for (const key of SECTION_ORDER) {
      map[key].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3" role="alert">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-medium text-xs">Tutup</button>
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="space-y-5">
          {SECTION_ORDER.map((key) => (
            <SectionPanel
              key={key}
              sectionKey={key}
              items={sections[key]}
              busyId={busyId}
              onAdd={() => setAddSection(key)}
              onDelete={(i) => setDeleteTarget(i)}
              onToggleActive={handleToggleActive}
              onMove={handleMove}
            />
          ))}
        </div>
      )}

      {addSection && (
        <AddItemModal
          section={addSection}
          modules={modules}
          existingKeys={new Set(items
            .filter((i) =>
              addSection === 'wajib'
                ? i.category === 'wajib'
                : i.category === 'shift' && i.shift_type === addSection,
            )
            .map((i) => i.module_key))}
          onClose={() => setAddSection(null)}
          onSubmit={(moduleKey) => handleCreate({
            module_key: moduleKey,
            category: addSection === 'wajib' ? 'wajib' : 'shift',
            shift_type: addSection === 'wajib' ? null : (addSection as ShiftType),
          })}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Hapus modul dari checklist?"
        message={deleteTarget ? `"${deleteTarget.label}" akan dihapus dari pengingat ${sectionLabelForItem(deleteTarget)}.` : ''}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
};

function sectionLabelForItem(item: ChecklistItem): string {
  if (item.category === 'wajib') return 'Wajib di Setiap Shift';
  return `Shift ${item.shift_type ?? '—'}`;
}

// ─── Section panel ──────────────────────────────────────────────────────────

interface SectionPanelProps {
  sectionKey: SectionKey;
  items: ChecklistItem[];
  busyId: number | null;
  onAdd: () => void;
  onDelete: (item: ChecklistItem) => void;
  onToggleActive: (item: ChecklistItem) => void;
  onMove: (item: ChecklistItem, direction: -1 | 1) => void;
}

const SectionPanel: React.FC<SectionPanelProps> = ({
  sectionKey, items, busyId, onAdd, onDelete, onToggleActive, onMove,
}) => {
  const meta = SECTION_META[sectionKey];
  const Icon = meta.icon;

  return (
    <section className={`rounded-2xl border ${meta.tone} overflow-hidden`}>
      <header className="px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-9 w-9 rounded-lg ${meta.iconBg} flex items-center justify-center shrink-0`}>
            <Icon size={18} className={meta.iconColor} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{meta.title}</h2>
            <p className="text-xs text-slate-500 truncate">{meta.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">{items.length} modul</span>
          <Button size="sm" onClick={onAdd} className="gap-1.5">
            <Plus size={14} /> Tambah
          </Button>
        </div>
      </header>

      <div className="bg-white border-t border-slate-200">
        {items.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-slate-400 italic">
            Belum ada modul. Klik <strong>Tambah</strong> untuk menambahkan.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const isBusy = busyId === item.id;
              const isFirst = idx === 0;
              const isLast  = idx === items.length - 1;
              return (
                <li key={item.id} className={`flex items-center gap-3 px-5 py-3 ${!item.is_active ? 'bg-slate-50/60' : ''}`}>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst || isBusy}
                      onClick={() => onMove(item, -1)}
                      className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Naik"
                      aria-label="Naik"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || isBusy}
                      onClick={() => onMove(item, 1)}
                      className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Turun"
                      aria-label="Turun"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    {item.module_missing ? (
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            <span className="font-mono text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{item.module_key}</span>
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Modul ini tidak terdaftar lagi di registry. Sebaiknya dihapus.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm font-medium ${item.is_active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-bold ${item.division === 'CNSD' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.division}
                          </span>
                          <span className="text-slate-400">{item.group}</span>
                          {!item.is_active && (
                            <span className="inline-flex items-center rounded bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                              Nonaktif
                            </span>
                          )}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onToggleActive(item)}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${item.is_active
                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                      title={item.is_active ? 'Nonaktifkan (sembunyikan dari dashboard)' : 'Aktifkan kembali'}
                      aria-label={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {item.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Hapus modul"
                      aria-label="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

// ─── Add modal ──────────────────────────────────────────────────────────────

interface AddItemModalProps {
  section: SectionKey;
  modules: ChecklistModule[];
  existingKeys: Set<string>;
  onClose: () => void;
  onSubmit: (moduleKey: string) => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ section, modules, existingKeys, onClose, onSubmit }) => {
  const [selected, setSelected] = useState<string>('');

  const grouped = useMemo(() => {
    const map: Record<string, ChecklistModule[]> = {};
    for (const m of modules) {
      if (!map[m.group]) map[m.group] = [];
      map[m.group].push(m);
    }
    return map;
  }, [modules]);

  const sectionTitle = SECTION_META[section].title;

  return (
    <Modal isOpen={true} onClose={onClose} title={`Tambah modul ke ${sectionTitle}`} size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Pilih modul dari daftar di bawah. Modul yang sudah ada di section ini ditandai dan tidak bisa dipilih.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Modul</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">— Pilih modul —</option>
            {Object.entries(grouped).map(([group, mods]) => (
              <optgroup key={group} label={group}>
                {mods.map((m) => {
                  const dupe = existingKeys.has(m.key);
                  return (
                    <option key={m.key} value={m.key} disabled={dupe}>
                      [{m.division}] {m.label}{dupe ? ' — sudah ditambahkan' : ''}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => selected && onSubmit(selected)} disabled={!selected}>
            Tambahkan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
