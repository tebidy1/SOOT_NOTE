import { createBaseService } from './base.service';

const baseTemplateService = createBaseService('macros');

export const templateService = {
  ...baseTemplateService,

  async getTemplates(params?: Record<string, any>) {
    return baseTemplateService.getPaginated(params);
  },

  async getTemplateById(id: string | number) {
    return baseTemplateService.getById(id);
  },

  async createTemplate(data: any) {
    return baseTemplateService.create(data);
  },

  async updateTemplate(id: string | number, data: any) {
    return baseTemplateService.update(id, data);
  },

  async deleteTemplate(id: string | number) {
    return baseTemplateService.delete(id);
  },

  async searchTemplates(query: string, params?: Record<string, any>) {
    return baseTemplateService.getPaginated({ ...params, search: query });
  },

  async assignDepartments(id: string | number, medicalDepartmentIds: number[]) {
    return baseTemplateService.update(`${id}/assign-departments`, {
      medical_department_ids: medicalDepartmentIds,
    });
  },
};

export default templateService;
