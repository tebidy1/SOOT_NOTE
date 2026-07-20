import { createBaseService } from './base.service';

const baseMemberService = createBaseService('companies/users');

export const companyMemberService = {
  ...baseMemberService,

  async getMembers(params?: Record<string, any>) {
    return baseMemberService.getPaginated(params);
  },

  async getMemberById(id: string | number) {
    return baseMemberService.getById(id);
  },

  async createMember(data: any) {
    return baseMemberService.create(data);
  },

  async updateMember(id: string | number, data: any) {
    return baseMemberService.update(id, data);
  },

  async deleteMember(id: string | number) {
    return baseMemberService.delete(id);
  },

  async toggleMemberStatus(id: string | number) {
    return baseMemberService.customPatch(`companies/users/${id}/toggle-status`, {});
  },

  async updateMemberRole(id: string | number, role: string) {
    return baseMemberService.customPatch(`companies/users/${id}/role`, { role });
  },
};

export default companyMemberService;
