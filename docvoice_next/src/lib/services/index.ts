
export { baseApi } from './base.service';
export { createBaseService } from './base.service';
export type { BaseService } from './base.service';

export { authService } from './auth.service';
export { userService } from './user.service';
export { clientService } from './client.service';

export { companyService } from './company.service';
export { templateService } from './template.service';
export { medicalDepartmentService } from './medical-department.service';
export { dashboardService } from './dashboard.service';

export { ApiError } from '@/lib/api/api-error';
export type {
  ApiResponse,
  PaginatedResponse,
  ApiRequestOptions,
  RetryConfig,
  TokenPayload,
  AuthTokens,
} from '@/lib/api/types';
