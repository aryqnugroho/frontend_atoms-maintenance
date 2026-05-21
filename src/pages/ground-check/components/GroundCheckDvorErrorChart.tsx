import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import type { GroundCheckDvorBearingPoint } from '@/types/groundCheckDvor';

/**
 * VOR Error Curve chart for one transmitter (TX I or TX II).
 *
 * Each data point is (bearing, error) where:
 *   - bearing  : 0°..360° in 15° steps (fixed by the template)
 *   - error    : tx{1|2}_error (auto-computed from manual Reading entry)
 *
 * Paper form uses a scatter-like layout but with values connected;
 * we render a LineChart with markers for fidelity to the original chart.
 */
interface Props {
  bearingPoints: GroundCheckDvorBearingPoint[];
  tx: 'tx1' | 'tx2';
  title?: string;
  /** Render at print-friendly dimensions (smaller fonts, fixed height) */
  printMode?: boolean;
  /** Optional fixed pixel width for print embedding */
  width?: number;
  height?: number;
}

interface ChartPoint {
  x: number;        // bearing
  y: number | null; // error
}

export const GroundCheckDvorErrorChart: React.FC<Props> = ({
  bearingPoints, tx, title, printMode = false, width, height,
}) => {
  const data: ChartPoint[] = useMemo(() => {
    const errKey = tx === 'tx1' ? 'tx1_error' : 'tx2_error';
    return [...bearingPoints]
      .sort((a, b) => a.bearing - b.bearing)
      .map((p) => ({
        x: p.bearing,
        y: p[errKey],
      }));
  }, [bearingPoints, tx]);

  const titleText = title ?? `TX ${tx === 'tx1' ? 'I' : 'II'} Error Curve`;
  const labelFontSize = printMode ? 8 : 10;
  const axisFontSize = printMode ? 9 : 11;
  const chartHeight = height ?? (printMode ? 220 : 320);

  // Compute Y domain dynamically: tighten around data, fall back to ±0.7
  const yDomain = useMemo<[number, number]>(() => {
    const vals = data.map((d) => d.y).filter((v): v is number => v !== null && !Number.isNaN(v));
    if (vals.length === 0) return [-0.7, 0.5];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(0.1, (max - min) * 0.2);
    return [Number((min - pad).toFixed(2)), Number((max + pad).toFixed(2))];
  }, [data]);

  // X-axis ticks: every 30° for readability (the data has 15° but ticks every 30°)
  const tickValues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360];

  const formatTick = (v: number): string => `${v}`;

  const chartContent = (
    <LineChart data={data} margin={{ top: 24, right: 24, left: 8, bottom: 24 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis
        type="number"
        dataKey="x"
        ticks={tickValues}
        tickFormatter={formatTick}
        domain={[0, 360]}
        tick={{ fontSize: axisFontSize, fill: '#475569' }}
        label={{ value: 'Bearing', position: 'insideBottom', offset: -10, fontSize: axisFontSize, fill: '#475569' }}
      />
      <YAxis
        domain={yDomain}
        tick={{ fontSize: axisFontSize, fill: '#475569' }}
        label={{ value: 'Error', angle: -90, position: 'insideLeft', fontSize: axisFontSize, fill: '#475569' }}
      />
      <ReferenceLine y={0} stroke="#cbd5e1" />
      <Tooltip
        formatter={(value) => [
          typeof value === 'number' ? value.toFixed(2) : String(value ?? ''),
          'Error',
        ]}
        labelFormatter={(label) => `Bearing: ${label}°`}
        contentStyle={{ fontSize: 11, padding: '4px 8px' }}
      />
      <Line
        type="linear"
        dataKey="y"
        stroke="#0ea5e9"
        strokeWidth={1.4}
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
