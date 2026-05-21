import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { groundingReportService } from '@/services/groundingReportService';
import type { GroundingReportDetail } from '@/types/grounding';

const formatDate = (v?: string | null): string => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (v?: string | null): string => {
  if (!v) return '';
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const val = (v: string | null | undefined): string => (v == null || v === '' ? '' : v);

export const GroundingReportPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<GroundingReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await groundingReportService.getRecord(Number(id));
        setRecord(data);
      } catch {
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchRecord();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-600">Laporan tidak ditemukan atau gagal memuat data.</p>
        <Button variant="outline" onClick={() => navigate('/grounding')}>Kembali</Button>
      </div>
    );
  }

  const visualItems = record.items.filter((it) => it.section_name === 'VISUAL');
  const measurementItems = record.items.filter((it) => it.section_name === 'PENGUKURAN');

  return (
    <div className="min-h-screen w-full bg-slate-100 p-4 text-black print:bg-white print:p-0">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 6mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hide { display: none !important; }
          }
          .gc-table { border-collapse: collapse; width: 100%; }
          .gc-cell { border: 1px solid #000 !important; }
          .gc-cell-nb { border-left: 1px solid #000 !important; border-right: 1px solid #000 !important; border-bottom: 1px solid #000 !important; }
        `}
      </style>

      {/* Toolbar */}
      <div className="print-hide mx-auto mb-4 flex max-w-[297mm] items-center justify-between">
        <Button variant="outline" className="gap-2" onClick={() => navigate(`/grounding/reports/${record.id}`)}>
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 Landscape sheet */}
      <table className="gc-table" style={{ maxWidth: '297mm', margin: '0 auto', backgroundColor: '#fff', fontFamily: 'sans-serif', fontSize: '10px', color: '#000' }}>
        <tbody>
          {/* Header row: Logo + Perum LPPNPI left | Title center */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '30%', padding: '8px 12px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/assets/icon/logoairnav.svg" alt="AirNav" style={{ height: '40px', width: '40px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontSize: '11px', fontWeight: 800 }}>AirNav Indonesia</div>
                          <div style={{ fontSize: '8px', fontWeight: 600, color: '#4b5563' }}>Teknik Fasilitas Penunjang</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ width: '70%', textAlign: 'center', verticalAlign: 'middle', padding: '8px 12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Checklist Fasilitas dan Peralatan
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
                        Pemeliharaan Sistem Penangkal Petir dan Sistem Pembumian
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Info row */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', padding: '6px 12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2px 4px' }}>
                        <span style={{ fontWeight: 700 }}>No. Laporan</span><span>: {record.report_number}</span>
                        <span style={{ fontWeight: 700 }}>Tanggal</span><span>: {formatDate(record.date)}</span>
                        <span style={{ fontWeight: 700 }}>Jam</span><span>: {record.time_filled ?? '-'}</span>
                      </div>
                    </td>
                    <td style={{ width: '50%', padding: '6px 12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '2px 4px' }}>
                        <span style={{ fontWeight: 700 }}>Kantor Unit Kerja</span><span>: {record.work_unit}</span>
                        <span style={{ fontWeight: 700 }}>Nama Peralatan</span><span>: {record.equipment_name}</span>
                        <span style={{ fontWeight: 700 }}>Lokasi Peralatan</span><span>: {record.equipment_location}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* VISUAL section header */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ backgroundColor: '#f3f4f6', padding: '3px 12px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              VISUAL
            </td>
          </tr>
          {/* VISUAL column headers */}
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td className="gc-cell" style={{ width: '5%', padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>No</td>
            <td className="gc-cell" style={{ width: '40%', padding: '3px 6px', fontWeight: 700 }}>Item Pemeriksaan</td>
            <td className="gc-cell" style={{ width: '18%', padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>Ketersediaan</td>
            <td className="gc-cell" style={{ width: '14%', padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>Kondisi</td>
            <td className="gc-cell" style={{ width: '23%', padding: '3px 6px', fontWeight: 700 }}>Catatan / Keterangan</td>
          </tr>
          {/* VISUAL rows */}
          {visualItems.map((item) => (
            <tr key={item.id}>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center' }}>{item.item_number}</td>
              <td className="gc-cell" style={{ padding: '2px 6px' }}>{item.item_name}</td>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center' }}>{val(item.availability)}</td>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center' }}>{val(item.condition)}</td>
              <td className="gc-cell" style={{ padding: '2px 6px' }}>{val(item.notes)}</td>
            </tr>
          ))}

          {/* PENGUKURAN section header */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ backgroundColor: '#f3f4f6', padding: '3px 12px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              PENGUKURAN
            </td>
          </tr>
          {/* PENGUKURAN column headers */}
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <td className="gc-cell" style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>No</td>
            <td className="gc-cell" style={{ padding: '3px 6px', fontWeight: 700 }}>Item Pemeriksaan</td>
            <td className="gc-cell" style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>Standard</td>
            <td className="gc-cell" style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700 }}>Kondisi</td>
            <td className="gc-cell" style={{ padding: '3px 6px', fontWeight: 700 }}>Catatan / Keterangan</td>
          </tr>
          {/* PENGUKURAN rows */}
          {measurementItems.map((item) => (
            <tr key={item.id}>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center' }}>{item.item_number}</td>
              <td className="gc-cell" style={{ padding: '2px 6px' }}>{item.item_name}</td>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center', fontFamily: 'monospace' }}>{val(item.standard)}</td>
              <td className="gc-cell" style={{ padding: '2px 4px', textAlign: 'center' }}>{val(item.condition)}</td>
              <td className="gc-cell" style={{ padding: '2px 6px' }}>{val(item.notes)}</td>
            </tr>
          ))}

          {/* Hari / Tanggal / Jam row */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '33%', padding: '4px 8px', borderRight: '1px solid #000' }}>
                      <span style={{ fontWeight: 700 }}>Hari</span> : {record.day_name ?? '-'}
                    </td>
                    <td style={{ width: '34%', padding: '4px 8px', borderRight: '1px solid #000' }}>
                      <span style={{ fontWeight: 700 }}>Tanggal</span> : {formatDate(record.date)}
                    </td>
                    <td style={{ width: '33%', padding: '4px 8px' }}>
                      <span style={{ fontWeight: 700 }}>Jam</span> : {record.time_filled ?? '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Signature row: PELAKSANA TEKNISI | SUPERVISOR | MANAGER TEKNIK */}
          <tr>
            <td className="gc-cell" colSpan={5} style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <tbody>
                  <tr>
                    {/* PELAKSANA TEKNISI — simple list, no nested table */}
                    <td style={{ width: '44%', padding: '6px 10px', verticalAlign: 'top', borderRight: '1px solid #000' }}>
                      <div style={{ textAlign: 'center', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', fontSize: '10px' }}>
                        PELAKSANA TEKNISI
                      </div>
                      {record.technicians.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {record.technicians.map((tech, idx) => (
                            <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '14px', textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</span>
                              <span style={{ flex: 1, borderBottom: '1px dotted #64748b', paddingBottom: '1px' }}>{tech.technician_name}</span>
                              <span style={{ width: '80px', textAlign: 'center', flexShrink: 0 }}>
                                {tech.signature ? (
                                  <img src={tech.signature} alt={`TTD ${tech.technician_name}`} style={{ maxHeight: '28px', maxWidth: '70px', objectFit: 'contain', display: 'inline-block' }} />
                                ) : (
                                  <span style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic' }}>Belum TTD</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', padding: '8px 0' }}>Tidak ada teknisi</div>
                      )}
                    </td>

                    {/* SUPERVISOR */}
                    <td style={{ width: '28%', padding: '6px 10px', verticalAlign: 'top', textAlign: 'center', borderRight: '1px solid #000' }}>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', fontSize: '10px' }}>SUPERVISOR</div>
                      <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {record.supervisor ? (
                          record.supervisor.signature ? (
                            <img src={record.supervisor.signature} alt="TTD Supervisor" style={{ maxHeight: '44px', maxWidth: '100px', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: '80px', height: '40px', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '8px', color: '#9ca3af' }}>Belum TTD</span>
                            </div>
                          )
                        ) : (
                          <span style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic' }}>Tidak ada</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px' }}>{record.supervisor?.name ?? '—'}</div>
                      {record.supervisor?.signed_at && <div style={{ fontSize: '8px', color: '#6b7280' }}>{formatDateTime(record.supervisor.signed_at)}</div>}
                    </td>

                    {/* MANAGER TEKNIK */}
                    <td style={{ width: '28%', padding: '6px 10px', verticalAlign: 'top', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', fontSize: '10px' }}>MANAGER TEKNIK</div>
                      <div style={{ minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {record.manager ? (
                          record.manager.signature ? (
                            <img src={record.manager.signature} alt="TTD Manager" style={{ maxHeight: '44px', maxWidth: '100px', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ width: '80px', height: '40px', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '8px', color: '#9ca3af' }}>Belum TTD</span>
                            </div>
                          )
                        ) : (
                          <span style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic' }}>Tidak ada</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px' }}>{record.manager?.name ?? '—'}</div>
                      {record.manager?.signed_at && <div style={{ fontSize: '8px', color: '#6b7280' }}>{formatDateTime(record.manager.signed_at)}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
