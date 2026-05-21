import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import type { GroundCheckLlzCurvePoint } from '@/types/groundCheckLlz';
import { signedDegrees } from '@/types/groundCheckLlz';

/**
 * Ground Performance Curve chart for one transmitter.
 *
 * Each data point is (signed_degrees, ddm_pct) where signed_degrees is
 * negative for 90 Hz SIDE rows, 0 for centerline, positive for 150 Hz SIDE.
 * The Y-axis plots `tx{1|2}_ddm_pct` from the curve points table.
 */
interface Props {
  curvePoints: GroundCheckLlzCurvePoint[];
  tx: 'tx1' | 'tx2';
  title?: string;
  /** Distance label shown in subtitle, e.g. "300 Meter" */
  distance?: string;
  /** Render at print-friendly dimensions (smaller fonts, fixed height) */
  printMode?: boolean;
  /** Optional fixed pixel width for print embedding */
  width?: number;
  height?: number;
}

interface ChartPoint {
  x: number;        // signed degrees
  y: number | null; // ddm_pct
  label: string;    // formatted label for axis
}

export const GroundCheckLlzPerformanceChart: React.FC<Props> = ({
  curvePoints, tx, title, distance = '300 Meter', printMode = false, width, height,
}) => {
  const data: ChartPoint[] = useMemo(() => {
    const ddmKey = tx === 'tx1' ? 'tx1_ddm_pct' : 'tx2_ddm_pct';
    return [...curvePoints]
      .sort((a, b) => signedDegrees(a) - signedDegrees(b))
      .map((p) => ({
        x: signedDegrees(p),
        y: p[ddmKey],
        label: p.degrees === 0 ? '0°' : `${p.degrees}°`,
      }));
  }, [curvePoints, tx]);

  const titleText = title ?? `${tx.toUpperCase()} Ground Performance Curve`;
  const labelFontSize = printMode ? 9 : 10;
  const axisFontSize = printMode ? 9 : 11;
  const chartHeight = height ?? (printMode ? 200 : 280);

  // Build a clean axis ticks list — every measurement point degrees value
  const tickValues = data.map((d) => d.x);

  // Tick formatter: show absolute degrees (the form's convention is symmetric)
  const formatTick = (v: number): string => {
    if (v === 0) return '0°';
    return `${Math.abs(v)}°`;
  };

  const chartContent = (
    <LineChart data={data} margin={{ top: 24, right: 28, left: 8, bottom: 24 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis
        type="number"
        dataKey="x"
        ticks={tickValues}
        tickFormatter={formatTick}
        domain={[-37, 37]}
        tick={{ fontSize: axisFontSize, fill: '#475569' }}
        label={{ value: 'DEGREES', position: 'insideBottom', offset: -10, fontSize: axisFontSize, fill: '#475569' }}
      />
      <YAxis
        domain={[-40, 40]}
        ticks={[-40, -30, -20, -10, 0, 10, 20, 30, 40]}
        tick={{ fontSize: axisFontSize, fill: '#475569' }}
        label={{ value: 'DDM', angle: -90, position: 'insideLeft', fontSize: axisFontSize, fill: '#475569' }}
      />
      <ReferenceLine x={0} stroke="#64748b" strokeDasharray="2 2" />
      <ReferenceLine y={0} stroke="#cbd5e1" />
      <Tooltip
        formatter={(value) => [
          typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
          'DDM (%)',
        ]}
        labelFormatter={(label) => `Degrees: ${formatTick(Number(label))}`}
        contentStyle={{ fontSize: 11, padding: '4px 8px' }}
      />
      <Line
        type="linear"
        dataKey="y"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        dot={{ r: printMode ? 2.5 : 3.5, fill: '#0ea5e9' }}
        activeDot={{ r: 5 }}
        connectNulls={false}
        isAnimationActive={!printMode}
      >
        <LabelList
          dataKey="y"
          position="top"
          fontSize={labelFontSize}
          fill="#1e293b"
          formatter={(value: unknown) => {
            if (typeof value !== 'number' || Number.isNaN(value)) return '';
            return value.toFixed(2);
          }}
        />
      </Line>
    </LineChart>
  );

  return (
    <div className="bg-white">
      <div className="text-center mb-1">
        <p className={`font-bold text-slate-800 ${printMode ? 'text-[11px]' : 'text-sm'}`}>{titleText}</p>
        <p className={`text-slate-500 ${printMode ? 'text-[9px]' : 'text-xs'}`}>Distance {distance}</p>
      </div>
      {width ? (
        <div style={{ width, height: chartHeight }}>
          {chartContent}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          {chartContent}
        </ResponsiveContainer>
      )}
    </div>
  );
};
