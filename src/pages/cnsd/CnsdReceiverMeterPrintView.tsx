import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cnsdReceiverMeterService } from '@/services/cnsdReceiverMeterService';
import type { CnsdReceiverMeterRecordDetail, CnsdReceiverMeterItem } from '@/types/cnsdReceiver';

// ─── Helpers ───────────────────────────────────────────────

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const formatSignedAt = (iso: string | null | undefined): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const val = (v: string | null | undefined): string => v ?? '';

// ─── Status cell renderer ──────────────────────────────────

const StatusCell: React.FC<{ value: string | null | undefined }> = ({ value }) => {
  if (!value) return <span className="text-gray-400 text-[9px]">—</span>;
  const isOnline = value === 'ON LINE';
  return (
    <span
      className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
        isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {value}
    </span>
  );
};

// ─── Print View Component ──────────────────────────────────

export const CnsdReceiverMeterPrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<CnsdReceiverMeterRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    cnsdReceiverMeterService
      .getRecord(Number(id))
      .then((data) => {
        setRecord(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError('Gagal memuat data form Receiver.');
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error ?? 'Form tidak ditemukan.'}</p>
      </div>
    );
  }

  // Group section 1 items by group
  const section1Items = record.items.filter((it) => it.section_code === '1');
  const section2Items = record.items.filter((it) => it.section_code === '2');

  // Build groups for section 1
  const groups: Map<string, { header: CnsdReceiverMeterItem | null; rows: CnsdReceiverMeterItem[] }> = new Map();
  for (const item of section1Items) {
    const key = `${item.group_number}-${item.group_name}`;
    if (!groups.has(key)) {
      groups.set(key, { header: null, rows: [] });
    }
    const g = groups.get(key)!;
    if (item.is_header) {
      g.header = item;
    } else {
      g.rows.push(item);
    }
  }

  const technicians = record.technicians;
  const maxTechRows = Math.max(technicians.length, 4);

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 8mm 10mm; }
            body { background: white !important; }
            .print-hide { display: none !important; }
            tr, td { page-break-inside: avoid; }
          }
          body { font-family: Arial, sans-serif; }
        `}
      </style>

      {/* Toolbar — screen only */}
      <div className="print-hide mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2 pt-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/cnsd/receiver-meter/${record.id}`)}
          className="gap-2"
        >
          <ArrowLeft size={16} /> Kembali
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer size={16} /> Print PDF
        </Button>
      </div>

      {/* A4 Document */}
      <div className="mx-auto bg-white text-black" style={{ width: '210mm', minHeight: '297mm', padding: '8mm 10mm', fontSize: '9px' }}>

        {/* ─── HEADER ─────────────────────────────────────────── */}
        <table className="w-full border-collapse mb-1" style={{ borderBottom: '2px solid black' }}>
          <tbody>
            <tr>
              {/* Logo + AirNav */}
              <td className="align-middle" style={{ width: '120px', paddingBottom: '4px' }}>
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/icon/logoairnav.svg"
                    alt="AirNav Indonesia"
                    style={{ height: '40px', width: 'auto' }}
                  />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a56db' }}>AirNav Indonesia</div>
                    <div style={{ fontSize: '7px', color: '#1a56db', fontWeight: '600' }}>FAS CNS &amp; OTOMASI</div>
                  </div>
                </div>
              </td>
              {/* Center — title */}
              <td className="text-center align-middle">
                <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>METER READING</div>
              </td>
              {/* Right — Perum info */}
              <td className="text-right align-top" style={{ width: '160px', fontSize: '7px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold' }}>Perum</div>
                <div style={{ fontWeight: 'bold', color: '#1a56db' }}>KANTOR CABANG SURABAYA</div>
                <div>Telp. (031)8888456 Fax : (031) 8888538</div>
                <div>email : sub@airnavindonesia.co.id</div>
                <div>Web : www.airnavindonesia.co.id</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── LOKASI / TGL / RECEIVER TITLE ─────────────────── */}
        <table className="w-full border-collapse" style={{ border: '1px solid black', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '3px 6px', width: '55%' }}>
                <div style={{ fontSize: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>LOKASI</span>
                  <span style={{ marginLeft: '8px' }}>: {record.location}</span>
                </div>
              </td>
              <td
                rowSpan={2}
                className="text-center align-middle"
                style={{ border: '1px solid black', padding: '4px', background: '#d0d0d0', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}
              >
                RECEIVER
              </td>
              <td style={{ border: '1px solid black', padding: '3px 6px' }}>
                {/* form number */}
                <div style={{ fontSize: '7px', color: '#555' }}>{record.form_number}</div>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '3px 6px' }}>
                <div style={{ fontSize: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>TGL/JAM</span>
                  <span style={{ marginLeft: '8px' }}>: {formatDate(record.date)} / {record.time_filled ?? '[diisi secara otomatis]'}</span>
                </div>
              </td>
              <td style={{ border: '1px solid black', padding: '3px 6px' }}>
                {/* empty */}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── MERK / TYPE / SN ───────────────────────────────── */}
        <table className="w-full border-collapse" style={{ border: '1px solid black', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '2px 6px', width: '33%' }}>
                <span style={{ fontWeight: 'bold' }}>MERK</span>
                <span style={{ marginLeft: '8px' }}>: {val(record.merk) || 'OTE / PAE / TELERAD'}</span>
              </td>
              <td style={{ border: '1px solid black', padding: '2px 6px', width: '33%' }}>
                <span style={{ fontWeight: 'bold' }}>TYPE</span>
                <span style={{ marginLeft: '8px' }}>: {val(record.type)}</span>
              </td>
              <td style={{ border: '1px solid black', padding: '2px 6px', width: '34%' }}>
                <span style={{ fontWeight: 'bold' }}>S N</span>
                <span style={{ marginLeft: '8px' }}>: {val(record.serial_number)}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ─── SECTION I — RECEIVER TABLE ─────────────────────── */}
        <table className="w-full border-collapse" style={{ border: '1px solid black', marginBottom: '4px' }}>
          <thead>
            <tr style={{ background: '#d0d0d0' }}>
              <th style={{ border: '1px solid black', padding: '3px', width: '28px', textAlign: 'center' }}>NO</th>
              <th style={{ border: '1px solid black', padding: '3px', textAlign: 'center' }}>PEMERIKSAAN</th>
              <th colSpan={2} style={{ border: '1px solid black', padding: '3px', textAlign: 'center', width: '160px' }}>STATUS</th>
              <th style={{ border: '1px solid black', padding: '3px', textAlign: 'center', width: '80px' }}>SEQUELSH ON</th>
              <th style={{ border: '1px solid black', padding: '3px', textAlign: 'center', width: '100px' }}>KETERANGAN</th>
            </tr>
            <tr style={{ background: '#e8e8e8' }}>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}></th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>2</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '80px' }}>A</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '80px' }}>B</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>5</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>6</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(groups.entries()).map(([key, group], groupIdx) => (
              <React.Fragment key={key}>
                {/* Group header row */}
                <tr style={{ background: '#c6efce' }}>
                  <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                    {groupIdx + 1}
                  </td>
                  <td colSpan={5} style={{ border: '1px solid black', padding: '2px 6px', fontWeight: 'bold', fontSize: '9px' }}>
                    {group.header?.group_name ?? ''}
                  </td>
                </tr>
                {/* Data rows */}
                {group.rows.map((item, rowIdx) => (
                  <tr key={item.id} style={{ background: rowIdx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}></td>
                    <td style={{ border: '1px solid black', padding: '2px 6px' }}>{val(item.item_name)}</td>
                    <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>
                      <StatusCell value={item.status_a} />
                    </td>
                    <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>
                      <StatusCell value={item.status_b} />
                    </td>
                    <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>
                      {val(item.sequelsh_on)}
                    </td>
                    <td style={{ border: '1px solid black', padding: '2px 6px' }}>
                      {val(item.keterangan)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* ─── SECTION II — LINGKUNGAN KERJA ──────────────────── */}
        <table className="w-full border-collapse" style={{ border: '1px solid black', marginBottom: '6px' }}>
          <thead>
            <tr style={{ background: '#ffc000' }}>
              <th colSpan={5} style={{ border: '1px solid black', padding: '3px 6px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px' }}>
                II &nbsp; LINGKUNGAN KERJA
              </th>
            </tr>
            <tr style={{ background: '#d0d0d0' }}>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '28px' }}>NO</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>KEGIATAN</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '80px' }}>NOMINAL</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '80px' }}>HASIL</th>
              <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '100px' }}>KETERANGAN</th>
            </tr>
          </thead>
          <tbody>
            {section2Items.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '2px 6px' }}>{val(item.item_name)}</td>
                <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{val(item.nominal)}</td>
                <td style={{ border: '1px solid black', padding: '2px 4px', textAlign: 'center' }}>{val(item.hasil)}</td>
                <td style={{ border: '1px solid black', padding: '2px 6px' }}>{val(item.keterangan)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── FOOTER — WAKTU PELAKSANAAN ─────────────────────── */}
        <div style={{ border: '1px solid black', marginBottom: '0' }}>
          {/* Waktu Pelaksanaan row */}
          <div style={{ display: 'flex', borderBottom: '1px solid black', fontSize: '8px' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr', padding: '3px 6px', borderRight: '1px solid black' }}>
              <span style={{ fontWeight: 'bold' }}>Hari</span>
              <span>: {record.day_name ?? '—'}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '60px 1fr', padding: '3px 6px', borderRight: '1px solid black' }}>
              <span style={{ fontWeight: 'bold' }}>Tanggal</span>
              <span>: {formatDate(record.date)}</span>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '40px 1fr', padding: '3px 6px' }}>
              <span style={{ fontWeight: 'bold' }}>Jam</span>
              <span>: {record.time_filled ?? '—'}</span>
            </div>
          </div>

          {/* Signature row */}
          <div style={{ display: 'flex' }}>
            {/* Teknisi table */}
            <div style={{ flex: 1, borderRight: '1px solid black' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>
                TEKNISI
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '24px' }}>No</th>
                    <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>Nama</th>
                    <th style={{ border: '1px solid black', padding: '2px', textAlign: 'center', width: '60px' }}>Paraf</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxTechRows }).map((_, idx) => {
                    const tech = technicians[idx];
                    return (
                      <tr key={idx} style={{ height: '36px' }}>
                        <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid black', padding: '2px 4px' }}>{tech?.technician_name ?? ''}</td>
                        <td style={{ border: '1px solid black', padding: '2px', textAlign: 'center', verticalAlign: 'middle' }}>
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
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>
                SUPERVISOR
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px', minHeight: '80px' }}>
                {record.supervisor ? (
                  <>
                    <div style={{ fontSize: '7px', color: '#555', marginBottom: '4px' }}>{record.supervisor.name}</div>
                    {record.supervisor.signature ? (
                      <>
                        <img src={record.supervisor.signature} alt="TTD Supervisor" style={{ maxHeight: '50px', maxWidth: '90px' }} />
                        <div style={{ fontSize: '6px', color: '#888', marginTop: '2px' }}>{formatSignedAt(record.supervisor.signed_at)}</div>
                      </>
                    ) : (
                      <div style={{ border: '1px dashed #aaa', width: '80px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic' }}>Belum TTD</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>
                    Tidak ada supervisor pada shift ini
                  </span>
                )}
              </div>
            </div>

            {/* Manager Teknik */}
            <div style={{ width: '24%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '3px', borderBottom: '1px solid black', fontSize: '8px', background: '#f0f0f0' }}>
                MANAGER TEKNIK
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px', minHeight: '80px' }}>
                {record.manager ? (
                  <>
                    <div style={{ fontSize: '7px', color: '#555', marginBottom: '4px' }}>{record.manager.name}</div>
                    {record.manager.signature ? (
                      <>
                        <img src={record.manager.signature} alt="TTD Manager" style={{ maxHeight: '50px', maxWidth: '90px' }} />
                        <div style={{ fontSize: '6px', color: '#888', marginTop: '2px' }}>{formatSignedAt(record.manager.signed_at)}</div>
                      </>
                    ) : (
                      <div style={{ border: '1px dashed #aaa', width: '80px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic' }}>Belum TTD</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '7px', color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>
                    Manager Teknik tidak ditugaskan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: '4px', fontSize: '7px', color: '#555' }}>
          (*) coret yang tidak perlu &nbsp;&nbsp; Kondisi: (√) Baik/Normal &nbsp;&nbsp; (x) Tidak Baik/Tidak Normal
        </div>
      </div>
    </>
  );
};
