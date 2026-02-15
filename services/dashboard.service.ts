import { apiClient, ApiError } from './api';
import {
  type DashboardResponse,
  type ParentDashboardResponse,
  type AdminDashboardResponse,
  isParentDashboardResponse,
  isAdminDashboardResponse,
} from '@/types';

export type { DashboardResponse, ParentDashboardResponse, AdminDashboardResponse };

export interface DashboardService {
  /** GET /dashboard — returns parent or admin payload based on current user role. */
  getDashboard(): Promise<DashboardResponse>;
  /** GET /dashboard/export — admin/manager only; returns CSV string. */
  exportCsv(): Promise<string>;
}

class DashboardServiceImpl implements DashboardService {
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const data = await apiClient.get<DashboardResponse>('/dashboard');
      return data;
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to load dashboard.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }

  async exportCsv(): Promise<string> {
    try {
      return await apiClient.getAsText('/dashboard/export');
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        message: apiError.message || 'Failed to export dashboard.',
        status: apiError.status,
        data: apiError.data,
      } as ApiError;
    }
  }
}

export const dashboardService: DashboardService = new DashboardServiceImpl();

export { isParentDashboardResponse, isAdminDashboardResponse };
