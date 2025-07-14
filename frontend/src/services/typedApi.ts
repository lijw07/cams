import axios, { AxiosInstance } from 'axios';
import type { paths } from '../types/api.generated';

// Create a typed axios client for openapi-typescript
type ApiClient = {
  get: <P extends keyof paths>(
    path: P,
    config?: paths[P] extends { get: any } ? paths[P]['get']['parameters'] : never
  ) => Promise<paths[P] extends { get: any } ? paths[P]['get']['responses']['200']['content']['application/json'] : never>;
  
  post: <P extends keyof paths>(
    path: P,
    data?: paths[P] extends { post: any } ? paths[P]['post']['requestBody']['content']['application/json'] : never,
    config?: paths[P] extends { post: any } ? paths[P]['post']['parameters'] : never
  ) => Promise<paths[P] extends { post: any } ? paths[P]['post']['responses']['200']['content']['application/json'] : never>;
  
  put: <P extends keyof paths>(
    path: P,
    data?: paths[P] extends { put: any } ? paths[P]['put']['requestBody']['content']['application/json'] : never,
    config?: paths[P] extends { put: any } ? paths[P]['put']['parameters'] : never
  ) => Promise<paths[P] extends { put: any } ? paths[P]['put']['responses']['200']['content']['application/json'] : never>;
  
  delete: <P extends keyof paths>(
    path: P,
    config?: paths[P] extends { delete: any } ? paths[P]['delete']['parameters'] : never
  ) => Promise<paths[P] extends { delete: any } ? paths[P]['delete']['responses']['200']['content']['application/json'] : never>;
};

// Export the typed API client using existing axios configuration
export const typedApi = (axiosInstance: AxiosInstance): ApiClient => ({
  get: async (path, config) => {
    const response = await axiosInstance.get(path, config);
    return response.data;
  },
  post: async (path, data, config) => {
    const response = await axiosInstance.post(path, data, config);
    return response.data;
  },
  put: async (path, data, config) => {
    const response = await axiosInstance.put(path, data, config);
    return response.data;
  },
  delete: async (path, config) => {
    const response = await axiosInstance.delete(path, config);
    return response.data;
  },
});

// Re-export generated types for easy access
export type { paths, components } from '../types/api.generated';