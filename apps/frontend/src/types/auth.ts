export const roles = [
  'admin',
  'project_manager',
  'designer',
  'drafter',
  'estimator',
  'accounting',
  'viewer',
] as const;

export type Role = (typeof roles)[number];

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  departmentId?: string;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
