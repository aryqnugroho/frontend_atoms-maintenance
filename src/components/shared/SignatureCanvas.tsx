import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (base64: string) => void;
  signerName: string;
  role: string;
  isLoading?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  isOpen,
  onClose,
  onConfirm,
  signerName,
  role,
  isLoading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const width = Math.max(320, Math.floor(wrapper.clientWidth));
    const height = width >= 400 ? 220 : 200;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setIsEmpty(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(prepareCanvas);
    window.addEventListener('resize', prepareCanvas);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', prepareCanvas);
    };
  }, [isOpen, prepareCanvas]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || isLoading) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !isDrawingRef.current || isLoading) return;

    event.preventDefault();
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingRef.current) {
      event.preventDefault();
      isDrawingRef.current = false;
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const handleClear = () => {
    prepareCanvas();
  };

  const handleClose = () => {
    prepareCanvas();
    onClose();
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    onConfirm(canvas.toDataURL('image/png'));
    prepareCanvas();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="signature-modal-title">
      <button className="fixed inset-0 bg-black/50" onClick={handleClose} aria-label="Tutup modal tanda tangan" />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{role}</p>
            <h2 id="signature-modal-title" className="mt-1 text-lg font-semibold text-slate-950">{signerName}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Tutup</span>
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <PenLine size={16} />
            <span>Gunakan jari, stylus, atau mouse untuk tanda tangan.</span>
          </div>

          <div ref={wrapperRef} className="w-full">
            <canvas
              ref={canvasRef}
              className={cn(
                'block min-h-[200px] w-full rounded-lg border border-slate-300 bg-white shadow-inner',
                'touch-none cursor-crosshair'
              )}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={handleClear} disabled={isLoading || isEmpty} className="gap-2">
              <Eraser size={16} />
              Clear
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
                Batal
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={isEmpty} isLoading={isLoading}>
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
