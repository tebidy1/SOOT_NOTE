import { createBaseService } from './base.service';

const baseDepartmentService = createBaseService('medical-departments');

export const medicalDepartmentService = {
  ...baseDepartmentService,

  async getDepartments(params?: Record<string, any>) {
    return baseDepartmentService.getAll(params);
  },

  async getDepartmentById(id: string | number) {
    return baseDepartmentService.getById(id);
  },
};

export default medicalDepartmentService;
