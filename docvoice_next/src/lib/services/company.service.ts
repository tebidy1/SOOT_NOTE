import { createBaseService } from './base.service';

const baseCompanyService = createBaseService('admin/companies');

export const companyService = {
  ...baseCompanyService,

  async getCompanies(params?: Record<string, any>) {
    return baseCompanyService.getPaginated(params);
  },

  async getCompanyById(id: string | number) {
    return baseCompanyService.getById(id);
  },

  async createCompany(data: any) {
    return baseCompanyService.create(data);
  },

  async updateCompany(id: string | number, data: any) {
    return baseCompanyService.update(id, data);
  },

  async deleteCompany(id: string | number) {
    return baseCompanyService.delete(id);
  },

  async toggleCompanyStatus(id: string | number) {
    return baseCompanyService.customPatch(`admin/companies/${id}/toggle-status`, {});
  },

  async getCompanyUsers(params?: Record<string, any>) {
    return baseCompanyService.customGet(`companies/users`, { params });
  },

  async getCompanySettings(companyId: string | number) {
    return baseCompanyService.customGet(`admin/companies/${companyId}/settings`);
  },

  async updateCompanySettings(companyId: string | number, data: any) {
    return baseCompanyService.customPatch(`admin/companies/${companyId}/settings`, data);
  },

  async searchCompanies(query: string, params?: Record<string, any>) {
    return baseCompanyService.getPaginated({ ...params, search: query });
  },
};

export default companyService;
