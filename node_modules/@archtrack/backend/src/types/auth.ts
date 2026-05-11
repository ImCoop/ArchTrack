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
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  departmentId?: string;
  googleId?: string;
  googleRefreshToken?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'passwordHash' | 'googleRefreshToken'>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt?: string;
  replacedByTokenId?: string;
  createdAt: string;
}
