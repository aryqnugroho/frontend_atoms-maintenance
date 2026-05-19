import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdLocalizerMeterService } from '@/services/cnsdLocalizerMeterService';
import type { CnsdLocalizerMeterRecordDetail, CnsdLocalizerMeterItem } from '@/types/cnsdLocalizer';

const formatDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return d; }
};

const formatSignedAt = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

const val = (v: string | null | undefined) => v ?? '';

const ResultCell: React.FC<{ value: string | null | undefined }> = ({ value }) => {
  if (!value) return <span style={{ color: '#ccc', fontSize: '9px' }}>—</span>;
  const isGood = value === 'Normal' || value === '√';
  const isBad  = value === 'Alrm' || value === '-' || value === '–';
  return (
    <span style={{
      fontSize: '9px', fontWeight: 600, padding: '1px 4px', borderRadius: '3px',
      background: isGood ? '#d1fae5' : isBad ? '#fee2e2' : 'transparent',
      color: isGood ? '#065f46' : isBad ? '#991b1b' : '#1e293b',
    }}>{value}</span>
  );
};

export const CnsdLocalizerMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CnsdLocalizerMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    cnsdLocalizerMeterService.getRecord(Number(id))
      .then((data) => { setRecord(data); setIsLoading(false); })
      .catch(() => { setError('Gagal memuat data form Localizer.'); setIsLoading(false); });
  }, [id]);

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div style={{ width: 32, height: 32, border: '3px solid #0ea5e9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  if (error || !record) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><p style={{ color: '#dc2626' }}>{error ?? 'Form tidak ditemukan.'}</p></div>;

  // Build groups for section A
  const sectionAItems = record.items.filter((it) => it.section_code === 'A');
  const sectionBItems = record.items.filter((it) => it.section_code === 'B');

  const groups: Map<string, { header: CnsdLocalizerMeterItem | null; rows: CnsdLocalizerMeterItem[] }> = new Map();
  for (const item of sectionAItems) {
    const key = `${item.group_number}-${item.group_name}`;
    if (!groups.has(key)) groups.set(key, { header: null, rows: [] });
    const g = groups.get(key)!;
    if (item.is_header) g.header = item; else g.rows.push(item);
  }

  const technicians = record.technicians;
  const maxTechRows = Math.max(technicians.length, 5);

  const tdBorder: React.CSSProperties = { border: '1px solid black', padding: '2px 4px' };
  const thBorder: React.CSSProperties = { border: '1px solid black', padding: '3px 4px', textAlign: 'center' };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { background: white !important; }
          .print-hide { display: none !important; }
          tr, td { page-break-inside: avoid; }
        }
        body { font-family: Arial, sans-serif; }
      `}</style>

      {/* Toolbar */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 pt-4">
        <Button variant="outline" onClick={() => navigate(`/cnsd/localizer-meter/${record.id}`)} className="gap-2">
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 Document */}
      <div style={{ margin: '0 auto', background: 'white', color: 'black', width: '210mm', minHeight: '297mm', padding: '8mm 10mm', fontSize: '9px', fontFamily: 'Arial, sans-serif' }}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ width: '120px', verticalAlign: 'middle', paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/assets/icon/logoairnav.svg" alt="AirNav Indonesia" style={{ height: '40px', width: 'auto' }} />
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a56db' }}>AirNav Indonesia</div>
                </div>
              </td>
              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>METER READING</div>
              </td>
              <td style={{ width: '40px' }}></td>
            </tr>
          </tbody>
        </table>

        {/* ─── LOKASI / TGL / ILS LOCALIZER TITLE ────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ ...tdBorder, width: '55%' }}>
                <span style={{ fontWeight: 'bold' }}>LOKASI</span>
                <span style={{ marginLeft: '8px' }}>: {record.location}</span>
              </td>
              <td rowSpan={2} style={{ ...tdBorder, textAlign: 'center', verticalAlign: 'middle', background: '#f4b942', fontWeight: 'bold' }}>
                <div style={{ fontSize: '9px' }}>ILS</div>
                <div style={{ fontSize: '13px', letterSpacing: '1px' }}>LOCALIZER</div>
              </td>
              <td style={{ ...tdBorder }}>
                <div style={{ fontSize: '7px', color: '#555' }}>{record.form_number}</div>
              </td>
            </tr>
            <tr>
              <td style={{ ...tdBorder }}>
                <span style={{ fontWeight: 'bold' }}>TGL/JAM</span>
                <span style={{ marginLeft: '8px' }}>: {formatDate(record.date)} / {record.time_filled ?? '[diisi secara otomatis]'}</span>
              </td>
              <td style={{ ...tdBorder }}></td>
            </tr>
          </tbody>
        </table>

        {/* ─── MERK / TYPE ────────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ ...tdBorder, width: '50%' }}>
                <span style={{ fontWeight: 'bold' }}>MERK</span>
                <span style={{ marginLeft: '8px' }}>: {val(record.merk) || 'MOPIENS'}</span>
              </td>
              <td style={{ ...tdBorder, width: '50%' }}>
                <span style={{ fontWeight: 'bold' }}>TYPE</span>
                <span style={{ marginLeft: '8px' }}>: {val(record.type) || '500'}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── SECTION A — PERALATAN ──────────────────────────── */}
        <div style={{ border: '1px solid black', marginBottom: '4px', padding: '2px 4px', fontWeight: 'bold', fontSize: '9px', background: '#f0f0f0' }}>
          A. PERALATAN
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '4px' }}>
          <thead>
            <tr style={{ background: '#9dc3e6' }}>
              <th style={{ ...thBorder, width: '28px' }}>NO</th>
              <th style={{ ...thBorder }}>PEMBACAAN METER READING</th>
              <th style={{ ...thBorder, width: '70px' }}>NOMINAL</th>
              <th colSpan={2} style={{ ...thBorder, width: '140px' }}>HASIL PEMERIKSAAN</th>
              <th style={{ ...thBorder, width: '90px' }}>KETERANGAN</th>
            </tr>
            <tr style={{ background: '#bdd7ee' }}>
              <th style={{ ...thBorder }}></th>
              <th style={{ ...thBorder }}></th>
              <th style={{ ...thBorder, fontSize: '8px' }}>Standart</th>
              <th style={{ ...thBorder, width: '70px', fontSize: '8px' }}>TX1 / M1</th>
              <th style={{ ...thBorder, width: '70px', fontSize: '8px' }}>TX2 / M2</th>
              <th style={{ ...thBorder }}></th>
            </tr>
          </thead>
          <tbody>
            {Array.from(groups.entries()).map(([key, group]) => (
              <React.Fragment key={key}>
                <tr style={{ background: '#70ad47' }}>
                  <td style={{ ...tdBorder, textAlign: 'center', fontWeight: 'bold' }}>{group.header?.group_number}</td>
                  <td colSpan={5} style={{ ...tdBorder, fontWeight: 'bold' }}>{group.header?.group_name ?? ''}</td>
                </tr>
                {group.rows.map((item, rowIdx) => {
                  const isDual = item.hasil_layout === 'dual';
                  return (
                    <tr key={item.id} style={{ background: rowIdx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ ...tdBorder, textAlign: 'center' }}></td>
                      <td style={{ ...tdBorder }}>{val(item.item_name)}</td>
                      <td style={{ ...tdBorder, textAlign: 'center', fontSize: '8px' }}>{val(item.nominal)}</td>
                      <td style={{ ...tdBorder, textAlign: 'center' }}><ResultCell value={item.hasil_1} /></td>
                      <td style={{ ...tdBorder, textAlign: 'center' }}>
                        {isDual ? <ResultCell value={item.hasil_2} /> : <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td style={{ ...tdBorder }}>{val(item.keterangan)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* ─── SECTION B — LINGKUNGAN KERJA ───────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '6px' }}>
          <thead>
            <tr style={{ background: '#ffc000' }}>
              <th colSpan={5} style={{ ...thBorder, textAlign: 'left', fontWeight: 'bold' }}>
                B &nbsp; LINGKUNGAN KERJA
              </th>
            </tr>
            <tr style={{ background: '#9dc3e6' }}>
              <th style={{ ...thBorder, width: '28px' }}>NO</th>
              <th style={{ ...thBorder }}>KEGIATAN</th>
              <th style={{ ...thBorder, width: '70px' }}>Nominal</th>
              <th style={{ ...thBorder, width: '80px' }}>HASIL</th>
              <th style={{ ...thBorder, width: '90px' }}>KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {sectionBItems.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ ...tdBorder, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ ...tdBorder }}>{val(item.item_name)}</td>
                <td style={{ ...tdBorder, textAlign: 'center' }}>{val(item.nominal)}</td>
                <td style={{ ...tdBorder, textAlign: 'center' }}><ResultCell value={item.hasil_1} /></td>
                <td style={{ ...tdBorder }}>{val(item.keterangan)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── FOOTER — WAKTU PELAKSANAAN + SIGNATURE ─────────── */}
        <div style={{ border: '1px solid black' }}>
          {/* Waktu Pelaksanaan */}
          <div style={{ display: 'flex', borderBottom: '1px solid black', fontSize: '8px' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr', padding: '3px 6px', borderRight: '1px solid black' }}>
              <span style={{ fontWeight: 'bold' }}>Hari</span><span>: {record.day_name ?? '—'}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr', padding: '3px 6px', borderRight: '1px solid black' }}>
              <span style={{ fontWeight: 'bold' }}>Tanggal</span><span>: {formatDate(record.date)}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '40px 1fr', padding: '3px 6px' }}>
              <span style={{ fontWeight: 'bold' }}>Jam</span><span>: {record.time_filled ?? '—'}</span>
            </div>
          </div>

          {/* Signature row */}
          <div style={{ display: 'flex' }}>
            {/* Teknisi */}
            <div style={{ flex: 1, borderRight: '1px solid black' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>Teknisi</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thBorder, width: '24px' }}>No</th>
                    <th style={{ ...thBorder }}>Nama</th>
                    <th style={{ ...thBorder, width: '60px' }}>Paraf</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxTechRows }).map((_, idx) => {
                    const tech = technicians[idx];
                    return (
                      <tr key={idx} style={{ height: '36px' }}>
                        <td style={{ ...tdBorder, textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ ...tdBorder }}>{tech?.technician_name ?? ''}</td>
                        <td style={{ ...tdBorder, textAlign: 'center', verticalAlign: 'middle' }}>
                          {tech?.signature ? (
                            <img src={tech.signature} alt="TTD" style={{ maxHeight: '30px', maxWidth: '55px', margin: '0 auto' }} />
                          ) : tech ? (
                            <span style={{ fontSize: '7px', color: '#999', fontStyle: 'italic' }}>Belum TTD</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Supervisor */}
            <div style={{ width: '24%', borderRight: '1px solid black', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>SUPERVISOR</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px', minHeight: '80px' }}>
                {record.supervisor ? (
                  <>
                    <div style={{ fontSize: '7px', color: '#555', marginBottom: '4px' }}>{record.supervisor.name}</div>
                    {record.supervisor.signature ? (
                      <><img src={record.supervisor.signature} alt="TTD Supervisor" style={{ maxHeight: '50px', maxWidth: '90px' }} /><div style={{ fontSize: '6px', color: '#888', marginTop: '2px' }}>{formatSignedAt(record.supervisor.signed_at)}</div></>
                    ) : (
                      <div style={{ border: '1px dashed #aaa', width: '80px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic' }}>Belum TTD</span>
                      </div>
                    )}
                  </>
                ) : <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>Tidak ada supervisor pada shift ini</span>}
              </div>
            </div>

            {/* Manager Teknik */}
            <div style={{ width: '24%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>MANAGER TEKNIK</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px', minHeight: '80px' }}>
                {record.manager ? (
                  <>
                    <div style={{ fontSize: '7px', color: '#555', marginBottom: '4px' }}>{record.manager.name}</div>
                    {record.manager.signature ? (
                      <><img src={record.manager.signature} alt="TTD Manager" style={{ maxHeight: '50px', maxWidth: '90px' }} /><div style={{ fontSize: '6px', color: '#888', marginTop: '2px' }}>{formatSignedAt(record.manager.signed_at)}</div></>
                    ) : (
                      <div style={{ border: '1px dashed #aaa', width: '80px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic' }}>Belum TTD</span>
                      </div>
                    )}
                  </>
                ) : <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>Manager Teknik tidak ditugaskan</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
