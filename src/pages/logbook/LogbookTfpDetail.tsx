import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Lock,
  PenLine,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { SignatureDisplay } from '@/components/shared/SignatureDisplay';
import { useAuth } from '@/hooks/useAuth';
import { logbookTfpService } from '@/services/logbookTfpService';
import type { LogbookTfpDetail as LogbookTfpDetailType, LogbookTfpItem, PersonnelShiftInfo } from '@/types/logbookTfp';

// ─── Helpers ──────────────────────────────────────────────
const formatDateLong = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// ─── Status Toggle ─────────────────────────────────────────
type ShiftStatus = 'S' | 'US' | null;

interface StatusToggleProps {
  value: ShiftStatus;
  onChange: (v: ShiftStatus) => void;
  disabled?: boolean;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ value, onChange, disabled }) => {
  const cycle = () => {
    if (disabled) return;
    if (value === null) onChange('S');
    else if (value === 'S') onChange('US');
    else onChange(null);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      title={value === null ? 'Klik untuk set S' : value === 'S' ? 'Klik untuk set U/S' : 'Klik untuk reset'}
      className={`
        inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-bold transition-all duration-150 border
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${value === 'S'
          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
          : value === 'US'
          ? 'bg-red-500 border-red-600 text-white shadow-sm'
          : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
        }
      `}
    >
      {value === 'S' ? 'S' : value === 'US' ? 'U/S' : '—'}
    </button>
  );
};

// ─── Accordion Category ────────────────────────────────────
interface CategoryAccordionProps {
  category: string;
  items: LogbookTfpItem[];
  localItems: Record<number, { status_pagi: ShiftStatus; status_siang: ShiftStatus; status_malam: ShiftStatus }>;
  onStatusChange: (itemId: number, shift: 'status_pagi' | 'status_siang' | 'status_malam', value: ShiftStatus) => void;
  disabled: boolean;
  defaultOpen?: boolean;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  category,
  items,
  localItems,
  onStatusChange,
  disabled,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{category}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{items.length} item</span>
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* Items */}
      {open && (
        <div className="divide-y divide-gray-100">
          {/* Sub-header */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 bg-gray-50/50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Nama Peralatan</span>
            <div className="flex gap-2">
              {(['Pagi', 'Siang', 'Malam'] as const).map((s) => (
                <span key={s} className="w-12 text-center text-[10px] font-semibold text-slate-400 uppercase">{s}</span>
              ))}
            </div>
          </div>

          {items.map((item) => {
            const local = localItems[item.id] ?? {
              status_pagi: item.status_pagi,
              status_siang: item.status_siang,
              status_malam: item.status_malam,
            };
            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2 items-center px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                <span className="text-sm text-slate-700 leading-tight">{item.equipment_name}</span>
                <div className="flex gap-2">
                  <StatusToggle
                    value={local.status_pagi}
                    onChange={(v) => onStatusChange(item.id, 'status_pagi', v)}
                    disabled={disabled}
                  />
                  <StatusToggle
                    value={local.status_siang}
                    onChange={(v) => onStatusChange(item.id, 'status_siang', v)}
                    disabled={disabled}
                  />
                  <StatusToggle
                    value={local.status_malam}
                    onChange={(v) => onStatusChange(item.id, 'status_malam', v)}
                    disabled={disabled}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Personnel Block ───────────────────────────────────────
const PersonnelBlock: React.FC<{ label: string; info: PersonnelShiftInfo | undefined }> = ({ label, info }) => {
  if (!info) return null;
  const all = [
    ...(info.manager ? [{ name: info.manager.name, role: 'Manager Teknik' }] : []),
    ...(info.supervisor ? [{ name: info.supervisor.name, role: 'Supervisor TFP' }] : []),
    ...info.technicians.map((t) => ({ name: t.name, role: 'Teknisi TFP' })),
  ];

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      {!info.roster_available ? (
        <p className="text-xs text-slate-400 italic">Roster belum dipublish</p>
      ) : all.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Tidak ada personel</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {all.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Detail Page ──────────────────────────────────────
export const LogbookTfpDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [record, setRecord] = useState<LogbookTfpDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showSignCanvas, setShowSignCanvas] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local item state (S/US toggles)
  const [localItems, setLocalItems] = useState<
    Record<number, { status_pagi: ShiftStatus; status_siang: ShiftStatus; status_malam: ShiftStatus }>
  >({});

  // Note form state
  const [noteShift, setNoteShift] = useState<'pagi' | 'siang' | 'malam'>('pagi');
  const [noteTime, setNoteTime] = useState(getCurrentTime());
  const [noteActivity, setNoteActivity] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await logbookTfpService.getLogbook(Number(id));
      setRecord(data);
      // Initialize local items from API data
      const init: typeof localItems = {};
      Object.values(data.items_by_category).flat().forEach((item) => {
        init[item.id] = {
          status_pagi: item.status_pagi,
          status_siang: item.status_siang,
          status_malam: item.status_malam,
        };
      });
      setLocalItems(init);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Gagal memuat data logbook.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadRecord(); }, [loadRecord]);

  const isSigned = !!record?.is_signed;
  const canSign = user?.role === 'Manager Teknik';

  const handleStatusChange = (
    itemId: number,
    shift: 'status_pagi' | 'status_siang' | 'status_malam',
    value: ShiftStatus,
  ) => {
    setLocalItems((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [shift]: value },
    }));
  };

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const items = Object.entries(localItems).map(([idStr, s]) => ({
        id: Number(idStr),
        status_pagi: s.status_pagi,
        status_siang: s.status_siang,
        status_malam: s.status_malam,
      }));
      const updated = await logbookTfpService.updateItems(record.id, items);
      setRecord(updated);
      setSuccessMessage('Perubahan berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan perubahan.');
      } else {
        setErrorMessage('Gagal menyimpan perubahan.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !noteActivity.trim()) return;
    setIsAddingNote(true);
    setErrorMessage(null);
    try {
      const updated = await logbookTfpService.addNote(record.id, {
        shift: noteShift,
        time: noteTime || null,
        activity: noteActivity.trim(),
      });
      setRecord(updated);
      setNoteActivity('');
      setNoteTime(getCurrentTime());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menambah catatan.');
      } else {
        setErrorMessage('Gagal menambah catatan.');
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!record || !confirm('Hapus catatan ini?')) return;
    try {
      const updated = await logbookTfpService.deleteNote(record.id, noteId);
      setRecord(updated);
    } catch {
      setErrorMessage('Gagal menghapus catatan.');
    }
  };

  const handleSign = async (base64: string) => {
    if (!record) return;
    setIsSigning(true);
    setErrorMessage(null);
    try {
      const updated = await logbookTfpService.signLogbook(record.id, base64);
      setRecord(updated);
      setSuccessMessage('Logbook berhasil ditandatangani.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setErrorMessage(data.message ?? 'Gagal menyimpan tanda tangan.');
      } else {
        setErrorMessage('Gagal menyimpan tanda tangan.');
      }
    } finally {
      setIsSigning(false);
      setShowSignCanvas(false);
    }
  };

  // ── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-red-600">{errorMessage ?? 'Logbook tidak ditemukan.'}</p>
        <Button onClick={() => navigate('/logbooks/tfp')} className="mt-4">Kembali</Button>
      </div>
    );
  }

  const categories = Object.keys(record.items_by_category);

  // Group notes by shift for timeline display
  const notesByShift = {
    pagi: record.notes.filter((n) => n.shift === 'pagi'),
    siang: record.notes.filter((n) => n.shift === 'siang'),
    malam: record.notes.filter((n) => n.shift === 'malam'),
  };

  const shiftColors = {
    pagi: 'bg-amber-50 border-amber-200 text-amber-700',
    siang: 'bg-sky-50 border-sky-200 text-sky-700',
    malam: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate('/logbooks')} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
          <ArrowLeft size={14} /> Logbook
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/logbooks/tfp')} className="hover:text-slate-700 transition-colors">TFP</button>
        <span>/</span>
        <span className="text-slate-700 font-medium">{record.date}</span>
      </div>

      {/* Page Header */}
      <PageHeader
        icon={Activity}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        title={`Logbook TFP — ${formatDateLong(record.date)}`}
        subtitle="Log Book Fasilitas Penunjang"
        actions={
          <div className="flex items-center gap-2">
            {isSigned && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5">
                <CheckCircle2 size={13} /> Sudah TTD
              </span>
            )}
            {!isSigned && (
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={15} /> Simpan Perubahan
              </Button>
            )}
          </div>
        }
      />

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      {/* Personnel On Duty */}
      {record.personnel_on_duty && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700">Personel On Duty</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PersonnelBlock label="Shift Pagi (07:00–13:00)" info={record.personnel_on_duty.pagi} />
            <PersonnelBlock label="Shift Siang (13:00–19:00)" info={record.personnel_on_duty.siang} />
            <PersonnelBlock label="Shift Malam (19:00–07:00)" info={record.personnel_on_duty.malam} />
          </div>
        </div>
      )}

      {/* ── Split View ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[7fr_5fr] gap-5">

        {/* ── LEFT: Checklist Peralatan ─────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Status Peralatan</h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" /> S = Serviceable</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500" /> U/S = Unserviceable</span>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-slate-400 text-sm">
              Tidak ada data peralatan.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <CategoryAccordion
                  key={cat}
                  category={cat}
                  items={record.items_by_category[cat]}
                  localItems={localItems}
                  onStatusChange={handleStatusChange}
                  disabled={isSigned}
                  defaultOpen={idx === 0}
                />
              ))}
            </div>
          )}

          {/* Save button (bottom of left panel) */}
          {!isSigned && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
                <Save size={15} /> Simpan Perubahan
              </Button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Timeline Catatan ───────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Catatan Kegiatan</h3>

          {/* Add note form */}
          {!isSigned && (
            <form onSubmit={handleAddNote} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Shift selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Shift</label>
                  <select
                    value={noteShift}
                    onChange={(e) => setNoteShift(e.target.value as 'pagi' | 'siang' | 'malam')}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="pagi">Pagi</option>
                    <option value="siang">Siang</option>
                    <option value="malam">Malam</option>
                  </select>
                </div>
                {/* Time input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Jam</label>
                  <input
                    type="time"
                    value={noteTime}
                    onChange={(e) => setNoteTime(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
              {/* Activity textarea */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Kegiatan / Catatan</label>
                <textarea
                  value={noteActivity}
                  onChange={(e) => setNoteActivity(e.target.value)}
                  rows={3}
                  placeholder="Tulis kegiatan atau catatan operasional..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" isLoading={isAddingNote} disabled={!noteActivity.trim()} size="sm" className="gap-1.5">
                  <Plus size={14} /> Tambah Catatan
                </Button>
              </div>
            </form>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {record.notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Clock size={24} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Belum ada catatan kegiatan.</p>
                {!isSigned && <p className="text-xs text-slate-300 mt-1">Tambahkan catatan menggunakan form di atas.</p>}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {(['pagi', 'siang', 'malam'] as const).map((shift) => {
                  const notes = notesByShift[shift];
                  if (notes.length === 0) return null;
                  return (
                    <div key={shift}>
                      {/* Shift header */}
                      <div className={`px-4 py-2 border-b border-gray-100 ${shiftColors[shift]}`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider capitalize">
                          Shift {shift}
                        </span>
                      </div>
                      {/* Notes */}
                      {notes.map((note) => (
                        <div key={note.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 group">
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center shrink-0 mt-1">
                            <div className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-emerald-400 transition-colors" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {note.time && (
                                <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {note.time}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 leading-snug">{note.activity}</p>
                          </div>
                          {/* Delete */}
                          {!isSigned && (
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                              title="Hapus catatan"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Signature Block ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Tanda Tangan Manager Teknik</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tanda tangan bersifat permanen dan tidak dapat diubah setelah disimpan.
            </p>
          </div>
          {isSigned && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1">
              <CheckCircle2 size={13} /> Sudah TTD
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Signature display */}
          <div className="w-full sm:w-64 shrink-0">
            <SignatureDisplay
              signerName={record.manager_signed_by_name ?? 'Manager Teknik'}
              signedAt={record.manager_signed_at}
              signatureImage={record.manager_signature}
              role="Manager Teknik"
              isPending={!isSigned}
              isNotRequired={false}
            />
          </div>

          {/* Sign button or locked note */}
          <div className="flex-1">
            {isSigned ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-700">
                  Ditandatangani oleh: {record.manager_signed_by_name}
                </p>
                {record.manager_signed_at && (
                  <p className="text-xs text-slate-500">
                    {new Date(record.manager_signed_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            ) : canSign ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Klik tombol di bawah untuk menandatangani logbook ini sebagai Manager Teknik.
                </p>
                <Button
                  onClick={() => setShowSignCanvas(true)}
                  className="gap-2"
                >
                  <PenLine size={15} /> Tanda Tangan
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <Lock size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-500">
                  Hanya dapat ditandatangani oleh <span className="font-semibold text-slate-700">Manager Teknik</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature Canvas Modal */}
      <SignatureCanvas
        isOpen={showSignCanvas}
        onClose={() => { if (!isSigning) setShowSignCanvas(false); }}
        onConfirm={(base64) => void handleSign(base64)}
        signerName={user?.name ?? 'Manager Teknik'}
        role="Manager Teknik"
        isLoading={isSigning}
      />
    </div>
  );
};
