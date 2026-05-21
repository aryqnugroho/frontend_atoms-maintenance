import axios from 'axios';
import type {
  GroundCheckGpListResponse,
  GroundCheckGpRecordDetail,
} from '@/types/groundCheckGp';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE = `${API_URL}/v1/ground-check/gp`;

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface GroundCheckGpFilters {
  search?: string;
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  per_page?: number;
  page?: number;
  [key: string]: string | number | undefined;
}

export const groundCheckGpService = {
  async list(filters: GroundCheckGpFilters = {}): Promise<GroundCheckGpListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params.append(key, String(value));
      }
    });
    const res = await axios.get(`${BASE}?${params.toString()}`, { headers: getAuthHeaders() });
    return res.data;
  },

  async getYears(): Promise<number[]> {
    const res = await axios.get(`${BASE}/years`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async getTemplate(): Promise<{ items: unknown[]; nav_items: unknown[] }> {
    const res = await axios.get(`${BASE}/template`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async create(data: { date: string; shift_type: string }): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const res = await axios.post(BASE, data, { headers: getAuthHeaders() });
    return res.data;
  },

  async getDetail(id: number): Promise<GroundCheckGpRecordDetail> {
    const res = await axios.get(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return res.data.data;
  },

  async update(id: number, data: {
    equipment_location?: string | null;
    equipment_function?: string | null;
    technical_data?: string | null;
    last_calibration?: string | null;
    time_filled?: string | null;
    nav_organization?: string | null;
    nav_analyzer_title?: string | null;
    items?: Array<{
      id: number;
      calibration_result?: string | null;
      tolerance?: string | null;
      tx1_hasil_pd?: string | null;
      tx1_in_tolerance?: string | null;
      tx1_out_of_tolerance?: string | null;
      tx2_hasil_pd?: string | null;
      tx2_in_tolerance?: string | null;
      tx2_out_of_tolerance?: string | null;
      keterangan?: string | null;
    }>;
    nav_items?: Array<{
      id: number;
      tx1_value?: string | null;
      tx2_value?: string | null;
      keterangan?: string | null;
    }>;
  }): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const res = await axios.put(`${BASE}/${id}`, data, { headers: getAuthHeaders() });
    return res.data;
  },

  async sign(id: number, data: {
    role: 'manager' | 'supervisor' | 'technician';
    signature: string;
    technician_row_id?: number;
  }): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const res = await axios.post(`${BASE}/${id}/sign`, data, { headers: getAuthHeaders() });
    return res.data;
  },

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const res = await axios.delete(`${BASE}/${id}`, { headers: getAuthHeaders() });
    return res.data;
  },

  // ─── Photos ──────────────────────────────────────────────────
  async uploadPhoto(
    id: number,
    file: File,
    caption?: string | null,
  ): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const token = sessionStorage.getItem('auth_token');
    const fd = new FormData();
    fd.append('photo', file);
    if (caption) fd.append('caption', caption);
    const res = await axios.post(`${BASE}/${id}/photos`, fd, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async updatePhotoCaption(
    id: number,
    photoId: number,
    caption: string | null,
  ): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const res = await axios.put(
      `${BASE}/${id}/photos/${photoId}`,
      { caption },
      { headers: getAuthHeaders() },
    );
    return res.data;
  },

  async deletePhoto(
    id: number,
    photoId: number,
  ): Promise<{ success: boolean; data: GroundCheckGpRecordDetail; message: string }> {
    const res = await axios.delete(`${BASE}/${id}/photos/${photoId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },
};
