import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/common/Skeleton';
import {
  dashboardChecklistService,
  type ChecklistModule,
} from '@/services/dashboardChecklistService';
import {
  dashboardMonthlyService,
  type MonthlyTarget,
} from '@/services/dashboardMonthlyService';

/**
 * "Bulanan" tab — manage per-equipment monthly minimum-count targets.
 *
 * Use-case: "Ground Check VHF wajib dilakukan minimal 2 kali setiap bulan."
 * Per row the MT/SV sets `min_count` and toggles active. The dashboard +
 * monitor cards count actual completed forms per current month and show
 * progress.
 *
 * No section-grouping (unlike daily) — monthly targets are a single flat
 * list, ordered by user-controlled sort_order.
 */
export const MonthlyChecklistTab: React.FC = () => {
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [modules, setModules] = useState<ChecklistModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonthlyTarget | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ts, mods] = await Promise.all([
        dashboardMonthlyService.listTargets(),
        dashboardChecklistService.listModules(),
      ]);
      setTargets(ts);
      setModules(mods);
      setErrorMessage(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMessage('Sesi habis. Silakan login ulang.');
      } else {
        setErrorMessage('Gagal memuat target bulanan. Coba refresh halaman.');
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

  const handleCreate = async (moduleKey: string, minCount: number) => {
    try {
      await dashboardMonthlyService.createTarget({ module_key: moduleKey, min_count: minCount });
      await fetchAll();
      flashSuccess('Target bulanan ditambahkan.');
      setShowAdd(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = (err.response.data as { message?: string })?.message ?? 'Gagal menambahkan target.';
        setErrorMessage(msg);
      } else {
        setErrorMessage('Gagal menambahkan target.');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await dashboardMonthlyService.deleteTarget(deleteTarget.id);
      await fetchAll();
      flashSuccess('Target dihapus.');
    } catch {
      setErrorMessage('Gagal menghapus target.');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (t: MonthlyTarget) => {
    setBusyId(t.id);
    try {
      await dashboardMonthlyService.updateTarget(t.id, { is_active: !t.is_active });
      await fetchAll();
      flashSuccess(t.is_active ? 'Target dinonaktifkan.' : 'Target diaktifkan kembali.');
    } catch {
      setErrorMessage('Gagal mengubah status target.');
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Stepper for min_count (clamped 1..99). Persists to server immediately
   * — no separate save button — to match the rest of the page's UX.
   */
  const handleMinCountChange = async (t: MonthlyTarget, delta: number) => {
    const next = Math.max(1, Math.min(99, t.min_count + delta));
    if (next === t.min_count) return;
    setBusyId(t.id);
    try {
      await dashboardMonthlyService.updateTarget(t.id, { min_count: next });
      await fetchAll();
    } catch {
      setErrorMessage('Gagal mengubah jumlah minimum.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (t: MonthlyTarget, direction: -1 | 1) => {
    const sorted = [...targets].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const idx = sorted.findIndex((x) => x.id === t.id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= sorted.length) return;

    [sorted[idx], sorted[targetIdx]] = [sorted[targetIdx], sorted[idx]];
    const payload = sorted.map((p, i) => ({ id: p.id, sort_order: i + 1 }));

    setBusyId(t.id);
    try {
      await dashboardMonthlyService.reorderTargets(payload);
      await fetchAll();
    } catch {
      setErrorMessage('Gagal mengubah urutan.');
    } finally {
      setBusyId(null);
    }
  };

  const existingKeys = useMemo(() => new Set(targets.map((t) => t.module_key)), [targets]);

  const sortedTargets = useMemo(
    () => [...targets].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [targets],
  );

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

      <section className="rounded-2xl border border-rose-200 bg-rose-50/40 overflow-hidden">
        <header className="px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <Calendar size={18} className="text-rose-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Target Pengecekan Bulanan</h2>
              <p className="text-xs text-slate-500 truncate">
                Tetapkan minimum jumlah pengecekan per bulan untuk setiap peralatan.
                Hitungan didasarkan pada form yang sudah <strong>completed</strong> (tanda tangan lengkap).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">{targets.length} target</span>
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
              <Plus size={14} /> Tambah
            </Button>
          </div>
        </header>

        <div className="bg-white border-t border-rose-200">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sortedTargets.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-500">Belum ada target bulanan</p>
              <p className="text-xs mt-1">
                Klik <strong>Tambah</strong> untuk menetapkan minimum pengecekan per bulan
                (contoh: Ground Check VHF minimum 2× per bulan).
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedTargets.map((t, idx) => {
                const isBusy = busyId === t.id;
                const isFirst = idx === 0;
                const isLast = idx === sortedTargets.length - 1;
                return (
                  <li key={t.id} className={`flex items-center gap-3 px-5 py-3 ${!t.is_active ? 'bg-slate-50/60' : ''}`}>
                    {/* Move */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={isFirst || isBusy}
                        onClick={() => handleMove(t, -1)}
                        className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Naik"
                        aria-label="Naik"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isLast || isBusy}
                        onClick={() => handleMove(t, 1)}
                        className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Turun"
                        aria-label="Turun"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Equipment info */}
                    <div className="flex-1 min-w-0">
                      {t.module_missing ? (
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              <span className="font-mono text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{t.module_key}</span>
                            </p>
                            <p className="text-[11px] text-amber-700">
                              Modul tidak terdaftar lagi. Sebaiknya dihapus.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`text-sm font-medium ${t.is_active ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                            {t.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-bold ${t.division === 'CNSD' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {t.division}
                            </span>
                            <span className="text-slate-400">{t.group}</span>
                            {!t.is_active && (
                              <span className="inline-flex items-center rounded bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                                Nonaktif
                              </span>
                            )}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Min-count stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mr-1">
                        Min/bulan
                      </span>
                      <button
                        type="button"
                        disabled={isBusy || t.min_count <= 1}
                        onClick={() => handleMinCountChange(t, -1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Kurangi"
                        aria-label="Kurangi minimum"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-md bg-rose-100 text-rose-800 text-sm font-bold tabular-nums">
                        {t.min_count}
                      </span>
                      <button
                        type="button"
                        disabled={isBusy || t.min_count >= 99}
                        onClick={() => handleMinCountChange(t, 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Tambah"
                        aria-label="Tambah minimum"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleActive(t)}
                        className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${t.is_active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                        title={t.is_active ? 'Nonaktifkan' : 'Aktifkan kembali'}
                        aria-label={t.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {t.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Hapus target"
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

      {showAdd && (
        <AddTargetModal
          modules={modules}
          existingKeys={existingKeys}
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Hapus target bulanan?"
        message={deleteTarget ? `"${deleteTarget.label}" akan dihapus dari target bulanan. Riwayat form tidak terpengaruh.` : ''}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="danger"
      />
    </div>
  );
};

// ─── Add target modal ───────────────────────────────────────────────────────

interface AddTargetModalProps {
  modules: ChecklistModule[];
  existingKeys: Set<string>;
  onClose: () => void;
  onSubmit: (moduleKey: string, minCount: number) => void;
}

const AddTargetModal: React.FC<AddTargetModalProps> = ({ modules, existingKeys, onClose, onSubmit }) => {
  const [selected, setSelected] = useState<string>('');
  const [minCount, setMinCount] = useState<number>(2);

  const grouped = useMemo(() => {
    const map: Record<string, ChecklistModule[]> = {};
    for (const m of modules) {
      if (!map[m.group]) map[m.group] = [];
      map[m.group].push(m);
    }
    return map;
  }, [modules]);

  const valid = selected && minCount >= 1 && minCount <= 99;

  return (
    <Modal isOpen={true} onClose={onClose} title="Tambah target bulanan" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Pilih peralatan dan tetapkan minimum jumlah pengecekan per bulan.
          Form yang sudah ditandatangani lengkap (<em>completed</em>) akan dihitung.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peralatan</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">— Pilih peralatan —</option>
            {Object.entries(grouped).map(([group, mods]) => (
              <optgroup key={group} label={group}>
                {mods.map((m) => {
                  const dupe = existingKeys.has(m.key);
                  return (
                    <option key={m.key} value={m.key} disabled={dupe}>
                      [{m.division}] {m.label}{dupe ? ' — sudah jadi target' : ''}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minimum per bulan</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinCount((n) => Math.max(1, n - 1))}
              className="h-9 w-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Kurangi"
            >
              <Minus size={16} className="mx-auto" />
            </button>
            <input
              type="number"
              min={1}
              max={99}
              value={minCount}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setMinCount(Math.max(1, Math.min(99, n)));
              }}
              className="w-20 h-9 px-3 text-center text-sm font-semibold rounded-md border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setMinCount((n) => Math.min(99, n + 1))}
              className="h-9 w-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Tambah"
            >
              <Plus size={16} className="mx-auto" />
            </button>
            <span className="text-xs text-slate-500">kali / bulan</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => valid && onSubmit(selected, minCount)} disabled={!valid}>
            Tambahkan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
