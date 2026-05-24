import React, { useState } from 'react';
import { Save, Monitor as MonitorIcon } from 'lucide-react';
import axios from 'axios';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { monitorService } from '@/services/monitorService';

interface MonitorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Monitor Settings" — rotate the workshop TV kiosk gate password.
 *
 * Visible only to roles that the backend route also allows (Manager Teknik /
 * Supervisor CNSD / Supervisor TFP / Admin). Triggered from the avatar
 * dropdown in the Topbar.
 */
export const MonitorSettingsModal: React.FC<MonitorSettingsModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setIsSubmitting(true);
    try {
      await monitorService.updatePassword(currentPassword, newPassword);
      setSuccess('Password monitor berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const data = axios.isAxiosError(err) ? err.response?.data : null;
      const msg = (data as { message?: string } | null)?.message ?? 'Gagal mengubah password.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Monitor Settings" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2.5 text-xs text-rose-800 flex items-start gap-2">
          <MonitorIcon size={14} className="mt-0.5 shrink-0" />
          <p>
            Ganti password kiosk monitor di workshop. Password ini digunakan
            untuk membuka halaman <strong>/monitor</strong> dari TV ruang kerja.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
          >
            {success}
          </div>
        )}

        <Input
          label="Password Lama"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <Input
          label="Password Baru"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 6 karakter"
          autoComplete="new-password"
          required
        />
        <Input
          label="Konfirmasi Password Baru"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ulangi password baru"
          autoComplete="new-password"
          required
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Save size={15} /> Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
};
