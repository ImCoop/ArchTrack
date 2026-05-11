import { apiClient } from '../../api/client';
import type { Role, User } from '../../types/auth';

export interface UserFilters {
  search?: string;
  role?: Role | 'all';
  departmentId?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  departmentId?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;

export const userApi = {
  async list(filters: UserFilters) {
    const params = {
      search: filters.search || undefined,
      role: filters.role === 'all' ? undefined : filters.role,
      departmentId: filters.departmentId || undefined,
    };
    const { data } = await apiClient.get<{ users: User[] }>('/users', { params });

    return data.users;
  },

  async create(input: CreateUserInput) {
    const { data } = await apiClient.post<{ user: User }>('/users', input);
    return data.user;
  },

  async update(id: string, input: UpdateUserInput) {
    const { data } = await apiClient.patch<{ user: User }>(`/users/${id}`, input);
    return data.user;
  },

  async delete(id: string) {
    await apiClient.delete(`/users/${id}`);
  },
};
