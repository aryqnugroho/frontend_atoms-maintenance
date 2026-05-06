// ─── ILS Localizer Form Data Constants ───────────────────────────────────────

export interface BuiltInParam {
  no: string;
  parameter: string;
  afterCalibration: string;
  tolerance: string;
  isHeader?: boolean;
  isSubSection?: boolean;
  txBoth?: boolean; // if false, only one TX column shown
}

export interface AdditionalParam {
  no: string;
  parameter: string;
  afterCalibration: string;
  tolerance: string;
  isHeader?: boolean;
}

export interface DegreeRow {
  degrees: number | string; // e.g. 35, 1.85, 0
  label: string;            // display label e.g. "35°", "1.85°", "0°"
  jarakM: number;
  side: 'left' | 'center' | 'right'; // left = negative DDM side, center = 0, right = positive
}

export const BUILT_IN_PARAMS: BuiltInParam[] = [
  { no: '', parameter: 'PARAMETER PERALATAN (BUILT IN TEST)', afterCalibration: '', tolerance: '', isHeader: true },
  { no: '1', parameter: 'RF POWER LEVEL', afterCalibration: '15.9 W', tolerance: 'P_BCI (Commissioning) - 15,15 W' },
  { no: '2', parameter: 'COURSE ALIGNMENT', afterCalibration: '0.01', tolerance: '0.0000 DDM ±0.0015' },
  { no: '3', parameter: 'DEPTH OF MODULATION', afterCalibration: '20,50%', tolerance: '20% ±2%' },
  { no: '4', parameter: 'SUM OF MODULATION DEPTHS', afterCalibration: '40,90%', tolerance: '40% ±4%' },
  { no: '5', parameter: 'IDENTIFICATION MODULATION DEPTH', afterCalibration: '9.8%', tolerance: '10% ± 5%' },
  { no: '6', parameter: 'MONITORING :', afterCalibration: '', tolerance: '', isSubSection: true },
  { no: '', parameter: '- COURSE SHIFT', afterCalibration: 'OK', tolerance: '10.5 M' },
  { no: '', parameter: '- CHANGE IN DISPLACEMENT', afterCalibration: '0,155', tolerance: '0,17' },
  { no: '', parameter: '- CLEARANCE SIGNAL', afterCalibration: '150', tolerance: '150 µA' },
  { no: '', parameter: '- TOTAL TIME OF OUT OF TOLERANCE RADIATION', afterCalibration: '10', tolerance: '10 s' },
  { no: '', parameter: '- REDUCTION IN POWER', afterCalibration: '0', tolerance: '-3 dB dari Comm' },
  { no: '7', parameter: 'INTERCONNECTION', afterCalibration: '', tolerance: '' },
  { no: '8', parameter: 'ANTENA', afterCalibration: '', tolerance: '' },
  { no: '9', parameter: 'CHANGE OVER (MAIN TO STANDBY)', afterCalibration: '2', tolerance: '10 s' },
  { no: '10', parameter: 'INDICATOR LAMP & METERING', afterCalibration: '', tolerance: '' },
  { no: '11', parameter: 'REMOTE CONTROL AND MONITORING', afterCalibration: '', tolerance: '' },
];

export const ADDITIONAL_PARAMS: AdditionalParam[] = [
  { no: '', parameter: 'ADDITIONAL TEST EQUIPMENT', afterCalibration: '', tolerance: '', isHeader: true },
  { no: '1', parameter: 'RF POWER LEVEL', afterCalibration: '-28,5', tolerance: 'Field strength Comm - 3' },
  { no: '2', parameter: 'COURSE ALIGNMENT', afterCalibration: '9.6', tolerance: '<10.5 meter (35 ft)' },
  { no: '3', parameter: 'DISPLACEMENT SENSITIVITY', afterCalibration: '-10,54%', tolerance: '0,00145 DDM/m ±17%' },
  { no: '4', parameter: 'SPURIOUS MODULATION', afterCalibration: '', tolerance: '<0,005 DDM peak to' },
  { no: '5', parameter: 'DEPTH OF MODULATION', afterCalibration: '20.4', tolerance: '20% ±2%' },
  { no: '6', parameter: 'SUM OF MODULATION DEPTHS', afterCalibration: '40,86%', tolerance: 'Modulation depth <95%' },
  { no: '7', parameter: 'ORIENTATION', afterCalibration: 'CORRECT', tolerance: 'Correct' },
  { no: '8', parameter: 'FREQUENCY', afterCalibration: '10', tolerance: 'Single frequency\nDual frequency : 0.002%\n5kHz < Diff < 14 kHz' },
  { no: '9', parameter: 'CARRIER MODULATION FREQUENCY', afterCalibration: '110,1', tolerance: '' },
  { no: '10', parameter: 'IDENTIFICATION TONE FREQUENCY', afterCalibration: '1020', tolerance: '1020 ±50Hz' },
  { no: '11', parameter: 'IDENTIFICATION MODULATION DEPTH', afterCalibration: '10', tolerance: '10% - 5%' },
  { no: '12', parameter: 'IDENTIFICATION SPEED', afterCalibration: 'OK', tolerance: '7 words / menit' },
  { no: '13', parameter: 'IDENTIFICATION REPETITION RATE', afterCalibration: 'OK', tolerance: 'As commissioning' },
];

// Degrees axis - from 35° left to 35° right
export const DEGREE_ROWS: DegreeRow[] = [
  { degrees: 35, label: '35°', jarakM: 210.1, side: 'left' },
  { degrees: 30, label: '30°', jarakM: 173.2, side: 'left' },
  { degrees: 25, label: '25°', jarakM: 139.9, side: 'left' },
  { degrees: 20, label: '20°', jarakM: 109.2, side: 'left' },
  { degrees: 15, label: '15°', jarakM: 80.4, side: 'left' },
  { degrees: 10, label: '10°', jarakM: 52.9, side: 'left' },
  { degrees: 5, label: '5°', jarakM: 26.2, side: 'left' },
  { degrees: 1.85, label: '1.85°', jarakM: 9.7, side: 'left' },
  { degrees: 0, label: '0°', jarakM: 0, side: 'center' },
  { degrees: 1.85, label: '1.85°', jarakM: 9.7, side: 'right' },
  { degrees: 5, label: '5°', jarakM: 26.2, side: 'right' },
  { degrees: 10, label: '10°', jarakM: 52.9, side: 'right' },
  { degrees: 15, label: '15°', jarakM: 80.4, side: 'right' },
  { degrees: 20, label: '20°', jarakM: 109.2, side: 'right' },
  { degrees: 25, label: '25°', jarakM: 139.9, side: 'right' },
  { degrees: 30, label: '30°', jarakM: 173.2, side: 'right' },
  { degrees: 35, label: '35°', jarakM: 210.1, side: 'right' },
];

export const CURVE_FIELDS = ['ddmPct', 'ddmUa', 'sumPct', 'mod90', 'mod150', 'rfLevel'] as const;
export type CurveField = typeof CURVE_FIELDS[number];

export const CURVE_FIELD_LABELS: Record<CurveField, string> = {
  ddmPct: 'DDM (%)',
  ddmUa: 'DDM (µA)',
  sumPct: 'SUM (%)',
  mod90: 'MOD 90 Hz',
  mod150: 'MOD 150 Hz',
  rfLevel: 'RF LEVEL (dB)',
};

// Default reference data from the document for TX1 and TX2
export const TX1_DEFAULT: Record<number, Partial<Record<CurveField, string>>> = {
  0: { ddmPct: '-29.26', ddmUa: '-283.2', sumPct: '40.16%', mod90: '34.31%', mod150: '5.85%', rfLevel: '-52.22' },
  1: { ddmPct: '-29.58', ddmUa: '-286.3', sumPct: '40.08%', mod90: '33.46%', mod150: '6.62%', rfLevel: '-46.83' },
  2: { ddmPct: '-31.42', ddmUa: '-304.1', sumPct: '40.14%', mod90: '35.79%', mod150: '4.35%', rfLevel: '-46.29' },
  3: { ddmPct: '-30.95', ddmUa: '-299.5', sumPct: '39.59%', mod90: '34.42%', mod150: '5.17%', rfLevel: '-47.33' },
  4: { ddmPct: '-26.75', ddmUa: '-258.9', sumPct: '40.02%', mod90: '33.37%', mod150: '6.65%', rfLevel: '-44.16' },
  5: { ddmPct: '-25.55', ddmUa: '-247.3', sumPct: '40.02%', mod90: '32.80%', mod150: '7.22%', rfLevel: '-41.49' },
  6: { ddmPct: '-25.69', ddmUa: '-248.6', sumPct: '40.54%', mod90: '33.11%', mod150: '7.43%', rfLevel: '-35.06' },
  7: { ddmPct: '-12.68', ddmUa: '-122.7', sumPct: '40.97%', mod90: '26.88%', mod150: '14.09%', rfLevel: '-51.89' },
  8: { ddmPct: '-0.26', ddmUa: '-2.5', sumPct: '40.95%', mod90: '20.55%', mod150: '20.40%', rfLevel: '-31.03' },
  9: { ddmPct: '12.29', ddmUa: '118.9', sumPct: '40.89%', mod90: '14.32%', mod150: '26.57%', rfLevel: '-51.69' },
  10: { ddmPct: '24.65', ddmUa: '238.5', sumPct: '40.46%', mod90: '7.87%', mod150: '32.59%', rfLevel: '-35.45' },
  11: { ddmPct: '24.37', ddmUa: '235.8', sumPct: '40.00%', mod90: '7.82%', mod150: '32.18%', rfLevel: '-40.73' },
  12: { ddmPct: '24.18', ddmUa: '234.0', sumPct: '40.02%', mod90: '7.89%', mod150: '32.13%', rfLevel: '-43.92' },
  13: { ddmPct: '28.11', ddmUa: '272.0', sumPct: '40.01%', mod90: '5.95%', mod150: '34.06%', rfLevel: '-48.6' },
  14: { ddmPct: '28.32', ddmUa: '274.1', sumPct: '40.02%', mod90: '5.82%', mod150: '34.50%', rfLevel: '-44.65' },
  15: { ddmPct: '28.17', ddmUa: '272.6', sumPct: '40.34%', mod90: '5.65%', mod150: '34.69%', rfLevel: '-42.4' },
  16: { ddmPct: '28.02', ddmUa: '271.2', sumPct: '40.60%', mod90: '5.63%', mod150: '34.97%', rfLevel: '-48.42' },
};

export const TX2_DEFAULT: Record<number, Partial<Record<CurveField, string>>> = {
  0: { ddmPct: '-27.82', ddmUa: '-269.23', sumPct: '40.08%', mod90: '33.38%', mod150: '6.70%', rfLevel: '-52.72' },
  1: { ddmPct: '-28.94', ddmUa: '-280.06', sumPct: '40.11%', mod90: '33.20%', mod150: '6.91%', rfLevel: '-48.91' },
  2: { ddmPct: '-30.32', ddmUa: '-293.42', sumPct: '40.39%', mod90: '35.42%', mod150: '4.77%', rfLevel: '-48.21' },
  3: { ddmPct: '-30.69', ddmUa: '-297.00', sumPct: '40.11%', mod90: '35.42%', mod150: '4.69%', rfLevel: '-47.10' },
  4: { ddmPct: '-25.03', ddmUa: '-242.23', sumPct: '40.14%', mod90: '32.59%', mod150: '7.55%', rfLevel: '-41.14' },
  5: { ddmPct: '-25.20', ddmUa: '-243.87', sumPct: '40.08%', mod90: '32.64%', mod150: '7.44%', rfLevel: '-40.54' },
  6: { ddmPct: '-25.72', ddmUa: '-248.90', sumPct: '40.57%', mod90: '33.15%', mod150: '7.42%', rfLevel: '-34.40' },
  7: { ddmPct: '-10.82', ddmUa: '-104.71', sumPct: '40.86%', mod90: '25.84%', mod150: '15.02%', rfLevel: '-28.69' },
  8: { ddmPct: '-0.58', ddmUa: '-5.61', sumPct: '40.98%', mod90: '20.78%', mod150: '20.20%', rfLevel: '-26.65' },
  9: { ddmPct: '12.42', ddmUa: '120.19', sumPct: '40.86%', mod90: '14.24%', mod150: '26.62%', rfLevel: '-51.65' },
  10: { ddmPct: '24.72', ddmUa: '239.23', sumPct: '40.62%', mod90: '7.93%', mod150: '32.69%', rfLevel: '-34.18' },
  11: { ddmPct: '24.18', ddmUa: '234.00', sumPct: '40.03%', mod90: '8.13%', mod150: '31.95%', rfLevel: '-40.14' },
  12: { ddmPct: '23.79', ddmUa: '230.23', sumPct: '40.08%', mod90: '8.13%', mod150: '31.95%', rfLevel: '-44.19' },
  13: { ddmPct: '27.60', ddmUa: '267.10', sumPct: '40.02%', mod90: '6.21%', mod150: '33.81%', rfLevel: '-49.08' },
  14: { ddmPct: '28.92', ddmUa: '279.87', sumPct: '40.00%', mod90: '5.54%', mod150: '34.46%', rfLevel: '-45.22' },
  15: { ddmPct: '28.04', ddmUa: '271.35', sumPct: '40.02%', mod90: '5.99%', mod150: '34.03%', rfLevel: '-45.20' },
  16: { ddmPct: '27.94', ddmUa: '270.39', sumPct: '40.82%', mod90: '5.09%', mod150: '35.73%', rfLevel: '-48.63' },
};
