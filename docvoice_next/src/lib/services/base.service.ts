import { baseApi } from '@/lib/api/base-api';
import type { ApiRequestOptions, PaginatedResponse } from '@/lib/api/types';

export interface BaseService {
  getAll: (params?: Record<string, any>, options?: ApiRequestOptions) => Promise<any>;
  getById: (id: string | number, params?: Record<string, any>, options?: ApiRequestOptions) => Promise<any>;
  create: (data: any, options?: ApiRequestOptions) => Promise<any>;
  update: (id: string | number, data: any, options?: ApiRequestOptions) => Promise<any>;
  delete: (id: string | number, options?: ApiRequestOptions) => Promise<any>;
  customGet: (endpoint: string, options?: ApiRequestOptions) => Promise<any>;
  customPost: (endpoint: string, data?: any, options?: ApiRequestOptions) => Promise<any>;
  customPut: (endpoint: string, data?: any, options?: ApiRequestOptions) => Promise<any>;
  customPatch: (endpoint: string, data?: any, options?: ApiRequestOptions) => Promise<any>;
  customDelete: (endpoint: string, options?: ApiRequestOptions) => Promise<any>;
  getPaginated: (params?: Record<string, any>, options?: ApiRequestOptions) => Promise<PaginatedResponse>;
}

export const createBaseService = (resourcePath: string): BaseService => {
  const normalizedPath = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath;
  const basePath = normalizedPath.endsWith('/') ? normalizedPath.slice(0, -1) : normalizedPath;

  return {
    async getAll(params?, options?) {
      return baseApi.get(`/${basePath}`, { ...options, params });
    },

    async getById(id, params?, options?) {
      return baseApi.get(`/${basePath}/${id}`, { ...options, params });
    },

    async create(data, options?) {
      return baseApi.post(`/${basePath}`, data, options);
    },

    async update(id, data, options?) {
      return baseApi.put(`/${basePath}/${id}`, data, options);
    },

    async delete(id, options?) {
      return baseApi.delete(`/${basePath}/${id}`, options);
    },

    async customGet(endpoint, options?) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return baseApi.get(path, options);
    },

    async customPost(endpoint, data?, options?) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return baseApi.post(path, data, options);
    },

    async customPut(endpoint, data?, options?) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return baseApi.put(path, data, options);
    },

    async customPatch(endpoint, data?, options?) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return baseApi.patch(path, data, options);
    },

    async customDelete(endpoint, options?) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return baseApi.delete(path, options);
    },

    async getPaginated(params?, options?): Promise<any> {
      return baseApi.get(`/${basePath}`, { ...options, params });
    },
  };
};

export { baseApi };
