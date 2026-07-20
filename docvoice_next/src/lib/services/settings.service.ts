import { baseApi } from '@/lib/api/base-api';

const SETTINGS_PATH = 'settings';

export const settingsService = {
  async getAppSettings() {
    return baseApi.get(`/${SETTINGS_PATH}/app`);
  },

  async updateAppSettings(data: {
    app_name?: string;
    maintenance_enabled?: boolean;
    app_version_mobile?: string;
    force_update_mobile?: boolean;
    max_shipment_weight?: number;
    support_email?: string;
    support_phone?: string;
    currency?: string;
    logo?: File | null;
  }) {
    const formData = new FormData();
    
    if (data.app_name !== undefined) {
      formData.append('app_name', data.app_name);
    }
    if (data.maintenance_enabled !== undefined) {
      formData.append('maintenance_enabled', String(data.maintenance_enabled));
    }
    if (data.app_version_mobile !== undefined) {
      formData.append('app_version_mobile', data.app_version_mobile);
    }
    if (data.force_update_mobile !== undefined) {
      formData.append('force_update_mobile', String(data.force_update_mobile));
    }
    if (data.max_shipment_weight !== undefined) {
      formData.append('max_shipment_weight', String(data.max_shipment_weight));
    }
    if (data.support_email !== undefined) {
      formData.append('support_email', data.support_email);
    }
    if (data.support_phone !== undefined) {
      formData.append('support_phone', data.support_phone);
    }
    if (data.currency !== undefined) {
      formData.append('currency', data.currency);
    }
    if (data.logo instanceof File) {
      formData.append('logo', data.logo);
    }

    return baseApi.post(`/${SETTINGS_PATH}/app`, formData);
  },
};

export default settingsService;
